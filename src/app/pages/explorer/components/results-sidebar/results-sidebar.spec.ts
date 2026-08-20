import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResultsSidebar } from './results-sidebar';

describe('ResultsSidebar', () => {
  let component: ResultsSidebar;
  let fixture: ComponentFixture<ResultsSidebar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResultsSidebar],
    }).compileComponents();

    fixture = TestBed.createComponent(ResultsSidebar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
