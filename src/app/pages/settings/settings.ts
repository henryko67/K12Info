import {
  Component,
  inject,
  signal,
  effect,
  OnDestroy
} from '@angular/core';

import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { DatePipe } from '@angular/common';
import {
  Router,
  RouterLink
} from '@angular/router';

import { UserApi } from '../../services/user-api';
import { ProfileStore } from '../../services/profile-store';
import { Auth } from '../../services/auth';
import { CommentsApi } from '../../services/comments-api';

import { UserComment } from '../../models/user-comment';

@Component({
  selector: 'app-settings',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    DatePipe
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.css'
})
export class Settings implements OnDestroy {
  private readonly userApi = inject(UserApi);

  private readonly profileStore = inject(ProfileStore);

  private readonly auth = inject(Auth);

  private readonly router = inject(Router);

  private readonly commentsApi = inject(CommentsApi);

  private commentsStreamController: AbortController | null = null;

  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly loading = signal(false);

  readonly comments =
    signal<UserComment[]>([]);

  readonly commentsHasMore =
    signal(false);

  readonly commentsNextCursor =
    signal<string | null>(null);

  readonly commentsLoading =
    signal(false);

  readonly commentsLoadingMore =
    signal(false);

  readonly commentsError =
    signal('');

  readonly currentUsername =
    this.profileStore.username;

  readonly usernameForm = new FormGroup({
    username: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(20),
        Validators.pattern(/^[a-zA-Z0-9_]+$/)
      ]
    })
  });

  private readonly syncUsernameEffect =
    effect(() => {
      const username =
        this.profileStore.username();

      if (username) {
        this.usernameForm.controls.username.setValue(
          username,
          {
            emitEvent: false
          }
        );
      }
    });

  private readonly authRedirectEffect =
    effect(() => {
      const resolved =
        this.auth.sessionResolved();

      const authenticated =
        this.auth.isAuthenticated();

      if (
        resolved &&
        !authenticated
      ) {
        this.router.navigate(['/']);
      }
    });

  constructor() {
    this.loadProfile();
    this.loadComments();
    this.openCommentsStream();
  }

  private async loadProfile(): Promise<void> {
    try {
      const profile =
        await this.userApi.getCurrentUserProfile();

      if (!profile) {
        this.errorMessage.set(
          'Unable to find your account profile.'
        );

        return;
      }

      this.profileStore.setUsername(
        profile.username
      );
    } catch (error) {
      console.error(error);

      this.errorMessage.set(
        'Unable to load your account settings.'
      );
    }
  }

  private async loadComments(): Promise<void> {
    this.commentsError.set('');
    this.commentsLoading.set(true);

    try {
      const response =
        await this.commentsApi.getCurrentUserComments();

      this.comments.set(
        response.comments
      );

      this.commentsHasMore.set(
        response.hasMore
      );

      this.commentsNextCursor.set(
        response.nextCursor
      );
    } catch (error) {
      console.error(error);

      this.commentsError.set(
        'Unable to load your comments.'
      );
    } finally {
      this.commentsLoading.set(false);
    }
  }

  async loadMoreComments(): Promise<void> {
    const cursor =
      this.commentsNextCursor();

    if (
      !cursor ||
      this.commentsLoadingMore()
    ) {
      return;
    }

    this.commentsError.set('');
    this.commentsLoadingMore.set(true);

    try {
      const response =
        await this.commentsApi.getCurrentUserComments(
          cursor
        );

      this.comments.update(current => [
        ...current,
        ...response.comments
      ]);

      this.commentsHasMore.set(
        response.hasMore
      );

      this.commentsNextCursor.set(
        response.nextCursor
      );
    } catch (error) {
      console.error(error);

      this.commentsError.set(
        'Unable to load more comments.'
      );
    } finally {
      this.commentsLoadingMore.set(false);
    }
  }

  private async openCommentsStream(): Promise<void> {
    try {
      this.commentsStreamController =
        await this.commentsApi
          .openCurrentUserCommentsStream(
            commentId =>
              this.handleCommentCreated(
                commentId
              ),

            commentId =>
              this.handleCommentDeleted(
                commentId
              )
          );
    } catch (error) {
      console.error(
        'Unable to open user comments stream:',
        error
      );
    }
  }

  private async handleCommentCreated(commentId: string): Promise<void> {
    try {
      const response =
        await this.commentsApi
          .getCurrentUserComments();

      const newComment =
        response.comments.find(
          comment =>
            comment._id === commentId
        );

      if (!newComment) {
        return;
      }

      this.comments.update(comments => {
        if (
          comments.some(
            comment =>
              comment._id ===
              newComment._id
          )
        ) {
          return comments;
        }

        return [
          newComment,
          ...comments
        ];
      });
    } catch (error) {
      console.error(
        'Unable to retrieve new comment:',
        error
      );
    }
  }

  async deleteComment(
    commentId: string
  ): Promise<void> {
    this.commentsError.set('');

    try {
      await this.commentsApi.deleteComment(
        commentId
      );

      await this.handleCommentDeleted(
        commentId
      );
    } catch (error) {
      console.error(error);

      this.commentsError.set(
        'Unable to delete comment.'
      );
    }
  }

  private async handleCommentDeleted(
    commentId: string
  ): Promise<void> {
    const currentComments =
      this.comments();

    const commentExists =
      currentComments.some(
        comment =>
          comment._id === commentId
      );

    if (!commentExists) {
      return;
    }

    const updatedComments =
      currentComments.filter(
        comment =>
          comment._id !== commentId
      );

    this.comments.set(
      updatedComments
    );

    if (
      updatedComments.length < 10 &&
      this.commentsHasMore()
    ) {
      await this.loadComments();
    }
  }

  async updateUsername(): Promise<void> {
    if (this.usernameForm.invalid) {
      this.usernameForm.markAllAsTouched();
      return;
    }

    const { username } =
      this.usernameForm.getRawValue();

    const trimmedUsername =
      username.trim();

    if (
      trimmedUsername ===
      this.currentUsername()
    ) {
      this.successMessage.set(
        'Your username is already set to that.'
      );

      this.errorMessage.set('');

      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');
    this.loading.set(true);

    try {
      const profile =
        await this.userApi.updateUsername(
          trimmedUsername
        );

      this.profileStore.updateUsername(
        profile.username
      );

      this.successMessage.set(
        `Username changed to ${profile.username}.`
      );
    } catch (error: any) {
      console.error(error);

      if (error.status === 409) {
        this.errorMessage.set(
          'Username is already taken.'
        );
      } else if (error.status === 400) {
        this.errorMessage.set(
          'Please enter a valid username.'
        );
      } else {
        this.errorMessage.set(
          'Unable to update username.'
        );
      }
    } finally {
      this.loading.set(false);
    }
  }

  ngOnDestroy(): void {
    this.commentsStreamController?.abort();
  }
}