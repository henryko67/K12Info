import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SchoolResultCard } from './school-result-card';

describe('SchoolResultCard', () => {
  let component: SchoolResultCard;
  let fixture: ComponentFixture<SchoolResultCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchoolResultCard],
    }).compileComponents();

    fixture = TestBed.createComponent(SchoolResultCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
