import type { MockedObject } from "vitest";
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { LegendComponent } from './legend.component';
import { FretboardStateService } from '../services/fretboard-state.service';
import { FretboardDisplayService } from '../services/fretboard-display.service';
import { DomainService } from '../domain/domain.service';

describe('LegendComponent', () => {
    let component: LegendComponent;
    let fixture: ComponentFixture<LegendComponent>;
    let guitarNeckService: FretboardStateService;
    let domainService: Partial<MockedObject<DomainService>>;
    let mockState: any;

    beforeEach(async () => {
        mockState = {
            markerDisplayMode: 'interval-colors',
            fretRange: { min: 0, max: 24 },
            enabledStrings: [true, true, true, true, true, true],
        };

        domainService = {
            execute: vi.fn().mockName("DomainService.execute"),
            currentState: mockState
        };

        await TestBed.configureTestingModule({
            imports: [LegendComponent],
            providers: [
                FretboardDisplayService,
                { provide: DomainService, useValue: domainService },
            ]
        })
            .compileComponents();

        fixture = TestBed.createComponent(LegendComponent);
        component = fixture.componentInstance;
        guitarNeckService = TestBed.inject(FretboardStateService);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should render a "Markers" select with three options', () => {
        const labels = fixture.debugElement.queryAll(By.css('.switch-line'));
        const markersLabel = labels.find(label => label.nativeElement.textContent?.includes('Markers'));
        expect(markersLabel).toBeTruthy();
        const select = markersLabel!.query(By.css('select'));
        expect(select).toBeTruthy();
        const options = select!.queryAll(By.css('option'));
        expect(options.length).toBe(3);
        expect(options[0].nativeElement.value).toBe('interval-colors');
        expect(options[1].nativeElement.value).toBe('note-names');
        expect(options[2].nativeElement.value).toBe('neutral-dots');
    });

    it('should default to interval-colors', () => {
        const labels = fixture.debugElement.queryAll(By.css('.switch-line'));
        const markersLabel = labels.find(label => label.nativeElement.textContent?.includes('Markers'));
        const select = markersLabel!.query(By.css('select'));
        expect(select!.nativeElement.value).toBe('interval-colors');
    });

    it('should switch display mode when dropdown changes', () => {
        expect(mockState.markerDisplayMode).toBe('interval-colors');

        const labels = fixture.debugElement.queryAll(By.css('.switch-line'));
        const markersLabel = labels.find(label => label.nativeElement.textContent?.includes('Markers'));
        const select = markersLabel!.query(By.css('select'));

        // Switch to note-names
        select!.nativeElement.value = 'note-names';
        select!.nativeElement.dispatchEvent(new Event('change'));
        fixture.detectChanges();
        expect(domainService.execute).toHaveBeenCalledWith({ type: 'set-view', markerDisplayMode: 'note-names' });

        // Switch to neutral-dots
        select!.nativeElement.value = 'neutral-dots';
        select!.nativeElement.dispatchEvent(new Event('change'));
        fixture.detectChanges();
        expect(domainService.execute).toHaveBeenCalledWith({ type: 'set-view', markerDisplayMode: 'neutral-dots' });
    });

    describe('markers select disabled state', () => {
        function getSelect(): HTMLSelectElement {
            const labels = fixture.debugElement.queryAll(By.css('.switch-line'));
            const markersLabel = labels.find(label => label.nativeElement.textContent?.includes('Markers'));
            return markersLabel!.query(By.css('select'))!.nativeElement;
        }

        it('should be disabled when hasActiveResult is false', () => {
            guitarNeckService.hasActiveResult = false;
            fixture.detectChanges();
            expect(getSelect().disabled).toBe(true);
        });

        it('should be enabled when hasActiveResult is true', () => {
            guitarNeckService.hasActiveResult = true;
            fixture.detectChanges();
            expect(getSelect().disabled).toBe(false);
        });
    });
});
