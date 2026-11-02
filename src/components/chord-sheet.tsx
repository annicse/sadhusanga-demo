'use client'

import React from 'react'
import { parseSong, type ParsedLine, type ChordToken } from '@/lib/chords'
import { ChordDiagram } from '@/components/chord-diagram'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

type ChordSheetProps = {
  lyrics: string
  semitones?: number
  preferFlats?: boolean
  fontSizeClass?: string
  className?: string
}

function ChordBadge({ token }: { token: ChordToken }) {
  return (
    <Popover>
      <PopoverTrigger
        render={(props) => (
          <button
            {...props}
            type="button"
            className="inline-flex items-center px-1.5 py-0.5 rounded text-xs md:text-sm font-bold font-mono bg-primary/15 text-primary hover:bg-primary/25 active:scale-95 transition-all cursor-pointer select-none border border-primary/20 shadow-xs print:bg-transparent print:border-none print:shadow-none print:p-0 print:text-blue-900 print:font-bold print:text-[11px] print:font-mono"
            title={`View chord diagram for ${token.chord}`}
          >
            {token.chord}
          </button>
        )}
      />
      <PopoverContent className="w-auto p-2 border-border shadow-xl bg-popover" align="center" side="top">
        <ChordDiagram chord={token.chord} />
      </PopoverContent>
    </Popover>
  )
}

export function ChordSheet({
  lyrics,
  semitones = 0,
  preferFlats = false,
  fontSizeClass = 'text-base',
  className = ''
}: ChordSheetProps) {
  const parsedLines = React.useMemo(() => {
    return parseSong(lyrics || '', semitones, preferFlats)
  }, [lyrics, semitones, preferFlats])

  if (!lyrics || !lyrics.trim()) {
    return (
      <div className="text-muted-foreground italic p-6 text-center">
        No lyrics or chords provided for this song yet.
      </div>
    )
  }

  return (
    <div className={cn("space-y-1 font-sans selection:bg-primary/20 leading-relaxed print:columns-2 print:gap-8 print:space-y-0 print:text-[11.5px] print:leading-normal", fontSizeClass, className)}>
      {parsedLines.map((line, idx) => (
        <LineRenderer key={idx} line={line} />
      ))}
    </div>
  )
}

function LineRenderer({ line }: { line: ParsedLine }) {
  // 1. Section Header (e.g. Verse 1, Chorus, Bridge)
  if (line.type === 'header') {
    return (
      <div
        className="pt-4 pb-1 print:pt-3 print:pb-1 print-avoid-break print-break-after-avoid"
        style={{ breakAfter: 'avoid', pageBreakAfter: 'avoid' }}
      >
        <span className="inline-block px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-secondary text-secondary-foreground border border-border/60 print:bg-zinc-100 print:text-zinc-800 print:border-zinc-300 print:px-2 print:py-0.5 print:text-[10px] print:font-bold print:tracking-wider">
          {line.headerText}
        </span>
      </div>
    )
  }

  // 2. Blank Line
  if (line.type === 'blank') {
    return <div className="h-4 print:h-2.5" />
  }

  // 3. Instrumental Chords Only
  if (line.type === 'chords-only') {
    return (
      <div
        className="flex flex-wrap items-center gap-2 py-1.5 print:py-1 print:gap-2 print-avoid-break"
        style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
      >
        {line.chords.map((token, i) => (
          <ChordBadge key={i} token={token} />
        ))}
      </div>
    )
  }

  // 4. Chord + Lyric line
  if (line.type === 'chord-lyric') {
    // If chords exist, render them with aligned positions above lyrics
    return (
      <div
        className="py-1 print:py-0.5 print:mb-0.5 print-avoid-break"
        style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
      >
        {/* Chord Row */}
        <div className="flex flex-wrap items-center gap-2 min-h-6 mb-0.5 print:min-h-0 print:gap-2 print:mb-0.5">
          {line.chords.map((token, i) => (
            <ChordBadge key={i} token={token} />
          ))}
        </div>
        {/* Lyric Row */}
        {line.lyrics && (
          <div className="text-foreground font-medium leading-snug print:text-zinc-900 print:text-[11.5px] print:leading-normal">
            {line.lyrics}
          </div>
        )}
      </div>
    )
  }

  // 5. Plain Lyric Line
  return (
    <div
      className="text-foreground/90 py-0.5 font-normal print:text-zinc-900 print:text-[11.5px] print:py-0.5 print:leading-normal print-avoid-break"
      style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
    >
      {line.lyrics}
    </div>
  )
}
