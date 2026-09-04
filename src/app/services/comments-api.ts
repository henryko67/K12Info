import { Service, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { fetchAuthSession } from 'aws-amplify/auth';

import { SchoolComment } from '../models/school-comment';
import { CommentsPage } from '../models/comments-page';
import { UserCommentsResponse } from '../models/user-comments-response';

/** HTTP client for school comments and the current user's comments. */
@Service()
export class CommentsApi {
  private readonly http = inject(HttpClient);

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
        comment: Omit<SchoolComment, 'is_owner'>;
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

    // A successful authenticated create is necessarily owned by its caller.
    // Unlike the GET projection, the POST payload does not include is_owner,
    // so normalize it here before any component inserts it into local state.
    return { ...response.comment, is_owner: true };
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
}
