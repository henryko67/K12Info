import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SchoolDetails } from './school-details';

describe('SchoolDetails', () => {
  let component: SchoolDetails;
  let fixture: ComponentFixture<SchoolDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchoolDetails],
    }).compileComponents();

    fixture = TestBed.createComponent(SchoolDetails);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
