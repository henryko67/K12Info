import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class ActiveMarkerService {
  private activeId$ = new BehaviorSubject<number | null>(null);

  setActiveId(id: number | null) {
    this.activeId$.next(id);
  }

  getActiveId$() {
    return this.activeId$.asObservable();
  }
}