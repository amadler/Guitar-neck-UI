/** Practice prompts keyed by pattern type.
 *
 *  Edit the arrays below to change prompts without touching component code.
 *  Current language: Polish (pl), English for scale-chord. Localisation tracked separately. */
export type PromptType = 'scale' | 'chord' | 'scale-chord';

export const PRACTICE_PROMPTS: Record<PromptType, string[]> = {
  scale: [
    'Graj gamę w górę i w dół',
    'Wymawiaj nazwy dźwięków podczas gry',
    'Graj tylko dźwięki podstawowe (root)',
    'Graj jeden dźwięk na klik metronomu',
    'Ogranicz się do wybranego zakresu progów',
  ],
  chord: [
    'Uderz akord — wszystkie struny naraz',
    'Graj arpeggio — jedna struna po drugiej, w górę i w dół',
    'Wymawiaj nazwy dźwięków podczas gry',
    'Graj jeden dźwięk na klik metronomu',
    'Ogranicz się do wybranego zakresu progów',
  ],
  'scale-chord': [
    'Play chord tones in scale — find chord notes across the neck',
    'Find the chord root — locate and play the root on different strings',
    'Play only outside chord tones — use tones outside the scale, if any',
    'Play scale around chord — outline the scale around the chord',
  ],
};
