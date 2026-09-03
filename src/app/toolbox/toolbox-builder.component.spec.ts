import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToolboxBuilderComponent } from './toolbox-builder.component';
import { DomainCommand } from '../domain/commands';

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

  it('should emit show-pattern scale command on submit with explicit default', () => {
    spyOn(component.toolboxEvent, 'emit');

    component.submit();
    expect(component.toolboxEvent.emit).toHaveBeenCalledWith({
      type: 'show-pattern',
      patternType: 'scale',
      patternName: 'major',
      rootNote: 'C',
    } as DomainCommand);
  });

  it('should emit show-pattern chord command when showKind is chord', () => {
    spyOn(component.toolboxEvent, 'emit');

    component.setShowKind('chord');
    component.submit();
    expect(component.toolboxEvent.emit).toHaveBeenCalledWith({
      type: 'show-pattern',
      patternType: 'chord',
      patternName: 'major',
      rootNote: 'C',
    } as DomainCommand);
  });

  it('should emit show-interval command when showKind is interval', () => {
    spyOn(component.toolboxEvent, 'emit');

    component.setShowKind('interval');
    component.submit();
    expect(component.toolboxEvent.emit).toHaveBeenCalledWith({
      type: 'show-interval',
      rootNote: 'C',
      interval: '3',
    } as DomainCommand);
  });

  it('should emit compare-patterns command on submit', () => {
    spyOn(component.toolboxEvent, 'emit');

    component.setIntent('compare');
    fixture.detectChanges();

    component.submit();
    expect(component.toolboxEvent.emit).toHaveBeenCalledWith({
      type: 'compare-patterns',
      primary: { patternType: 'scale', patternName: 'major', rootNote: 'C' },
      secondary: { patternType: 'chord', patternName: 'major', rootNote: 'C' },
    } as DomainCommand);
  });
});