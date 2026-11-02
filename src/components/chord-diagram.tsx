'use client'

import { getChordVoicing } from '@/lib/chord-db'

type ChordDiagramProps = {
  chord: string
  className?: string
}

export function ChordDiagram({ chord, className = '' }: ChordDiagramProps) {
  const voicing = getChordVoicing(chord)

  if (!voicing) {
    return (
      <div className={`flex flex-col items-center justify-center p-4 text-center ${className}`}>
        <span className="font-bold text-lg text-primary">{chord}</span>
        <span className="text-xs text-muted-foreground mt-1">Diagram not available</span>
      </div>
    )
  }

  const { frets, fingers, baseFret = 1, barre } = voicing

  // SVG layout parameters
  const width = 140
  const height = 160
  const topMargin = 32
  const leftMargin = 28
  const stringSpacing = 16 // 5 spaces = 80px total width
  const fretSpacing = 22   // 4 frets = 88px total height
  const dotRadius = 6

  const effectiveBaseFret = baseFret > 1 ? baseFret : 1
  const isNut = effectiveBaseFret === 1

  return (
    <div className={`flex flex-col items-center p-2 select-none ${className}`}>
      <span className="font-bold text-base text-foreground mb-1">{chord}</span>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="text-foreground"
      >
        {/* Nut (fret 0) or standard top line */}
        <line
          x1={leftMargin}
          y1={topMargin}
          x2={leftMargin + 5 * stringSpacing}
          y2={topMargin}
          stroke="currentColor"
          strokeWidth={isNut ? 4 : 1.5}
        />

        {/* Base fret label if starting higher than fret 1 */}
        {!isNut && (
          <text
            x={leftMargin - 8}
            y={topMargin + fretSpacing / 2 + 4}
            textAnchor="end"
            fontSize="10"
            fontWeight="bold"
            fill="currentColor"
          >
            {effectiveBaseFret}fr
          </text>
        )}

        {/* Horizontal Fret Lines (4 frets shown) */}
        {[1, 2, 3, 4].map((fretIndex) => (
          <line
            key={`fret-${fretIndex}`}
            x1={leftMargin}
            y1={topMargin + fretIndex * fretSpacing}
            x2={leftMargin + 5 * stringSpacing}
            y2={topMargin + fretIndex * fretSpacing}
            stroke="currentColor"
            strokeWidth="1"
            strokeOpacity="0.4"
          />
        ))}

        {/* Vertical String Lines (6 strings, from 6th/low E on left to 1st/high E on right) */}
        {[0, 1, 2, 3, 4, 5].map((strIndex) => (
          <line
            key={`str-${strIndex}`}
            x1={leftMargin + strIndex * stringSpacing}
            y1={topMargin}
            x2={leftMargin + strIndex * stringSpacing}
            y2={topMargin + 4 * fretSpacing}
            stroke="currentColor"
            strokeWidth={strIndex === 0 ? 1.8 : 1}
            strokeOpacity="0.7"
          />
        ))}

        {/* Barre Chord Indicator */}
        {barre && (
          (() => {
            const relFret = barre.fret - effectiveBaseFret + 1
            if (relFret >= 1 && relFret <= 4) {
              const fromX = leftMargin + (6 - barre.fromString) * stringSpacing
              const toX = leftMargin + (6 - barre.toString) * stringSpacing
              const y = topMargin + (relFret - 0.5) * fretSpacing
              return (
                <rect
                  x={Math.min(fromX, toX) - dotRadius}
                  y={y - dotRadius}
                  width={Math.abs(toX - fromX) + 2 * dotRadius}
                  height={2 * dotRadius}
                  rx={dotRadius}
                  fill="currentColor"
                />
              )
            }
            return null
          })()
        )}

        {/* String Markers (X / O above nut) and Finger Dots */}
        {frets.map((fret, strIdx) => {
          const x = leftMargin + strIdx * stringSpacing
          const finger = fingers ? fingers[strIdx] : 0

          // Muted string (X)
          if (fret === -1) {
            return (
              <text
                key={`marker-${strIdx}`}
                x={x}
                y={topMargin - 8}
                textAnchor="middle"
                fontSize="11"
                fontWeight="bold"
                fill="currentColor"
                opacity="0.6"
              >
                ✕
              </text>
            )
          }

          // Open string (O)
          if (fret === 0) {
            return (
              <circle
                key={`marker-${strIdx}`}
                cx={x}
                cy={topMargin - 11}
                r="4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            )
          }

          // Fretted note dot
          const relFret = fret - effectiveBaseFret + 1
          if (relFret >= 1 && relFret <= 4) {
            const y = topMargin + (relFret - 0.5) * fretSpacing
            return (
              <g key={`dot-${strIdx}`}>
                <circle
                  cx={x}
                  cy={y}
                  r={dotRadius}
                  className="fill-primary"
                />
                {finger > 0 && (
                  <text
                    x={x}
                    y={y + 3.5}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="bold"
                    className="fill-primary-foreground pointer-events-none"
                  >
                    {finger}
                  </text>
                )}
              </g>
            )
          }

          return null
        })}
      </svg>
      <span className="text-[11px] text-muted-foreground mt-1">
        Tuning: E A D G B e
      </span>
    </div>
  )
}
