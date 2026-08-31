import { HttpClient } from '@angular/common/http';
import { OnDestroy, Service, effect, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { APP_CONFIG } from '../app-config';
import { Auth } from './auth';

export type WebSocketConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export interface CommentRealtimeEvent {
  event: 'comment-created' | 'comment-deleted';
  data: {
    comment_id: string;
  };
}

interface SchoolSubscription {
  sector: 'public' | 'private';
  schoolId: string;
  lease: number;
}

interface TicketResponse {
  ticket: string;
}

const INITIAL_RECONNECT_DELAY_MS = 1_000;
const MAX_RECONNECT_DELAY_MS = 10_000;

/** Owns the application's shared API Gateway WebSocket connection. */
@Service()
export class WebSocketService implements OnDestroy {
  readonly connectionState = signal<WebSocketConnectionState>('disconnected');

  private readonly auth = inject(Auth);
  private readonly http = inject(HttpClient);
  private readonly listeners = new Set<(event: CommentRealtimeEvent) => void>();

  private socket: WebSocket | null = null;
  private activeSchool: SchoolSubscription | null = null;
  private reconnectTimer: number | null = null;
  private reconnectDelay = INITIAL_RECONNECT_DELAY_MS;
  private generation = 0;
  private schoolLease = 0;
  private intentionallyDisconnected = false;
  private lastAuthenticatedState: boolean | null = null;

  private readonly authStateEffect = effect(() => {
    if (!this.auth.sessionResolved()) {
      return;
    }

    const authenticated = this.auth.isAuthenticated();

    if (authenticated === this.lastAuthenticatedState && !this.intentionallyDisconnected) {
      return;
    }

    this.lastAuthenticatedState = authenticated;
    this.restart(authenticated);
  });

  onCommentEvent(listener: (event: CommentRealtimeEvent) => void): () => void {
    this.listeners.add(listener);

    return () => this.listeners.delete(listener);
  }

  /**
   * Makes this school the active topic and returns a route-owned release function.
   * A stale release cannot unsubscribe a newer school selection.
   */
  subscribeSchool(sector: 'public' | 'private', schoolId: string): () => void {
    const previous = this.activeSchool;
    const lease = ++this.schoolLease;

    if (previous && (previous.sector !== sector || previous.schoolId !== schoolId)) {
      this.sendSchoolAction('unsubscribe-school', previous);
    }

    this.activeSchool = { sector, schoolId, lease };

    if (!previous || previous.sector !== sector || previous.schoolId !== schoolId) {
      this.sendSchoolAction('subscribe-school', this.activeSchool);
    }

    return () => {
      if (this.activeSchool?.lease !== lease) {
        return;
      }

      this.sendSchoolAction('unsubscribe-school', this.activeSchool);
      this.activeSchool = null;
    };
  }

  /** Permanently stops reconnecting until a later authentication transition. */
  disconnect(): void {
    this.intentionallyDisconnected = true;
    this.generation += 1;
    this.clearReconnectTimer();

    const socket = this.socket;
    this.socket = null;
    socket?.close();

    this.connectionState.set('disconnected');
  }

  ngOnDestroy(): void {
    this.authStateEffect.destroy();
    this.disconnect();
    this.listeners.clear();
  }

  private restart(authenticated: boolean): void {
    this.intentionallyDisconnected = false;
    this.generation += 1;
    this.clearReconnectTimer();
    this.reconnectDelay = INITIAL_RECONNECT_DELAY_MS;

    const previousSocket = this.socket;
    this.socket = null;
    previousSocket?.close();

    this.connectionState.set('connecting');
    void this.connect(this.generation, authenticated);
  }

  private async connect(generation: number, authenticated: boolean): Promise<void> {
    try {
      const url = authenticated
        ? await this.getAuthenticatedWebSocketUrl()
        : APP_CONFIG.websocketUrl;

      if (generation !== this.generation || this.intentionallyDisconnected) {
        return;
      }

      const socket = new WebSocket(url);
      this.socket = socket;

      socket.onopen = () => {
        if (generation !== this.generation || socket !== this.socket) {
          socket.close();
          return;
        }

        this.reconnectDelay = INITIAL_RECONNECT_DELAY_MS;
        this.connectionState.set('connected');

        if (this.activeSchool) {
          this.sendSchoolAction('subscribe-school', this.activeSchool);
        }
      };

      socket.onmessage = (message) => this.handleMessage(message);

      socket.onclose = () => {
        if (generation !== this.generation || socket !== this.socket) {
          return;
        }

        this.socket = null;
        this.scheduleReconnect(generation, authenticated);
      };
    } catch (error) {
      if (generation !== this.generation || this.intentionallyDisconnected) {
        return;
      }

      console.error('Unable to establish realtime connection:', error);
      this.scheduleReconnect(generation, authenticated);
    }
  }

  private async getAuthenticatedWebSocketUrl(): Promise<string> {
    const accessToken = await this.auth.getAccessToken();
    const { ticket } = await firstValueFrom(
      this.http.post<TicketResponse>(
        '/api/websocket-ticket',
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      ),
    );

    if (!ticket) {
      throw new Error('WebSocket ticket response was empty');
    }

    return `${APP_CONFIG.websocketUrl}?ticket=${encodeURIComponent(ticket)}`;
  }

  private scheduleReconnect(generation: number, authenticated: boolean): void {
    if (this.intentionallyDisconnected || generation !== this.generation) {
      return;
    }

    this.connectionState.set('reconnecting');
    const delay = this.reconnectDelay;
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, MAX_RECONNECT_DELAY_MS);

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      void this.connect(generation, authenticated);
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer === null) {
      return;
    }

    window.clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
  }

  private sendSchoolAction(
    action: 'subscribe-school' | 'unsubscribe-school',
    school: Pick<SchoolSubscription, 'sector' | 'schoolId'>,
  ): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    this.socket.send(
      JSON.stringify({
        action,
        sector: school.sector,
        school_id: school.schoolId,
      }),
    );
  }

  private handleMessage(message: MessageEvent): void {
    if (typeof message.data !== 'string') {
      return;
    }

    try {
      const parsed: unknown = JSON.parse(message.data);

      if (!this.isCommentEvent(parsed)) {
        return;
      }

      for (const listener of this.listeners) {
        listener(parsed);
      }
    } catch {
      // Ignore malformed or unsupported messages from the realtime endpoint.
    }
  }

  private isCommentEvent(value: unknown): value is CommentRealtimeEvent {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const candidate = value as Partial<CommentRealtimeEvent>;

    return (
      (candidate.event === 'comment-created' || candidate.event === 'comment-deleted') &&
      !!candidate.data &&
      typeof candidate.data.comment_id === 'string'
    );
  }
}
