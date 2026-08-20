import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SchoolPreview } from './school-preview';

describe('SchoolPreview', () => {
  let component: SchoolPreview;
  let fixture: ComponentFixture<SchoolPreview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchoolPreview],
    }).compileComponents();

    fixture = TestBed.createComponent(SchoolPreview);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
