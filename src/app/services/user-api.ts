import { Service, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { fetchAuthSession } from 'aws-amplify/auth';

interface UsernameAvailabilityResponse {
  available: boolean;
}

interface UserProfile {
  /** Stable Cognito identity copied into MongoDB; ownership never uses username/email. */
  _id: string;
  cognito_sub: string;
  username: string;
  username_normalized: string;
  created_at: string;
}

/**
 * Accesses MongoDB-backed application profiles. Authentication credentials and
 * passwords remain in Cognito; this API manages only application profile data.
 */
@Service()
export class UserApi {
  private readonly http = inject(HttpClient);

  async createUserProfile(username: string): Promise<UserProfile> {
    const session = await fetchAuthSession();
    const accessToken = session.tokens?.accessToken?.toString();

    if (!accessToken) {
      throw new Error('No authenticated Cognito session');
    }

    const response = await firstValueFrom(
      this.http.post<{
        message: string;
        user: UserProfile;
      }>(
        '/api/users',
        { username },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      ),
    );

    return response.user;
  }

  async checkUsernameAvailability(username: string): Promise<boolean> {
    const response = await firstValueFrom(
      this.http.get<UsernameAvailabilityResponse>('/api/users/username-available', {
        params: {
          username,
        },
      }),
    );

    return response.available;
  }

  async getCurrentUserProfile(): Promise<UserProfile | null> {
    const session = await fetchAuthSession();

    const accessToken = session.tokens?.accessToken?.toString();

    if (!accessToken) {
      throw new Error('No authenticated Cognito session');
    }

    try {
      const response = await firstValueFrom(
        this.http.get<{ user: UserProfile }>('/api/users/me', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }),
      );

      return response.user;
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404) {
        return null;
      }

      throw error;
    }
  }

  async updateUsername(username: string): Promise<UserProfile> {
    const session = await fetchAuthSession();
    const accessToken = session.tokens?.accessToken?.toString();

    if (!accessToken) {
      throw new Error('No authenticated Cognito session');
    }

    const response = await firstValueFrom(
      this.http.patch<{ user: UserProfile }>(
        '/api/users/me',
        { username },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      ),
    );

    return response.user;
  }
}
