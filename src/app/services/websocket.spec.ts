import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { APP_CONFIG } from '../app-config';
import { Auth } from './auth';
import { CommentRealtimeEvent, WebSocketService } from './websocket';

class FakeWebSocket {
  static readonly OPEN = 1;
  static readonly CLOSED = 3;
  static instances: FakeWebSocket[] = [];

  readonly sent: string[] = [];
  readyState = 0;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;

  constructor(readonly url: string) {
    FakeWebSocket.instances.push(this);
  }

  open(): void {
    this.readyState = FakeWebSocket.OPEN;
    this.onopen?.(new Event('open'));
  }

  send(message: string): void {
    this.sent.push(message);
  }

  close(): void {
    if (this.readyState === FakeWebSocket.CLOSED) {
      return;
    }

    this.readyState = FakeWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close'));
  }

  receive(message: unknown): void {
    this.onmessage?.(new MessageEvent('message', { data: JSON.stringify(message) }));
  }
}

describe('WebSocketService', () => {
  const sessionResolved = signal(true);
  const isAuthenticated = signal(false);
  const getAccessToken = vi.fn<() => Promise<string>>();

  function createService(authenticated = false): {
    service: WebSocketService;
    http: HttpTestingController;
  } {
    sessionResolved.set(true);
    isAuthenticated.set(authenticated);
    getAccessToken.mockResolvedValue('access-token');

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        WebSocketService,
        {
          provide: Auth,
          useValue: { sessionResolved, isAuthenticated, getAccessToken },
        },
      ],
    });

    const service = TestBed.inject(WebSocketService);
    TestBed.flushEffects();

    return { service, http: TestBed.inject(HttpTestingController) };
  }

  beforeEach(() => {
    vi.useFakeTimers();
    FakeWebSocket.instances = [];
    getAccessToken.mockReset();
    vi.stubGlobal('WebSocket', FakeWebSocket);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('connects anonymous clients directly and restores the active school after reconnect', async () => {
    const { service, http } = createService();

    expect(FakeWebSocket.instances[0].url).toBe(APP_CONFIG.websocketUrl);

    service.subscribeSchool('public', 'base-school-id');
    const socket = FakeWebSocket.instances[0];
    socket.open();

    expect(socket.sent).toEqual([
      JSON.stringify({
        action: 'subscribe-school',
        sector: 'public',
        school_id: 'base-school-id',
      }),
    ]);

    socket.close();
    await vi.advanceTimersByTimeAsync(1_000);
    const reconnectedSocket = FakeWebSocket.instances[1];
    reconnectedSocket.open();

    expect(reconnectedSocket.sent).toEqual([
      JSON.stringify({
        action: 'subscribe-school',
        sector: 'public',
        school_id: 'base-school-id',
      }),
    ]);

    service.disconnect();
    http.verify();
  });

  it('uses a REST ticket for authenticated connections without sending a user subscription', async () => {
    const { service, http } = createService(true);
    await Promise.resolve();

    const request = http.expectOne('/api/websocket-ticket');
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('Authorization')).toBe('Bearer access-token');
    request.flush({ ticket: 'single use/+/ticket' });
    await vi.advanceTimersByTimeAsync(0);

    const socket = FakeWebSocket.instances[0];
    expect(socket.url).toBe(`${APP_CONFIG.websocketUrl}?ticket=single%20use%2F%2B%2Fticket`);
    socket.open();
    expect(socket.sent).toEqual([]);

    service.disconnect();
    http.verify();
  });

  it('gets a fresh ticket before every authenticated reconnect', async () => {
    const { service, http } = createService(true);
    await Promise.resolve();

    http.expectOne('/api/websocket-ticket').flush({ ticket: 'first-ticket' });
    await vi.advanceTimersByTimeAsync(0);
    FakeWebSocket.instances[0].open();
    FakeWebSocket.instances[0].close();

    await vi.advanceTimersByTimeAsync(1_000);
    const reconnectRequest = http.expectOne('/api/websocket-ticket');
    reconnectRequest.flush({ ticket: 'second-ticket' });
    await vi.advanceTimersByTimeAsync(0);

    expect(getAccessToken).toHaveBeenCalledTimes(2);
    expect(FakeWebSocket.instances[1].url).toBe(`${APP_CONFIG.websocketUrl}?ticket=second-ticket`);

    service.disconnect();
    http.verify();
  });

  it('routes supported comment events and ignores unsupported payloads', () => {
    const { service } = createService();
    const listener = vi.fn<(event: CommentRealtimeEvent) => void>();
    const removeListener = service.onCommentEvent(listener);
    const socket = FakeWebSocket.instances[0];

    socket.receive({ event: 'comment-created', data: { comment_id: 'comment-1' } });
    socket.receive({ event: 'unknown', data: { comment_id: 'comment-2' } });
    removeListener();
    socket.receive({ event: 'comment-deleted', data: { comment_id: 'comment-1' } });

    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledWith({
      event: 'comment-created',
      data: { comment_id: 'comment-1' },
    });
  });

  it('replaces the socket when authentication state changes', async () => {
    const { service, http } = createService();
    const anonymousSocket = FakeWebSocket.instances[0];
    anonymousSocket.open();

    isAuthenticated.set(true);
    TestBed.flushEffects();
    await Promise.resolve();

    expect(anonymousSocket.readyState).toBe(FakeWebSocket.CLOSED);
    http.expectOne('/api/websocket-ticket').flush({ ticket: 'signed-in-ticket' });
    await vi.advanceTimersByTimeAsync(0);

    const authenticatedSocket = FakeWebSocket.instances[1];
    authenticatedSocket.open();
    expect(authenticatedSocket.url).toContain('?ticket=signed-in-ticket');

    isAuthenticated.set(false);
    TestBed.flushEffects();

    expect(authenticatedSocket.readyState).toBe(FakeWebSocket.CLOSED);
    expect(FakeWebSocket.instances[2].url).toBe(APP_CONFIG.websocketUrl);

    service.disconnect();
    http.verify();
  });

  it('unsubscribes the active school and does not reconnect after intentional disconnect', async () => {
    const { service } = createService();
    const socket = FakeWebSocket.instances[0];
    socket.open();

    const release = service.subscribeSchool('private', 'private-base-id');
    release();

    expect(socket.sent).toEqual([
      JSON.stringify({
        action: 'subscribe-school',
        sector: 'private',
        school_id: 'private-base-id',
      }),
      JSON.stringify({
        action: 'unsubscribe-school',
        sector: 'private',
        school_id: 'private-base-id',
      }),
    ]);

    service.disconnect();
    await vi.runAllTimersAsync();

    expect(FakeWebSocket.instances).toHaveLength(1);
    expect(service.connectionState()).toBe('disconnected');
  });
});
