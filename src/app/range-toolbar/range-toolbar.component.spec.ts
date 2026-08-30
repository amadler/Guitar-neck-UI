import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RangeToolbarComponent } from './range-toolbar.component';
import { AppStateService } from '../app-state.service';
import { neckConfig } from 'guitar-neck-shared';

describe('RangeToolbarComponent', () => {
  let component: RangeToolbarComponent;
  let fixture: ComponentFixture<RangeToolbarComponent>;
  let appState: AppStateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RangeToolbarComponent],
      providers: [AppStateService],
    }).compileComponents();

    fixture = TestBed.createComponent(RangeToolbarComponent);
    component = fixture.componentInstance;
    appState = TestBed.inject(AppStateService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have 6 presets', () => {
    expect(component.presets.length).toBe(6);
  });

  it('should default to Full Neck preset', () => {
    expect(component.activePreset!.label).toBe('Full Neck');
    expect(component.isCustom).toBeFalse();
  });

  describe('selectPreset', () => {
    it('should select a preset and emit range', () => {
      spyOn(component.rangeChange, 'emit');
      const preset = component.presets[1]; // 5th Pos.
      component.selectPreset(preset);
      expect(component.activePreset).toBe(preset);
      expect(component.isCustom).toBeFalse();
      expect(component.rangeChange.emit).toHaveBeenCalledWith({ minFret: 5, maxFret: 9 });
    });

    it('should set isCustom when Custom preset is selected', () => {
      const customPreset = component.presets[5]; // Custom
      component.selectPreset(customPreset);
      expect(component.isCustom).toBeTrue();
      expect(component.activePreset).toBeNull();
    });
  });

  describe('applyCustom', () => {
    it('should emit custom range and reset isCustom', () => {
      spyOn(component.rangeChange, 'emit');
      component.customMin = 3;
      component.customMax = 7;
      component.isCustom = true;
      component.applyCustom();
      expect(component.isCustom).toBeFalse();
      expect(component.rangeChange.emit).toHaveBeenCalledWith({ minFret: 3, maxFret: 7 });
    });

    it('should clamp min to 0', () => {
      component.customMin = -5;
      component.customMax = 10;
      component.applyCustom();
      expect(component.customMin).toBe(0);
    });

    it('should clamp max to neckConfig.numberOfFrets', () => {
      component.customMin = 0;
      component.customMax = 999;
      component.applyCustom();
      expect(component.customMax).toBe(neckConfig.numberOfFrets);
    });

    it('should swap min/max if min > max', () => {
      component.customMin = 10;
      component.customMax = 3;
      component.applyCustom();
      expect(component.customMin).toBe(3);
      expect(component.customMax).toBe(10);
    });
  });

  describe('switchMode', () => {
    it('should toggle from scale-or-chord to scale-chord', () => {
      expect(appState.appMode).toBe('scale-or-chord');
      component.switchMode();
      expect(appState.appMode).toBe('scale-chord');
    });

    it('should toggle from scale-chord to scale-or-chord', () => {
      appState.setMode('scale-chord');
      component.switchMode();
      expect(appState.appMode).toBe('scale-or-chord');
    });
  });

  describe('appMode', () => {
    it('should reflect AppStateService mode', () => {
      expect(component.appMode).toBe('scale-or-chord');
      appState.setMode('scale-chord');
      expect(component.appMode).toBe('scale-chord');
    });
  });
});