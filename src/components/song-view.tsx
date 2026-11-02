'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Pen,
  Trash2,
  Maximize2,
  Minimize2,
  Sun,
  ArrowLeft,
  RotateCcw,
  Info,
  ExternalLink,
  Printer
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { deleteSong } from '@/app/(app)/songs/actions'
import { removeSongLocally } from '@/lib/sync'
import { deleteSongOffline, isOffline } from '@/lib/offline-songs'
import { db, isOfflineId } from '@/lib/db'
import { useLiveQuery } from 'dexie-react-hooks'
import { toast } from 'sonner'
import { ChordSheet } from '@/components/chord-sheet'
import { transposeChord } from '@/lib/chords'

type SongViewProps = {
  song: {
    id: string
    title: string
    artist: string | null
    key: string | null
    tempo: number | null
    notes: string | null
    lyrics: string | null
    songlink: string | null
  }
}

const FONT_SIZES = [
  { label: 'A-', class: 'text-sm md:text-base' },
  { label: 'A', class: 'text-base md:text-lg' },
  { label: 'A+', class: 'text-lg md:text-xl' },
  { label: 'A++', class: 'text-xl md:text-2xl' },
]

export function SongView({ song: serverSong }: SongViewProps) {
  const router = useRouter()
  // Prefer the local (Dexie) copy so offline edits and background syncs show up
  // immediately; the server-rendered prop is the initial value and the fallback.
  const song = useLiveQuery(() => db.songs.get(serverSong.id), [serverSong.id], serverSong) ?? serverSong
  const [semitones, setSemitones] = useState(0)
  const [isPerformanceMode, setIsPerformanceMode] = useState(false)
  const [fontSizeIndex, setFontSizeIndex] = useState(1) // default medium
  const [isPending, setIsPending] = useState(false)
  const [wakeLockActive, setWakeLockActive] = useState(false)
  const [mounted, setMounted] = useState(false)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Lock body scroll in performance mode
  useEffect(() => {
    if (isPerformanceMode) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isPerformanceMode])

  // Screen Wake Lock lifecycle for Performance Mode
  useEffect(() => {
    let isSubscribed = true

    async function requestWakeLock() {
      if ('wakeLock' in navigator && isPerformanceMode) {
        try {
          const sentinel = await navigator.wakeLock.request('screen')
          if (isSubscribed) {
            wakeLockRef.current = sentinel
            setWakeLockActive(true)
            sentinel.addEventListener('release', () => {
              if (isSubscribed) setWakeLockActive(false)
            })
          }
        } catch {
          // Wake lock request failed or rejected
          if (isSubscribed) setWakeLockActive(false)
        }
      }
    }

    if (isPerformanceMode) {
      requestWakeLock()
    } else {
      if (wakeLockRef.current) {
        wakeLockRef.current.release()
        wakeLockRef.current = null
      }
      setWakeLockActive(false)
    }

    return () => {
      isSubscribed = false
      if (wakeLockRef.current) {
        wakeLockRef.current.release()
        wakeLockRef.current = null
      }
    }
  }, [isPerformanceMode])

  // ESC key to exit performance mode
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isPerformanceMode) {
        setIsPerformanceMode(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPerformanceMode])

  async function handleDelete() {
    if (confirm('Are you sure you want to delete this song?')) {
      setIsPending(true)
      if (isOffline() || isOfflineId(song.id)) {
        await deleteSongOffline(song.id)
        toast.success('Deleted offline — will sync when you are back online')
        router.push('/songs')
        return
      }
      const result = await deleteSong(song.id)
      if (result && 'error' in result) {
        toast.error(result.error || 'Failed to delete song')
        setIsPending(false)
      } else if (result?.success) {
        // Remove from local Dexie cache immediately
        await removeSongLocally(song.id)
        toast.success('Song deleted successfully')
        router.push('/')
      }
    }
  }

  // Calculate current transposed key
  const effectiveKey = React.useMemo(() => {
    if (!song.key) return null
    return transposeChord(song.key, semitones)
  }, [song.key, semitones])

  // =========================================================================
  // 1. PERFORMANCE MODE (Stage Reader with Screen Wake Lock)
  // =========================================================================
  const performanceModeOverlay = isPerformanceMode && mounted ? createPortal(
    <div className="fixed inset-0 z-[99999] bg-background text-foreground flex flex-col h-screen w-screen overflow-hidden">
      {/* Sticky Stage Top Bar */}
      <header className="flex items-center justify-between px-4 py-3 border-b bg-card text-card-foreground shrink-0 gap-2 shadow-sm">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="truncate">
            <h1 className="text-lg md:text-xl font-bold truncate">{song.title}</h1>
            {song.artist && (
              <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
            )}
          </div>

          {effectiveKey && (
            <Badge variant="outline" className="text-xs font-mono font-bold shrink-0">
              Key: {effectiveKey} {semitones !== 0 && `(${semitones > 0 ? `+${semitones}` : semitones})`}
            </Badge>
          )}

          {song.tempo && (
            <Badge variant="secondary" className="text-xs font-mono shrink-0 hidden sm:inline-flex">
              {song.tempo} BPM
            </Badge>
          )}

          {song.songlink && (
            <a
              href={song.songlink}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full border border-primary/20 hover:bg-primary/20 transition-colors"
              title="Listen to this song"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Listen
            </a>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Wake Lock Status Indicator */}
          {wakeLockActive && (
            <span
              className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-amber-500 bg-amber-500/10 px-2 py-1 rounded-full border border-amber-500/20"
              title="Screen is kept awake for performance"
            >
              <Sun className="h-3.5 w-3.5 animate-pulse" />
              Awake
            </span>
          )}

          {/* Font Size Zoom */}
          <div className="inline-flex items-center rounded-lg border border-white/15 bg-white/5 backdrop-blur-md p-0.5">
            <button
              type="button"
              onClick={() => setFontSizeIndex((i) => Math.max(0, i - 1))}
              disabled={fontSizeIndex === 0}
              className="px-2.5 py-1 text-xs font-bold hover:bg-white/10 disabled:opacity-30 rounded-md cursor-pointer transition-colors"
              title="Decrease font size"
            >
              A-
            </button>
            <button
              type="button"
              onClick={() => setFontSizeIndex((i) => Math.min(FONT_SIZES.length - 1, i + 1))}
              disabled={fontSizeIndex === FONT_SIZES.length - 1}
              className="px-2.5 py-1 text-xs font-bold hover:bg-white/10 disabled:opacity-30 rounded-md cursor-pointer transition-colors"
              title="Increase font size"
            >
              A+
            </button>
          </div>

          {/* Transpose Controls in Stage View */}
          <div className="inline-flex items-center rounded-lg border border-white/15 bg-white/5 backdrop-blur-md p-0.5">
            <button
              type="button"
              onClick={() => setSemitones((s) => s - 1)}
              className="px-2.5 py-1 text-xs font-bold hover:bg-white/10 rounded-md font-mono cursor-pointer transition-colors"
              title="Transpose down"
            >
              -1
            </button>
            <button
              type="button"
              onClick={() => setSemitones(0)}
              disabled={semitones === 0}
              className="px-1.5 py-1 text-xs font-mono text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
              title="Reset key"
            >
              {semitones === 0 ? '0' : semitones > 0 ? `+${semitones}` : semitones}
            </button>
            <button
              type="button"
              onClick={() => setSemitones((s) => s + 1)}
              className="px-2 py-1 text-xs font-bold hover:bg-muted rounded font-mono cursor-pointer"
              title="Transpose up"
            >
              +1
            </button>
          </div>

          {/* Exit Performance Mode */}
          <Button
            variant="default"
            size="sm"
            onClick={() => setIsPerformanceMode(false)}
            className="gap-1.5 cursor-pointer"
          >
            <Minimize2 className="h-4 w-4" />
            <span className="hidden sm:inline">Exit</span>
          </Button>
        </div>
      </header>

      {/* Scrollable Stage Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-4xl mx-auto w-full">
        {song.notes && (
          <div className="mb-6 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-sm flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <strong className="font-semibold">Performance Note:</strong> {song.notes}
            </div>
          </div>
        )}

        <ChordSheet
          lyrics={song.lyrics || ''}
          semitones={semitones}
          fontSizeClass={FONT_SIZES[fontSizeIndex].class}
        />
      </main>
    </div>,
    document.body
  ) : null

  // =========================================================================
  // 2. STANDARD VIEW
  // =========================================================================
  return (
    <>
      {performanceModeOverlay}
      <Card className="max-w-4xl mx-auto shadow-sm print:border-none print:shadow-none print:max-w-none print:bg-transparent">
        <CardHeader className="space-y-3 pb-4 border-b">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <CardTitle className="text-2xl md:text-3xl font-bold tracking-tight">
                {song.title}
              </CardTitle>
              {song.artist && (
                <p className="text-base text-muted-foreground mt-0.5">{song.artist}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 self-stretch sm:self-auto print:hidden">
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => setIsPerformanceMode(true)}
                className="flex-1 sm:flex-initial gap-1.5 bg-primary text-primary-foreground font-semibold shadow-xs"
              >
                <Maximize2 className="h-4 w-4" />
                Performance Mode
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="gap-1.5"
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => router.push(`/songs/${song.id}/edit`)}
                className="gap-1.5"
              >
                <Pen className="h-4 w-4" />
                Edit
              </Button>
            </div>
          </div>

          {/* Metadata & Transpose Toolbar — single compact row */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {effectiveKey ? (
              <Badge variant="secondary" className="font-mono text-xs px-2.5 py-1 gap-1">
                Key: <strong className="text-foreground">{effectiveKey}</strong>
                {semitones !== 0 && (
                  <span className="text-primary font-bold">
                    ({semitones > 0 ? `+${semitones}` : semitones})
                  </span>
                )}
                {semitones !== 0 && (
                  <span className="text-muted-foreground font-normal">← {song.key}</span>
                )}
              </Badge>
            ) : null}

            {song.tempo ? (
              <Badge variant="outline" className="font-mono text-xs px-2.5 py-1">
                {song.tempo} BPM
              </Badge>
            ) : null}

            {song.songlink ? (
              <a
                href={song.songlink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20 hover:bg-primary/20 transition-colors print:hidden"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Listen
              </a>
            ) : null}

            {/* Spacer */}
            <div className="flex-1 print:hidden" />

            {/* Transpose Controls */}
            <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 p-1 rounded-lg backdrop-blur-md print:hidden">
              <span className="text-xs font-semibold text-muted-foreground px-1.5">Transpose:</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0 font-mono font-bold"
                onClick={() => setSemitones((s) => s - 1)}
                title="Transpose down 1 semitone"
              >
                -1
              </Button>
              <span className="font-mono text-xs font-bold w-7 text-center">
                {semitones === 0 ? '0' : semitones > 0 ? `+${semitones}` : semitones}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0 font-mono font-bold"
                onClick={() => setSemitones((s) => s + 1)}
                title="Transpose up 1 semitone"
              >
                +1
              </Button>
              {semitones !== 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setSemitones(0)}
                  title="Reset to original key"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reset
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 md:p-6 space-y-6">
          {song.notes && (
            <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-sm flex items-start gap-2">
              <Info className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <strong className="font-semibold">Performance Note:</strong> {song.notes}
              </div>
            </div>
          )}

          <ChordSheet
            lyrics={song.lyrics || ''}
            semitones={semitones}
            fontSizeClass="text-base md:text-lg"
          />
        </CardContent>

        <CardFooter className="flex justify-between items-center border-t p-4 md:p-6 bg-card/40 print:hidden">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isPending}
            className="gap-1.5"
          >
            <Trash2 className="h-4 w-4" />
            Delete Song
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isPending}
            className="gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </CardFooter>
      </Card>
    </>
  )
}
