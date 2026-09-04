import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DomainService } from '../domain/domain.service';
import { PatternBuilderService } from '../services/pattern-builder.service';
import { PatternInfo } from '../shared/model/patternInfo';

import { PatternDisplayComponent } from './pattern-display.component';
import { beforeEach, describe, expect, it } from 'vitest';
import { signal } from '@angular/core';

describe('PatternDisplayComponent', () => {
  let component: PatternDisplayComponent;
  let fixture: ComponentFixture<PatternDisplayComponent>;
  let mockState: Partial<PatternBuilderService>;

  const scalePattern: PatternInfo = {
    name: 'Major',
    rootNote: 'C',
    type: 'scale',
    notes: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
    intervals: ['1', '2', '3', '4', '5', '6', '7'],
    semitones: [0, 2, 4, 5, 7, 9, 11],
    steps: ['W', 'W', 'H', 'W', 'W', 'W', 'H'],
  };

  const chordPattern: PatternInfo = {
    name: 'Major',
    rootNote: 'C',
    type: 'chord',
    notes: ['C', 'E', 'G'],
    intervals: ['1', '3', '5'],
    semitones: [0, 4, 7],
    steps: ['W', 'W+H'],
  };

  beforeEach(async () => {
    mockState = {
      currentPattern: signal<PatternInfo | null>(null),
      relatedChord: signal<PatternInfo | null>(null),
    };

    await TestBed.configureTestingModule({
      imports: [PatternDisplayComponent],
      providers: [
        DomainService,
        { provide: PatternBuilderService, useValue: mockState },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PatternDisplayComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('getPromptsForType', () => {
    it('should return scale prompts for scale type', () => {
      const prompts = component.getPromptsForType('scale');
      expect(prompts.length).toBeGreaterThan(0);
      expect(prompts).toContain('Graj gamę w górę i w dół');
    });

    it('should return chord prompts for chord type', () => {
      const prompts = component.getPromptsForType('chord');
      expect(prompts.length).toBeGreaterThan(0);
      expect(prompts).toContain('Uderz akord — wszystkie struny naraz');
    });
  });

  describe('rendering', () => {
    it('should show prompts section when currentPattern is a scale', () => {
      mockState.currentPattern?.set(scalePattern);
      fixture.detectChanges();

      const promptsTitle = fixture.debugElement.query(By.css('.pattern-card__prompts-title'));
      expect(promptsTitle).toBeTruthy();
      expect(promptsTitle.nativeElement.textContent).toContain('Practice ideas');

      const items = fixture.debugElement.queryAll(By.css('.pattern-card__prompt-item'));
      expect(items.length).toBe(5);
      expect(items[0].nativeElement.textContent).toContain('Graj gamę w górę i w dół');
    });

    it('should show prompts section when currentPattern is a chord', () => {
      mockState.currentPattern?.set(chordPattern);
      fixture.detectChanges();

      const promptsTitle = fixture.debugElement.query(By.css('.pattern-card__prompts-title'));
      expect(promptsTitle).toBeTruthy();
      expect(promptsTitle.nativeElement.textContent).toContain('Practice ideas');

      const items = fixture.debugElement.queryAll(By.css('.pattern-card__prompt-item'));
      expect(items.length).toBe(5);
      expect(items[0].nativeElement.textContent).toContain('Uderz akord — wszystkie struny naraz');
    });

    it('should hide entire panel when currentPattern is null', () => {
      mockState.currentPattern?.set(null);
      fixture.detectChanges();

      const panel = fixture.debugElement.query(By.css('.pattern-card'));
      expect(panel).toBeNull();
    });
  });
});
