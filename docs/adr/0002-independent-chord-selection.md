# ADR 0002: Independent chord selection in scale-chord mode

**Status**: accepted

In scale-chord mode, the chord is selected independently from the scale — the user picks any chord type with any root note, regardless of whether it is a diatonic chord of the selected scale.

**Context**: Most music theory apps tie chord selection to a scale degree (e.g., "I = major, ii = minor"). This is the expected pattern for diatonic harmony. However, the goal of this feature is to let users explore *any* chord-scale relationship — including non-diatonic chords — to see which tones overlap and which fall outside the scale. Degree-based selection is preserved as a future convenience shortcut, not the primary mechanism.

**Alternatives considered**:
- **Degree-only**: chord type and root derived from scale degree. Simpler form, but limits exploration to diatonic chords only.
- **Degree + custom toggle**: degree by default, with an "advanced" toggle for free selection. More complex UI for an MVP.

**Consequences**: The `ScaleChordFormComponent` has two independent dropdown groups (scale + chord). The `ChordDegreeSelectorComponent` is kept as-is (not deleted) — its degree logic will be extracted to `ChordDegreeResolverService` when the degree shortcut feature is implemented.
