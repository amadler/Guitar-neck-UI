import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomePageComponent } from './home-page.component';
import { DomainService } from '../domain/domain.service';
import { FretboardOrchestrationService } from '../services/fretboard-orchestration.service';
import { PatternBuilderService } from '../services/pattern-builder.service';
import { TonalFacadeService } from '../services/tonal-facade.service';
import { FretboardNotePositionService } from '../services/note.service';
import { FretboardStateService } from '../services/fretboard-state.service';
import { FretboardDisplayService } from '../services/fretboard-display.service';
import { FretboardNoteQueryService } from '../services/fretboard-note-query.service';
import { MarkerRoleService } from '../services/marker-role.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { DomainCommand } from '../domain/commands';

describe('HomePageComponent', () => {
    let component: HomePageComponent;
    let fixture: ComponentFixture<HomePageComponent>;
    let domainService: DomainService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HomePageComponent],
            providers: [
                DomainService,
                FretboardOrchestrationService,
                PatternBuilderService,
                TonalFacadeService,
                FretboardNotePositionService,
                FretboardStateService,
                FretboardDisplayService,
                FretboardNoteQueryService,
                MarkerRoleService,
            ],
            schemas: [NO_ERRORS_SCHEMA],
        })
            .overrideComponent(HomePageComponent, {
            set: { template: '<div></div>', imports: [], schemas: [NO_ERRORS_SCHEMA] },
        })
            .compileComponents();

        fixture = TestBed.createComponent(HomePageComponent);
        component = fixture.componentInstance;
        domainService = TestBed.inject(DomainService);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have displayMode null by default', () => {
        expect(component.displayMode()).toBeNull();
    });

    describe('onToolboxEvent', () => {
        it('should handle show-pattern command and set legend mode', () => {
            const command: DomainCommand = { type: 'show-pattern', patternType: 'scale', patternName: 'major', rootNote: 'C' };
            vi.spyOn(domainService, 'execute');
            component.onToolboxEvent(command);
            expect(domainService.execute).toHaveBeenCalledWith(command);
            expect(component.displayMode()).toBe('legend');
        });

        it('should handle show-interval command and set legend mode', () => {
            const command: DomainCommand = { type: 'show-interval', rootNote: 'C', interval: 'b3' };
            vi.spyOn(domainService, 'execute');
            component.onToolboxEvent(command);
            expect(domainService.execute).toHaveBeenCalledWith(command);
            expect(component.displayMode()).toBe('legend');
        });

        it('should handle compare-patterns command and set relationship mode', () => {
            const command: DomainCommand = {
                type: 'compare-patterns',
                primary: { patternType: 'scale', patternName: 'major', rootNote: 'C' },
                secondary: { patternType: 'chord', patternName: 'major', rootNote: 'C' },
            };
            vi.spyOn(domainService, 'execute');
            component.onToolboxEvent(command);
            expect(domainService.execute).toHaveBeenCalledWith(command);
            expect(component.displayMode()).toBe('relationship');
        });

        it('should handle clear-view command and set null mode', () => {
            const command: DomainCommand = { type: 'clear-view' };
            vi.spyOn(domainService, 'execute');
            component.onToolboxEvent(command);
            expect(domainService.execute).toHaveBeenCalledWith(command);
            expect(component.displayMode()).toBeNull();
        });
    });
});
