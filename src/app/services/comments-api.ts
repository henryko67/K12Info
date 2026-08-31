import { Service, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { fetchAuthSession } from 'aws-amplify/auth';

import { SchoolComment } from '../models/school-comment';
import { CommentsPage } from '../models/comments-page';
import { UserCommentsResponse } from '../models/user-comments-response';

/** HTTP and streaming client for school comments and the current user's comments. */
@Service()
export class CommentsApi {
  private readonly http = inject(HttpClient);

  private async connectCurrentUserCommentsStream(
    controller: AbortController,
    onCreated: (commentId: string) => void,
    onDeleted: (commentId: string) => void,
  ): Promise<void> {
    const session = await fetchAuthSession();

    const accessToken = session.tokens?.accessToken?.toString();

    if (!accessToken) {
      throw new Error('No authenticated Cognito session');
    }

    const response = await fetch('/api/users/me/comments/stream', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      signal: controller.signal,
    });

    if (!response.ok || !response.body) {
      throw new Error('Unable to open user comments stream');
    }

    const reader = response.body.getReader();

    const decoder = new TextDecoder();

    let buffer = '';

    while (!controller.signal.aborted) {
      const { value, done } = await reader.read();

      if (done) {
        return;
      }

      buffer += decoder.decode(value, {
        stream: true,
      });

      const events = buffer.split('\n\n');

      buffer = events.pop() ?? '';

      for (const rawEvent of events) {
        let eventName = '';
        let eventData = '';

        for (const line of rawEvent.split('\n')) {
          if (line.startsWith('event: ')) {
            eventName = line.slice(7);
          }

          if (line.startsWith('data: ')) {
            eventData = line.slice(6);
          }
        }

        if (!eventData) {
          continue;
        }

        const data = JSON.parse(eventData);

        if (eventName === 'comment-created') {
          onCreated(data.comment_id);
        }

        if (eventName === 'comment-deleted') {
          onDeleted(data.comment_id);
        }
      }
    }
  }

  /**
   * Loads a public comment page for a base school `_id`. When a Cognito access
   * token exists it is sent so the backend can compute `is_owner`; reading the
   * comments themselves does not require authentication.
   */
  async getSchoolComments(
    sector: 'public' | 'private',
    schoolId: string,
    before?: string,
  ): Promise<CommentsPage> {
    let params = new HttpParams();

    if (before) {
      params = params.set('before', before);
    }

    const session = await fetchAuthSession();

    const accessToken = session.tokens?.accessToken?.toString();

    const headers: Record<string, string> = {};

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    return await firstValueFrom(
      this.http.get<CommentsPage>(`/api/schools/${sector}/${schoolId}/comments`, {
        params,
        headers,
      }),
    );
  }

  /** Creates a comment owned by the authenticated user's stable Cognito `sub`. */
  async createComment(
    sector: 'public' | 'private',
    schoolId: string,
    text: string,
  ): Promise<SchoolComment> {
    const session = await fetchAuthSession();

    const accessToken = session.tokens?.accessToken?.toString();

    if (!accessToken) {
      throw new Error('No authenticated Cognito session');
    }

    const response = await firstValueFrom(
      this.http.post<{
        message: string;
        comment: SchoolComment;
      }>(
        `/api/schools/${sector}/${schoolId}/comments`,
        { text },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      ),
    );

    return response.comment;
  }

  /** Deletes a comment after backend JWT and `author_sub` ownership checks. */
  async deleteComment(commentId: string): Promise<void> {
    const session = await fetchAuthSession();

    const accessToken = session.tokens?.accessToken?.toString();

    if (!accessToken) {
      throw new Error('No authenticated Cognito session');
    }

    await firstValueFrom(
      this.http.delete(`/api/comments/${commentId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }),
    );
  }

  /** Loads the authenticated user's comments using the backend's opaque cursor. */
  async getCurrentUserComments(before?: string): Promise<UserCommentsResponse> {
    const session = await fetchAuthSession();

    const accessToken = session.tokens?.accessToken?.toString();

    if (!accessToken) {
      throw new Error('No authenticated Cognito session');
    }

    let params = new HttpParams();

    if (before) {
      params = params.set('before', before);
    }

    return await firstValueFrom(
      this.http.get<UserCommentsResponse>('/api/users/me/comments', {
        params,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }),
    );
  }

  /**
   * Opens and maintains the authenticated, user-specific SSE stream used by
   * Settings pages. This is separate from each school's public EventSource
   * stream. Fetch is used because native EventSource cannot attach the bearer
   * token.
   *
   * Unexpected disconnects are retried with bounded exponential backoff. A fresh
   * Cognito session is resolved for each connection attempt.
   *
   * @returns An abort controller that permanently stops the active stream and
   * future reconnect attempts.
   */
  async openCurrentUserCommentsStream(
    onCreated: (commentId: string) => void,
    onDeleted: (commentId: string) => void,
  ): Promise<AbortController> {
    const controller = new AbortController();

    const runStream = async () => {
      let retryDelay = 1000;

      while (!controller.signal.aborted) {
        try {
          await this.connectCurrentUserCommentsStream(controller, onCreated, onDeleted);
        } catch (error) {
          if (controller.signal.aborted) {
            break;
          }

          console.error('User comments stream disconnected:', error);
        }

        if (controller.signal.aborted) {
          break;
        }

        await this.waitForReconnect(retryDelay, controller.signal);

        retryDelay = Math.min(retryDelay * 2, 10_000);
      }
    };

    void runStream();

    return controller;
  }

  /** Waits for backoff while allowing stream ownership to cancel immediately. */
  private waitForReconnect(milliseconds: number, signal: AbortSignal): Promise<void> {
    if (signal.aborted) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const finish = () => {
        window.clearTimeout(timeout);
        signal.removeEventListener('abort', finish);
        resolve();
      };

      const timeout = window.setTimeout(finish, milliseconds);

      signal.addEventListener('abort', finish, {
        once: true,
      });
    });
  }
}
