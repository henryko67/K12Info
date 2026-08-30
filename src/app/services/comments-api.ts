import { Service, inject } from '@angular/core';
import {
    HttpClient,
    HttpParams
} from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
    fetchAuthSession
} from 'aws-amplify/auth';

import { SchoolComment } from '../models/school-comment';
import { CommentsPage } from '../models/comments-page';
import { UserCommentsResponse } from '../models/user-comments-response';

@Service()
export class CommentsApi {
    private readonly http =
        inject(HttpClient);


    async getSchoolComments(
        sector: 'public' | 'private',
        schoolId: string,
        before?: string
    ): Promise<CommentsPage> {
        let params = new HttpParams();

        if (before) {
            params = params.set(
                'before',
                before
            );
        }

        const session =
            await fetchAuthSession();

        const accessToken =
            session.tokens
                ?.accessToken
                ?.toString();

        const headers:
            Record<string, string> = {};

        if (accessToken) {
            headers['Authorization'] =
                `Bearer ${accessToken}`;
        }

        return await firstValueFrom(
            this.http.get<CommentsPage>(
                `/api/schools/${sector}/${schoolId}/comments`,
                {
                    params,
                    headers
                }
            )
        );
    }

    async createComment(
        sector: 'public' | 'private',
        schoolId: string,
        text: string
    ): Promise<SchoolComment> {
        const session =
            await fetchAuthSession();

        const accessToken =
            session.tokens
                ?.accessToken
                ?.toString();

        if (!accessToken) {
            throw new Error(
                'No authenticated Cognito session'
            );
        }

        const response =
            await firstValueFrom(
                this.http.post<{
                    message: string;
                    comment: SchoolComment;
                }>(
                    `/api/schools/${sector}/${schoolId}/comments`,
                    { text },
                    {
                        headers: {
                            Authorization:
                                `Bearer ${accessToken}`
                        }
                    }
                )
            );

        return response.comment;
    }

    async deleteComment(
        commentId: string
    ): Promise<void> {
        const session =
            await fetchAuthSession();

        const accessToken =
            session.tokens
                ?.accessToken
                ?.toString();

        if (!accessToken) {
            throw new Error(
                'No authenticated Cognito session'
            );
        }

        await firstValueFrom(
            this.http.delete(
                `/api/comments/${commentId}`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${accessToken}`
                    }
                }
            )
        );
    }

    async getCurrentUserComments(
        before?: string
    ): Promise<UserCommentsResponse> {
        const session =
            await fetchAuthSession();

        const accessToken =
            session.tokens
                ?.accessToken
                ?.toString();

        if (!accessToken) {
            throw new Error(
                'No authenticated Cognito session'
            );
        }

        let params =
            new HttpParams();

        if (before) {
            params = params.set(
                'before',
                before
            );
        }

        return await firstValueFrom(
            this.http.get<UserCommentsResponse>(
                '/api/users/me/comments',
                {
                    params,
                    headers: {
                        Authorization:
                            `Bearer ${accessToken}`
                    }
                }
            )
        );
    }

    async openCurrentUserCommentsStream(
    onCreated: (commentId: string) => void,
    onDeleted: (commentId: string) => void
    ): Promise<AbortController> {
        const session =
            await fetchAuthSession();

        const accessToken =
            session.tokens
                ?.accessToken
                ?.toString();

        if (!accessToken) {
            throw new Error(
                'No authenticated Cognito session'
            );
        }

        const controller =
            new AbortController();

        const response = await fetch(
            '/api/users/me/comments/stream',
            {
                headers: {
                    Authorization:
                        `Bearer ${accessToken}`
                },
                signal: controller.signal
            }
        );

        if (
            !response.ok ||
            !response.body
        ) {
            throw new Error(
                'Unable to open user comments stream'
            );
        }

        const reader =
            response.body.getReader();

        const decoder =
            new TextDecoder();

        let buffer = '';

        const readStream = async () => {
            try {
                while (true) {
                    const {
                        value,
                        done
                    } = await reader.read();

                    if (done) {
                        break;
                    }

                    buffer += decoder.decode(
                        value,
                        {
                            stream: true
                        }
                    );

                    const events =
                        buffer.split('\n\n');

                    buffer =
                        events.pop() ?? '';

                    for (const rawEvent of events) {
                        let eventName = '';
                        let eventData = '';

                        for (
                            const line
                            of rawEvent.split('\n')
                        ) {
                            if (
                                line.startsWith(
                                    'event: '
                                )
                            ) {
                                eventName =
                                    line.slice(7);
                            }

                            if (
                                line.startsWith(
                                    'data: '
                                )
                            ) {
                                eventData =
                                    line.slice(6);
                            }
                        }

                        if (!eventData) {
                            continue;
                        }

                        const data =
                            JSON.parse(eventData);

                        if (
                            eventName ===
                            'comment-created'
                        ) {
                            onCreated(
                                data.comment_id
                            );
                        }

                        if (
                            eventName ===
                            'comment-deleted'
                        ) {
                            onDeleted(
                                data.comment_id
                            );
                        }
                    }
                }
            } catch (error) {
                if (!controller.signal.aborted) {
                    console.error(
                        'User comments stream failed:',
                        error
                    );
                }
            }
        };

        void readStream();

        return controller;
    }
}