import { ScaleService } from './scales.service';

describe('ScaleService', () => {
  let scaleService: ScaleService;

  beforeEach(() => {
    scaleService = new ScaleService();
  });

  it('should generate a scale', () => {
    const scaleName = 'Major scale';
    const rootNote = 'C';
    const expectedScale = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C'];

    const generatedScale = scaleService.generateScale(scaleName, rootNote);

    expect(generatedScale).toEqual(expectedScale);
  });

  it('should generate a triad', () => {
    const triadType = 'Major Triad';
    const rootNote = 'C';
    const expectedTriad = ['C', 'E', 'G'];

    const generatedTriad = scaleService.generateTriad(triadType, rootNote);

    expect(generatedTriad).toEqual(expectedTriad);
  });
});
