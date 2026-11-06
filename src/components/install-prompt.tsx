'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

// Define the interface for the beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault()
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e as BeforeInstallPromptEvent)
            // Update UI notify the user they can install the PWA
            setIsVisible(true)
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        }
    }, [])

    const handleInstallClick = async () => {
        if (!deferredPrompt) return

        // Show the install prompt
        deferredPrompt.prompt()

        // Wait for the user to respond to the prompt
        await deferredPrompt.userChoice

        // Regardless of outcome, we clear the prompt and hide the UI
        setDeferredPrompt(null)
        setIsVisible(false)
    }

    const handleDismiss = () => {
        setIsVisible(false)
    }

    if (!isVisible) return null

    return (
        <div role="region" aria-label="Install app" className="md:hidden fixed top-0 left-0 right-0 z-[100] bg-zinc-950/85 text-white backdrop-blur-xl border-b border-white/10 px-4 py-3 shadow-2xl flex items-center justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <p className="text-sm font-medium">
                    Install Sadhusanga App for a better experience
                </p>
                <Button 
                    onClick={handleInstallClick} 
                    variant="default" 
                    size="sm"
                    className="w-fit"
                >
                    Install App
                </Button>
            </div>
            <button 
                onClick={handleDismiss}
                className="p-1 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                aria-label="Dismiss install prompt"
            >
                <X className="h-5 w-5" />
            </button>
        </div>
    )
}
