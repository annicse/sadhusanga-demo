/**
 * Guitar Chord Fingering Database (Standard EADGBE tuning)
 * frets: [string 6 (low E), 5 (A), 4 (D), 3 (G), 2 (B), 1 (high E)]
 * -1 = muted (X), 0 = open (O), 1+ = fret number
 * fingers: [6, 5, 4, 3, 2, 1] matching fingers (0 = none, 1 = index, 2 = middle, 3 = ring, 4 = pinky)
 */

export type ChordVoicing = {
  frets: number[]
  fingers?: number[]
  baseFret?: number
  barre?: { fret: number; fromString: number; toString: number }
}

export const GUITAR_CHORDS: Record<string, ChordVoicing> = {
  // C Family
  'C': { frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0], baseFret: 1 },
  'Cm': { frets: [-1, 3, 5, 5, 4, 3], fingers: [0, 1, 3, 4, 2, 1], baseFret: 3, barre: { fret: 3, fromString: 5, toString: 1 } },
  'C7': { frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0], baseFret: 1 },
  'Cmaj7': { frets: [-1, 3, 2, 0, 0, 0], fingers: [0, 3, 2, 0, 0, 0], baseFret: 1 },
  'Cm7': { frets: [-1, 3, 5, 3, 4, 3], fingers: [0, 1, 3, 1, 2, 1], baseFret: 3, barre: { fret: 3, fromString: 5, toString: 1 } },
  'Csus2': { frets: [-1, 3, 0, 0, 1, -1], fingers: [0, 3, 0, 0, 1, 0], baseFret: 1 },
  'Csus4': { frets: [-1, 3, 3, 0, 1, 1], fingers: [0, 3, 4, 0, 1, 1], baseFret: 1 },
  'Cadd9': { frets: [-1, 3, 2, 0, 3, 0], fingers: [0, 2, 1, 0, 3, 0], baseFret: 1 },
  'C5': { frets: [-1, 3, 5, 5, -1, -1], fingers: [0, 1, 3, 4, 0, 0], baseFret: 3 },

  // C# / Db Family
  'C#': { frets: [-1, 4, 6, 6, 6, 4], fingers: [0, 1, 2, 3, 4, 1], baseFret: 4, barre: { fret: 4, fromString: 5, toString: 1 } },
  'Db': { frets: [-1, 4, 6, 6, 6, 4], fingers: [0, 1, 2, 3, 4, 1], baseFret: 4, barre: { fret: 4, fromString: 5, toString: 1 } },
  'C#m': { frets: [-1, 4, 6, 6, 5, 4], fingers: [0, 1, 3, 4, 2, 1], baseFret: 4, barre: { fret: 4, fromString: 5, toString: 1 } },
  'Dbm': { frets: [-1, 4, 6, 6, 5, 4], fingers: [0, 1, 3, 4, 2, 1], baseFret: 4, barre: { fret: 4, fromString: 5, toString: 1 } },
  'C#7': { frets: [-1, 4, 6, 4, 6, 4], fingers: [0, 1, 3, 1, 4, 1], baseFret: 4, barre: { fret: 4, fromString: 5, toString: 1 } },
  'C#m7': { frets: [-1, 4, 6, 4, 5, 4], fingers: [0, 1, 3, 1, 2, 1], baseFret: 4, barre: { fret: 4, fromString: 5, toString: 1 } },

  // D Family
  'D': { frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2], baseFret: 1 },
  'Dm': { frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1], baseFret: 1 },
  'D7': { frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3], baseFret: 1 },
  'Dmaj7': { frets: [-1, -1, 0, 2, 2, 2], fingers: [0, 0, 0, 1, 1, 1], baseFret: 1, barre: { fret: 2, fromString: 3, toString: 1 } },
  'Dm7': { frets: [-1, -1, 0, 2, 1, 1], fingers: [0, 0, 0, 2, 1, 1], baseFret: 1 },
  'Dsus2': { frets: [-1, -1, 0, 2, 3, 0], fingers: [0, 0, 0, 1, 2, 0], baseFret: 1 },
  'Dsus4': { frets: [-1, -1, 0, 2, 3, 3], fingers: [0, 0, 0, 1, 2, 3], baseFret: 1 },
  'D5': { frets: [-1, -1, 0, 2, 3, -1], fingers: [0, 0, 0, 1, 2, 0], baseFret: 1 },

  // D# / Eb Family
  'D#': { frets: [-1, 6, 8, 8, 8, 6], fingers: [0, 1, 2, 3, 4, 1], baseFret: 6, barre: { fret: 6, fromString: 5, toString: 1 } },
  'Eb': { frets: [-1, 6, 8, 8, 8, 6], fingers: [0, 1, 2, 3, 4, 1], baseFret: 6, barre: { fret: 6, fromString: 5, toString: 1 } },
  'D#m': { frets: [-1, 6, 8, 8, 7, 6], fingers: [0, 1, 3, 4, 2, 1], baseFret: 6, barre: { fret: 6, fromString: 5, toString: 1 } },
  'Ebm': { frets: [-1, 6, 8, 8, 7, 6], fingers: [0, 1, 3, 4, 2, 1], baseFret: 6, barre: { fret: 6, fromString: 5, toString: 1 } },
  'Eb7': { frets: [-1, 6, 8, 6, 8, 6], fingers: [0, 1, 3, 1, 4, 1], baseFret: 6, barre: { fret: 6, fromString: 5, toString: 1 } },

  // E Family
  'E': { frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0], baseFret: 1 },
  'Em': { frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0], baseFret: 1 },
  'E7': { frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0], baseFret: 1 },
  'Emaj7': { frets: [0, 2, 1, 1, 0, 0], fingers: [0, 3, 1, 2, 0, 0], baseFret: 1 },
  'Em7': { frets: [0, 2, 0, 0, 0, 0], fingers: [0, 2, 0, 0, 0, 0], baseFret: 1 },
  'Esus4': { frets: [0, 2, 2, 2, 0, 0], fingers: [0, 2, 3, 4, 0, 0], baseFret: 1 },
  'E5': { frets: [0, 2, 2, -1, -1, -1], fingers: [0, 1, 2, 0, 0, 0], baseFret: 1 },

  // F Family
  'F': { frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], baseFret: 1, barre: { fret: 1, fromString: 6, toString: 1 } },
  'Fm': { frets: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1], baseFret: 1, barre: { fret: 1, fromString: 6, toString: 1 } },
  'F7': { frets: [1, 3, 1, 2, 1, 1], fingers: [1, 3, 1, 2, 1, 1], baseFret: 1, barre: { fret: 1, fromString: 6, toString: 1 } },
  'Fmaj7': { frets: [-1, -1, 3, 2, 1, 0], fingers: [0, 0, 3, 2, 1, 0], baseFret: 1 },
  'Fm7': { frets: [1, 3, 1, 1, 1, 1], fingers: [1, 3, 1, 1, 1, 1], baseFret: 1, barre: { fret: 1, fromString: 6, toString: 1 } },
  'Fsus4': { frets: [1, 3, 3, 3, 1, 1], fingers: [1, 3, 4, 4, 1, 1], baseFret: 1, barre: { fret: 1, fromString: 6, toString: 1 } },
  'F5': { frets: [1, 3, 3, -1, -1, -1], fingers: [1, 3, 4, 0, 0, 0], baseFret: 1 },

  // F# / Gb Family
  'F#': { frets: [2, 4, 4, 3, 2, 2], fingers: [1, 3, 4, 2, 1, 1], baseFret: 2, barre: { fret: 2, fromString: 6, toString: 1 } },
  'Gb': { frets: [2, 4, 4, 3, 2, 2], fingers: [1, 3, 4, 2, 1, 1], baseFret: 2, barre: { fret: 2, fromString: 6, toString: 1 } },
  'F#m': { frets: [2, 4, 4, 2, 2, 2], fingers: [1, 3, 4, 1, 1, 1], baseFret: 2, barre: { fret: 2, fromString: 6, toString: 1 } },
  'Gbm': { frets: [2, 4, 4, 2, 2, 2], fingers: [1, 3, 4, 1, 1, 1], baseFret: 2, barre: { fret: 2, fromString: 6, toString: 1 } },
  'F#7': { frets: [2, 4, 2, 3, 2, 2], fingers: [1, 3, 1, 2, 1, 1], baseFret: 2, barre: { fret: 2, fromString: 6, toString: 1 } },
  'F#m7': { frets: [2, 4, 2, 2, 2, 2], fingers: [1, 3, 1, 1, 1, 1], baseFret: 2, barre: { fret: 2, fromString: 6, toString: 1 } },

  // G Family
  'G': { frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3], baseFret: 1 },
  'Gm': { frets: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1], baseFret: 3, barre: { fret: 3, fromString: 6, toString: 1 } },
  'G7': { frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1], baseFret: 1 },
  'Gmaj7': { frets: [3, 2, 0, 0, 0, 2], fingers: [3, 2, 0, 0, 0, 1], baseFret: 1 },
  'Gm7': { frets: [3, 5, 3, 3, 3, 3], fingers: [1, 3, 1, 1, 1, 1], baseFret: 3, barre: { fret: 3, fromString: 6, toString: 1 } },
  'Gsus4': { frets: [3, 3, 0, 0, 1, 3], fingers: [2, 3, 0, 0, 1, 4], baseFret: 1 },
  'G5': { frets: [3, 5, 5, -1, -1, -1], fingers: [1, 3, 4, 0, 0, 0], baseFret: 3 },

  // G# / Ab Family
  'G#': { frets: [4, 6, 6, 5, 4, 4], fingers: [1, 3, 4, 2, 1, 1], baseFret: 4, barre: { fret: 4, fromString: 6, toString: 1 } },
  'Ab': { frets: [4, 6, 6, 5, 4, 4], fingers: [1, 3, 4, 2, 1, 1], baseFret: 4, barre: { fret: 4, fromString: 6, toString: 1 } },
  'G#m': { frets: [4, 6, 6, 4, 4, 4], fingers: [1, 3, 4, 1, 1, 1], baseFret: 4, barre: { fret: 4, fromString: 6, toString: 1 } },
  'Abm': { frets: [4, 6, 6, 4, 4, 4], fingers: [1, 3, 4, 1, 1, 1], baseFret: 4, barre: { fret: 4, fromString: 6, toString: 1 } },
  'G#7': { frets: [4, 6, 4, 5, 4, 4], fingers: [1, 3, 1, 2, 1, 1], baseFret: 4, barre: { fret: 4, fromString: 6, toString: 1 } },

  // A Family
  'A': { frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0], baseFret: 1 },
  'Am': { frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0], baseFret: 1 },
  'A7': { frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 0, 2, 0, 3, 0], baseFret: 1 },
  'Amaj7': { frets: [-1, 0, 2, 1, 2, 0], fingers: [0, 0, 2, 1, 3, 0], baseFret: 1 },
  'Am7': { frets: [-1, 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0], baseFret: 1 },
  'Asus2': { frets: [-1, 0, 2, 2, 0, 0], fingers: [0, 0, 1, 2, 0, 0], baseFret: 1 },
  'Asus4': { frets: [-1, 0, 2, 2, 3, 0], fingers: [0, 0, 1, 2, 4, 0], baseFret: 1 },
  'A5': { frets: [-1, 0, 2, 2, -1, -1], fingers: [0, 0, 1, 2, 0, 0], baseFret: 1 },

  // A# / Bb Family
  'A#': { frets: [-1, 1, 3, 3, 3, 1], fingers: [0, 1, 2, 3, 4, 1], baseFret: 1, barre: { fret: 1, fromString: 5, toString: 1 } },
  'Bb': { frets: [-1, 1, 3, 3, 3, 1], fingers: [0, 1, 2, 3, 4, 1], baseFret: 1, barre: { fret: 1, fromString: 5, toString: 1 } },
  'A#m': { frets: [-1, 1, 3, 3, 2, 1], fingers: [0, 1, 3, 4, 2, 1], baseFret: 1, barre: { fret: 1, fromString: 5, toString: 1 } },
  'Bbm': { frets: [-1, 1, 3, 3, 2, 1], fingers: [0, 1, 3, 4, 2, 1], baseFret: 1, barre: { fret: 1, fromString: 5, toString: 1 } },
  'Bb7': { frets: [-1, 1, 3, 1, 3, 1], fingers: [0, 1, 3, 1, 4, 1], baseFret: 1, barre: { fret: 1, fromString: 5, toString: 1 } },
  'Bbm7': { frets: [-1, 1, 3, 1, 2, 1], fingers: [0, 1, 3, 1, 2, 1], baseFret: 1, barre: { fret: 1, fromString: 5, toString: 1 } },

  // B Family
  'B': { frets: [-1, 2, 4, 4, 4, 2], fingers: [0, 1, 2, 3, 4, 1], baseFret: 2, barre: { fret: 2, fromString: 5, toString: 1 } },
  'Bm': { frets: [-1, 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1], baseFret: 2, barre: { fret: 2, fromString: 5, toString: 1 } },
  'B7': { frets: [-1, 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4], baseFret: 1 },
  'Bmaj7': { frets: [-1, 2, 4, 3, 4, 2], fingers: [0, 1, 3, 2, 4, 1], baseFret: 2, barre: { fret: 2, fromString: 5, toString: 1 } },
  'Bm7': { frets: [-1, 2, 4, 2, 3, 2], fingers: [0, 1, 3, 1, 2, 1], baseFret: 2, barre: { fret: 2, fromString: 5, toString: 1 } },
  'Bsus4': { frets: [-1, 2, 4, 4, 5, 2], fingers: [0, 1, 3, 3, 4, 1], baseFret: 2, barre: { fret: 2, fromString: 5, toString: 1 } },
  'B5': { frets: [-1, 2, 4, 4, -1, -1], fingers: [0, 1, 3, 4, 0, 0], baseFret: 2 },
}

/**
 * Normalizes chord names (e.g. removes slash bass notes or matches alternative notations)
 */
export function getChordVoicing(chordName: string): ChordVoicing | null {
  const clean = chordName.trim()

  // 1. Direct match
  if (GUITAR_CHORDS[clean]) return GUITAR_CHORDS[clean]

  // 2. Ignore slash bass note for diagram (e.g. "D/F#" -> "D")
  const withoutSlash = clean.split('/')[0]
  if (GUITAR_CHORDS[withoutSlash]) return GUITAR_CHORDS[withoutSlash]

  // 3. Match synonyms (e.g. "Amin" -> "Am", "Cmajor" -> "C")
  const simplified = withoutSlash
    .replace(/min/i, 'm')
    .replace(/maj/i, '')
    .replace(/major/i, '')
  if (GUITAR_CHORDS[simplified]) return GUITAR_CHORDS[simplified]

  return null
}
