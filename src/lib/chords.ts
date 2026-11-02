/**
 * Musical Chords Parser & Transposition Engine
 * Supports both:
 * 1. Bracketed format: [Am]On a dark desert [E7]highway
 * 2. Two-line chords-above-lyrics format:
 *    Am               E7
 *    On a dark desert highway
 */

// Musical chromatic scales (sharps and flats)
const CHROMATIC_SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const
const CHROMATIC_FLATS  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const

// Map note names to chromatic index (0-11)
const NOTE_INDEX: Record<string, number> = {
  'C': 0, 'B#': 0,
  'C#': 1, 'Db': 1,
  'D': 2,
  'D#': 3, 'Eb': 3,
  'E': 4, 'Fb': 4,
  'F': 5, 'E#': 5,
  'F#': 6, 'Gb': 6,
  'G': 7,
  'G#': 8, 'Ab': 8,
  'A': 9,
  'A#': 10, 'Bb': 10,
  'B': 11, 'Cb': 11,
}

// Regex to test if a token looks like a musical chord (e.g. C, Am, G#m7, Fmaj7, D/F#, Bsus, Bsus4)
export const CHORD_REGEX = /^[A-G](?:#|b)?(?:m|maj|min|major|minor|dim|aug|sus[24]?|add\d|\d)*(?:\/[A-G](?:#|b)?)?$/i

// Regex to find all bracketed chords [Am] but avoid section markers like [Verse 1], [Chorus], [Intro]
export const BRACKET_CHORD_REGEX = /\[([A-G](?:#|b)?(?:m|maj|min|major|minor|dim|aug|sus[24]?|add\d|\d)*(?:\/[A-G](?:#|b)?)?)\]/gi

export function isSectionHeader(text: string): boolean {
  const trimmed = text.trim().toLowerCase()
  if (/^\[?(verse|chorus|bridge|intro|outro|interlude|solo|hook|pre-chorus|tag)/.test(trimmed)) {
    return true
  }
  return false
}

export function isChord(token: string): boolean {
  return CHORD_REGEX.test(token.trim())
}

/**
 * Determines if an entire text line is a chord line (i.e. consists only of chords and spaces)
 */
export function isChordLine(line: string): boolean {
  const trimmed = line.trim()
  if (!trimmed || isSectionHeader(trimmed)) return false

  const tokens = trimmed.split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return false

  // All tokens must be valid chord names
  return tokens.every(token => isChord(token))
}

/**
 * Transpose a single root note by semitones
 */
function transposeNote(note: string, semitones: number, preferFlats = false): string {
  const cleanNote = note.charAt(0).toUpperCase() + note.slice(1)
  const currentIndex = NOTE_INDEX[cleanNote]
  if (currentIndex === undefined) return note

  let targetIndex = (currentIndex + semitones) % 12
  if (targetIndex < 0) targetIndex += 12

  const scale = preferFlats ? CHROMATIC_FLATS : CHROMATIC_SHARPS
  return scale[targetIndex]
}

/**
 * Transpose a full chord string (e.g. "C#m7/G#" -> "Dm7/A" with +1 semitone)
 */
export function transposeChord(chord: string, semitones: number, preferFlats = false): string {
  if (semitones === 0) return chord
  const trimmed = chord.trim()

  // Handle slash chords (e.g. D/F#)
  const slashParts = trimmed.split('/')
  const mainChord = slashParts[0]
  const bassNote = slashParts[1]

  // Extract root note (e.g. "C#", "Bb", "A")
  const rootMatch = mainChord.match(/^([A-G](?:#|b)?)(.*)$/)
  if (!rootMatch) return chord

  const root = rootMatch[1]
  const suffix = rootMatch[2]
  const transposedRoot = transposeNote(root, semitones, preferFlats)

  let result = `${transposedRoot}${suffix}`

  if (bassNote) {
    const transposedBass = transposeNote(bassNote, semitones, preferFlats)
    result += `/${transposedBass}`
  }

  return result
}

export type ChordToken = {
  chord: string
  originalChord: string
  charIndex: number // Column position on the line
}

export type ChordSegment = {
  chord?: string
  originalChord?: string
  text: string
}

export type ParsedLine = {
  type: 'header' | 'blank' | 'chord-lyric' | 'chords-only' | 'lyrics-only'
  headerText?: string
  segments?: ChordSegment[]
  chords: ChordToken[]
  lyrics: string
}

/**
 * Splits a chord-lyric line into aligned segments so each chord sits directly
 * above the exact word/syllable it was placed over.
 */
export function buildSegments(chords: ChordToken[], lyrics: string): ChordSegment[] {
  if (!chords || chords.length === 0) {
    return [{ text: lyrics }]
  }

  // Sort chords by character index
  const sorted = [...chords].sort((a, b) => a.charIndex - b.charIndex)
  const segments: ChordSegment[] = []

  // Pre-chord lyrics if the first chord doesn't start at index 0
  if (sorted[0].charIndex > 0) {
    segments.push({
      text: lyrics.substring(0, sorted[0].charIndex)
    })
  }

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i]
    const next = sorted[i + 1]
    const endIndex = next ? next.charIndex : Math.max(lyrics.length, current.charIndex)
    const textSlice = lyrics.substring(current.charIndex, endIndex)

    segments.push({
      chord: current.chord,
      originalChord: current.originalChord,
      text: textSlice || '\u00A0'
    })
  }

  return segments
}

/**
 * Parses raw song lyrics into structured lines for the interactive viewer.
 * Supports:
 * - Bracketed format: "[Am]Hello [C]world"
 * - Two-line format:
 *     Am      C
 *     Hello   world
 */
export function parseSong(text: string, semitones = 0, preferFlats = false): ParsedLine[] {
  if (!text) return []

  const rawLines = text.split(/\r?\n/)
  const result: ParsedLine[] = []

  let i = 0
  while (i < rawLines.length) {
    const line = rawLines[i]
    const trimmed = line.trim()

    // 1. Blank line
    if (!trimmed) {
      result.push({ type: 'blank', chords: [], lyrics: '' })
      i++
      continue
    }

    // 2. Section header (e.g. "[Chorus]", "Verse 1:")
    if (isSectionHeader(trimmed)) {
      result.push({
        type: 'header',
        headerText: trimmed.replace(/^\[|\]$/g, ''),
        chords: [],
        lyrics: ''
      })
      i++
      continue
    }

    // 3. Bracketed chords inside the line (ChordPro style)
    if (BRACKET_CHORD_REGEX.test(line)) {
      BRACKET_CHORD_REGEX.lastIndex = 0
      const chords: ChordToken[] = []
      let plainLyrics = ''
      let match: RegExpExecArray | null

      let lastIndex = 0
      while ((match = BRACKET_CHORD_REGEX.exec(line)) !== null) {
        // Append the lyric text preceding this chord
        plainLyrics += line.substring(lastIndex, match.index)
        const rawChord = match[1]
        const transposed = transposeChord(rawChord, semitones, preferFlats)
        chords.push({
          chord: transposed,
          originalChord: rawChord,
          charIndex: plainLyrics.length
        })
        lastIndex = match.index + match[0].length
      }
      plainLyrics += line.substring(lastIndex)

      result.push({
        type: 'chord-lyric',
        chords,
        lyrics: plainLyrics
      })
      i++
      continue
    }

    // 4. Two-line format detection: check if current line is a pure chord line
    if (isChordLine(line)) {
      const nextLine = i + 1 < rawLines.length ? rawLines[i + 1] : null
      const isNextLineChord = nextLine !== null && isChordLine(nextLine)
      const isNextLineEmptyOrHeader = nextLine === null || !nextLine.trim() || isSectionHeader(nextLine)

      // Extract chords with their exact column positions
      const chords: ChordToken[] = []
      const tokenRegex = /\S+/g
      let match: RegExpExecArray | null
      while ((match = tokenRegex.exec(line)) !== null) {
        const rawChord = match[0]
        const transposed = transposeChord(rawChord, semitones, preferFlats)
        chords.push({
          chord: transposed,
          originalChord: rawChord,
          charIndex: match.index
        })
      }

      if (nextLine !== null && !isNextLineChord && !isNextLineEmptyOrHeader) {
        // Next line is the corresponding lyric line!
        result.push({
          type: 'chord-lyric',
          chords,
          lyrics: nextLine
        })
        i += 2
        continue
      } else {
        // Chords only (e.g. instrumental intro / solo)
        result.push({
          type: 'chords-only',
          chords,
          lyrics: ''
        })
        i++
        continue
      }
    }

    // 5. Normal lyrics line
    result.push({
      type: 'lyrics-only',
      chords: [],
      lyrics: line
    })
    i++
  }

  return result
}
