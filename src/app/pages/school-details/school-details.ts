import { Component, inject, signal, effect, OnDestroy } from '@angular/core';

import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { SchoolsApi } from '../explorer/services/schools-api';
import { SchoolDetailsApi } from '../explorer/services/school-details-api';
import { ExplorerStore } from '../explorer/services/explorer-store';

import { ExplorerSchool } from '../explorer/models/explorer-school';
import { SchoolDetailsResponse } from '../explorer/models/school-details-response';

import { CommentsApi } from '../../services/comments-api';

import { SchoolComment } from '../../models/school-comment';

import { Auth } from '../../services/auth';

import {
  formatGrade,
  formatSchoolLevel,
  formatSchoolType,
  formatStatus,
  formatYesNo,
  formatVirtual,
  formatProgramEnrollment,
  formatLibraryMediaCenter,
  formatLunchProgram,
  formatFte,
  formatCount,
  showSecondaryPrograms,
  showPreschoolData,
} from '../../utils/school-formatters';

@Component({
  selector: 'app-school-details',
  imports: [],
  templateUrl: './school-details.html',
  styleUrl: './school-details.css',
})
export class SchoolDetails implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly schoolsApi = inject(SchoolsApi);
  private readonly commentsApi = inject(CommentsApi);
  readonly comments = signal<SchoolComment[]>([]);

  readonly commentsHasMore = signal(false);

  readonly commentsNextCursor = signal<string | null>(null);
  private readonly schoolDetailsApi = inject(SchoolDetailsApi);
  private readonly explorerStore = inject(ExplorerStore);

  readonly school = signal<ExplorerSchool | null>(null);

  readonly expandedDetails = signal<SchoolDetailsResponse | null>(null);

  readonly formatGrade = formatGrade;
  readonly formatSchoolLevel = formatSchoolLevel;
  readonly formatSchoolType = formatSchoolType;
  readonly formatStatus = formatStatus;
  readonly formatYesNo = formatYesNo;
  readonly formatVirtual = formatVirtual;
  readonly formatProgramEnrollment = formatProgramEnrollment;
  readonly formatLibraryMediaCenter = formatLibraryMediaCenter;
  readonly formatLunchProgram = formatLunchProgram;
  readonly formatFte = formatFte;
  readonly formatCount = formatCount;
  readonly showSecondaryPrograms = showSecondaryPrograms;
  readonly showPreschoolData = showPreschoolData;

  readonly commentsLoading = signal(false);
  readonly commentsLoadingMore = signal(false);
  readonly commentsError = signal('');

  readonly commentText = signal('');
  readonly commentPosting = signal(false);
  readonly commentPostError = signal('');

  readonly loading = signal(true);
  readonly errorMessage = signal('');

  readonly auth = inject(Auth);
  readonly isAuthenticated = this.auth.isAuthenticated;

  // Public school streams need no bearer header, so native EventSource owns
  // reconnection for the lifetime of this route component.
  private commentStream: EventSource | null = null;

  constructor() {
    this.loadSchool();

    effect(() => {
      const authenticated = this.isAuthenticated();

      const school = this.school();

      if (!authenticated) {
        this.commentText.set('');
      }

      if (!school) {
        return;
      }

      this.loadComments(school.sector, school._id);
    });
  }

  private openCommentStream(sector: 'public' | 'private', schoolId: string): void {
    this.commentStream?.close();

    this.commentStream = new EventSource(`/api/schools/${sector}/${schoolId}/comments/stream`);

    this.commentStream.addEventListener('comment-created', async (event) => {
      const data = JSON.parse((event as MessageEvent).data);

      try {
        const response = await this.commentsApi.getSchoolComments(sector, schoolId);

        const newComment = response.comments.find((comment) => comment._id === data.comment_id);

        if (!newComment) {
          return;
        }

        this.comments.update((comments) => {
          // Prevent duplicates in the posting tab,
          // which receives its own SSE event.
          if (comments.some((comment) => comment._id === newComment._id)) {
            return comments;
          }

          return [newComment, ...comments];
        });
      } catch (error) {
        console.error('Unable to retrieve new comment:', error);
      }
    });

    this.commentStream.addEventListener('comment-deleted', (event) => {
      const data = JSON.parse((event as MessageEvent).data);

      void this.handleCommentDeleted(data.comment_id);
    });

    this.commentStream.onerror = (error) => {
      console.error('Comment stream error:', error);
    };
  }

  private async handleCommentDeleted(commentId: string): Promise<void> {
    const currentComments = this.comments();

    const commentExists = currentComments.some((comment) => comment._id === commentId);

    if (!commentExists) {
      return;
    }

    const updatedComments = currentComments.filter((comment) => comment._id !== commentId);

    this.comments.set(updatedComments);

    if (updatedComments.length < 10 && this.commentsHasMore()) {
      const school = this.school();

      if (!school) {
        return;
      }

      // Refill the visible page after an incremental deletion when older
      // comments are known to exist.
      await this.loadComments(school.sector, school._id);
    }
  }

  private async loadSchool(): Promise<void> {
    const sector = this.route.snapshot.paramMap.get('sector');

    const id = this.route.snapshot.paramMap.get('id');

    if ((sector !== 'public' && sector !== 'private') || !id) {
      this.errorMessage.set('Invalid school route.');

      this.loading.set(false);
      return;
    }

    try {
      let school = this.explorerStore.selectedSchool();

      // Explorer navigation can reuse its selection, but URL-only navigation
      // and browser refreshes must remain independently loadable.
      if (!school || school.sector !== sector || school._id !== id) {
        school = await firstValueFrom(this.schoolsApi.getSchoolById(sector, id));
      }

      this.school.set(school);

      this.openCommentStream(school.sector, school._id);

      if (school.sector === 'public') {
        // Expanded CRDC collections are keyed by ncessch, not the route `_id`.
        await this.loadExpandedDetails(school.ids.ncessch);
      }
    } catch (error) {
      console.error('Unable to load school:', error);

      this.errorMessage.set('Unable to load school.');
    } finally {
      this.loading.set(false);
    }
  }

  private async loadExpandedDetails(ncessch: string): Promise<void> {
    const cachedDetails = this.explorerStore.schoolDetails();

    if (cachedDetails?.ncessch === ncessch) {
      this.expandedDetails.set(cachedDetails.details);

      return;
    }

    const details = await firstValueFrom(this.schoolDetailsApi.getDetails(ncessch));

    this.expandedDetails.set(details);

    this.explorerStore.setSchoolDetails(ncessch, details);
  }

  private async loadComments(sector: 'public' | 'private', schoolId: string): Promise<void> {
    this.commentsLoading.set(true);
    this.commentsError.set('');

    try {
      const page = await this.commentsApi.getSchoolComments(sector, schoolId);

      this.comments.set(page.comments);
      this.commentsHasMore.set(page.hasMore);
      this.commentsNextCursor.set(page.nextCursor);
    } catch (error) {
      console.error('Unable to load comments:', error);

      this.commentsError.set('Unable to load comments.');
    } finally {
      this.commentsLoading.set(false);
    }
  }

  async loadMoreComments(): Promise<void> {
    const school = this.school();
    const cursor = this.commentsNextCursor();

    if (!school || !cursor || this.commentsLoadingMore()) {
      return;
    }

    this.commentsLoadingMore.set(true);
    this.commentsError.set('');

    try {
      const page = await this.commentsApi.getSchoolComments(school.sector, school._id, cursor);

      this.comments.update((current) => [...current, ...page.comments]);

      this.commentsHasMore.set(page.hasMore);

      this.commentsNextCursor.set(page.nextCursor);
    } catch (error) {
      console.error('Unable to load more comments:', error);

      this.commentsError.set('Unable to load more comments.');
    } finally {
      this.commentsLoadingMore.set(false);
    }
  }

  async postComment(): Promise<void> {
    const school = this.school();
    const text = this.commentText().trim();

    if (!school || !text || this.commentPosting()) {
      return;
    }

    this.commentPosting.set(true);
    this.commentPostError.set('');

    try {
      await this.commentsApi.createComment(school.sector, school._id, text);

      this.commentText.set('');
    } catch (error) {
      console.error('Unable to post comment:', error);

      this.commentPostError.set('Unable to post comment.');
    } finally {
      this.commentPosting.set(false);
    }
  }

  async deleteComment(commentId: string): Promise<void> {
    try {
      await this.commentsApi.deleteComment(commentId);

      await this.handleCommentDeleted(commentId);
    } catch (error) {
      console.error('Unable to delete comment:', error);
    }
  }

  ngOnDestroy(): void {
    this.commentStream?.close();
  }
}
