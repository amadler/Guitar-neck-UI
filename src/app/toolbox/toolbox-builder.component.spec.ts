import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToolboxBuilderComponent } from './toolbox-builder.component';
import { ShowScaleCommand, CompareCommand, ShowIntervalCommand } from './model';

describe('ToolboxBuilderComponent', () => {
  let component: ToolboxBuilderComponent;
  let fixture: ComponentFixture<ToolboxBuilderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToolboxBuilderComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ToolboxBuilderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit scale command on submit with explicit default', () => {
    spyOn(component.toolboxEvent, 'emit');

    component.submit();
    expect(component.toolboxEvent.emit).toHaveBeenCalledWith({
      kind: 'scale',
      key: 'C',
      scaleType: 'major'
    } as ShowScaleCommand);
  });

  it('should emit chord command when showKind is chord', () => {
    spyOn(component.toolboxEvent, 'emit');

    component.setShowKind('chord');
    component.submit();
    expect(component.toolboxEvent.emit).toHaveBeenCalledWith({
      kind: 'chord',
      key: 'C',
      chordType: 'major'
    });
  });

  it('should emit interval command when showKind is interval', () => {
    spyOn(component.toolboxEvent, 'emit');

    component.setShowKind('interval');
    component.submit();
    expect(component.toolboxEvent.emit).toHaveBeenCalledWith({
      kind: 'interval',
      key: 'C',
      interval: '3'
    } as ShowIntervalCommand);
  });

  it('should emit compare command on submit', () => {
    spyOn(component.toolboxEvent, 'emit');

    component.setIntent('compare');
    fixture.detectChanges();

    component.submit();
    expect(component.toolboxEvent.emit).toHaveBeenCalledWith({
      kind: 'scaleChordRelation',
      scaleKey: 'C',
      scaleType: 'major',
      chordKey: 'C',
      chordType: 'major'
    } as CompareCommand);
  });
});