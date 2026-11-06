'use client'

import { useState, useEffect, useTransition } from "react"
import {
    Bell,
    BellRing,
    BellOff,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Send,
    CalendarCheck,
    Clock,
    XCircle,
    RotateCcw,
    MessageSquare,
    ThumbsUp,
    UserCheck,
    Smartphone,
    Share,
    Download
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
    savePushSubscription,
    removePushSubscription,
    updateNotificationPreferences,
    sendTestNotification,
} from "@/app/(app)/profile/push-actions"
import { VAPID_PUBLIC_KEY, urlBase64ToUint8Array } from "@/lib/vapid"

interface NotificationSettingsProps {
    user: {
        id: string
        notifyPracticeMorning: boolean
        notifyPracticeOneHour: boolean
        notifyPracticeCancel: boolean
        notifyPracticeChange: boolean
        notifyPracticeSuggestion: boolean
        notifyPracticeVote: boolean
        notifyPracticeRsvp: boolean
    }
}

function checkIsMobile(): boolean {
    if (typeof window === 'undefined') return false
    const ua = navigator.userAgent || ''
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua)
    const isTouchMac = /Macintosh/i.test(ua) && navigator.maxTouchPoints > 1
    return isMobileUA || isTouchMac
}

function checkIsStandalone(): boolean {
    if (typeof window === 'undefined') return false
    const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches
    const isIosStandalone = (window.navigator as any).standalone === true
    const isAndroidApp = typeof document !== 'undefined' && document.referrer.includes('android-app://')
    return isStandaloneMedia || isIosStandalone || isAndroidApp
}

function getMobilePlatform(): 'ios' | 'android' | 'other' {
    if (typeof window === 'undefined') return 'other'
    const ua = navigator.userAgent || ''
    if (/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) {
        return 'ios'
    }
    if (/Android/i.test(ua)) {
        return 'android'
    }
    return 'other'
}

export function NotificationSettings({ user }: NotificationSettingsProps) {
    const [isMobile, setIsMobile] = useState<boolean | null>(null)
    const [isStandalone, setIsStandalone] = useState<boolean | null>(null)
    const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other')
    const [isSupported, setIsSupported] = useState(false)
    const [permission, setPermission] = useState<NotificationPermission>('default')
    const [isSubscribed, setIsSubscribed] = useState(false)
    const [isPending, startTransition] = useTransition()

    // Preferences state
    const [prefs, setPrefs] = useState({
        morning: user.notifyPracticeMorning ?? true,
        oneHour: user.notifyPracticeOneHour ?? true,
        cancel: user.notifyPracticeCancel ?? true,
        change: user.notifyPracticeChange ?? true,
        suggestion: user.notifyPracticeSuggestion ?? true,
        vote: user.notifyPracticeVote ?? true,
        rsvp: user.notifyPracticeRsvp ?? true,
    })

    useEffect(() => {
        const mobile = checkIsMobile()
        const standalone = checkIsStandalone()
        const plat = getMobilePlatform()

        setIsMobile(mobile)
        setIsStandalone(standalone)
        setPlatform(plat)

        if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true)
            setPermission(Notification.permission)

            navigator.serviceWorker.ready.then(async (registration) => {
                const sub = await registration.pushManager.getSubscription()
                if (sub) {
                    // Only keep subscription active if on an installed mobile app
                    if (!mobile || !standalone) {
                        try {
                            await sub.unsubscribe()
                            await removePushSubscription(sub.endpoint)
                            setIsSubscribed(false)
                        } catch (err) {
                            console.error("Failed to clean up browser subscription:", err)
                        }
                    } else {
                        setIsSubscribed(true)
                    }
                } else {
                    setIsSubscribed(false)
                }
            }).catch(err => {
                console.error("Failed to check push subscription:", err)
            })
        }
    }, [])

    const handleEnablePush = async () => {
        if (!isMobile) {
            toast.error("Push notifications are only available on mobile devices.")
            return
        }

        if (!isStandalone) {
            toast.error("Please install the app to your phone's Home Screen to enable notifications.")
            return
        }

        if (!isSupported) {
            toast.error("Push notifications are not supported on this device.")
            return
        }

        if (!VAPID_PUBLIC_KEY) {
            toast.error("Push is not configured on this deployment (NEXT_PUBLIC_VAPID_PUBLIC_KEY missing).")
            return
        }

        try {
            const requestedPermission = await Notification.requestPermission()
            setPermission(requestedPermission)

            if (requestedPermission !== 'granted') {
                toast.error("Notification permission was denied.")
                return
            }

            const registration = await navigator.serviceWorker.ready
            let subscription = await registration.pushManager.getSubscription()

            if (!subscription) {
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                })
            }

            const rawKey = subscription.getKey ? subscription.getKey('p256dh') : null
            const rawAuth = subscription.getKey ? subscription.getKey('auth') : null

            const p256dh = rawKey ? btoa(String.fromCharCode(...new Uint8Array(rawKey))) : ''
            const auth = rawAuth ? btoa(String.fromCharCode(...new Uint8Array(rawAuth))) : ''

            startTransition(async () => {
                const res = await savePushSubscription({
                    endpoint: subscription.endpoint,
                    p256dh,
                    auth,
                    isMobile: true,
                    isStandalone: true
                })

                if (res?.error) {
                    toast.error(res.error)
                } else {
                    setIsSubscribed(true)
                    toast.success("Push notifications enabled on your installed app!")
                }
            })
        } catch (err: any) {
            console.error("Error subscribing to push notifications:", err)
            toast.error(err.message || "Failed to enable notifications")
        }
    }

    const handleDisablePush = async () => {
        try {
            const registration = await navigator.serviceWorker.ready
            const subscription = await registration.pushManager.getSubscription()

            if (subscription) {
                const endpoint = subscription.endpoint
                await subscription.unsubscribe()

                startTransition(async () => {
                    await removePushSubscription(endpoint)
                    setIsSubscribed(false)
                    toast.success("Notifications disabled for this device.")
                })
            } else {
                setIsSubscribed(false)
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to disable notifications")
        }
    }

    const handleTestPush = () => {
        startTransition(async () => {
            const res = await sendTestNotification()
            if (res?.error) {
                toast.error(res.error)
            } else {
                toast.success("Test push sent! Check your phone's notification tray.")
            }
        })
    }

    const handleTogglePref = (key: keyof typeof prefs) => {
        const nextPrefs = { ...prefs, [key]: !prefs[key] }
        setPrefs(nextPrefs)

        const formData = new FormData()
        if (nextPrefs.morning) formData.append('notifyPracticeMorning', 'on')
        if (nextPrefs.oneHour) formData.append('notifyPracticeOneHour', 'on')
        if (nextPrefs.cancel) formData.append('notifyPracticeCancel', 'on')
        if (nextPrefs.change) formData.append('notifyPracticeChange', 'on')
        if (nextPrefs.suggestion) formData.append('notifyPracticeSuggestion', 'on')
        if (nextPrefs.vote) formData.append('notifyPracticeVote', 'on')
        if (nextPrefs.rsvp) formData.append('notifyPracticeRsvp', 'on')

        startTransition(async () => {
            const res = await updateNotificationPreferences(formData)
            if (res?.error) toast.error(res.error)
            else toast.success("Notification preferences updated.")
        })
    }

    return (
        <Card className="max-w-xl border-white/10 bg-black/40 backdrop-blur-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white text-xl">
                    <Bell className="h-5 w-5 text-primary" />
                    Practice Notifications
                </CardTitle>
                <CardDescription className="text-zinc-400 text-xs">
                    Choose which rehearsal alerts and activity pings you receive.
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Device Status & Actions */}
                {isMobile === false ? (
                    // 1. Desktop view: notifications are mobile app only
                    <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                                <Smartphone className="h-4 w-4 text-primary" />
                                Mobile App Required
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[11px] font-medium text-amber-400">
                                Installed Mobile Only
                            </span>
                        </div>

                        <p className="text-xs text-zinc-300 leading-relaxed">
                            Practice notifications (rehearsal reminders, door codes, and RSVP alerts) are exclusively delivered to the installed mobile app on your phone or tablet.
                        </p>

                        <div className="p-3 rounded-lg bg-zinc-900/60 border border-white/5 flex items-start gap-2.5">
                            <Smartphone className="h-4 w-4 text-zinc-400 mt-0.5 shrink-0" />
                            <p className="text-[11px] text-zinc-400 leading-relaxed">
                                To receive push alerts, open <strong className="text-zinc-200">sadhusanga</strong> on your phone, install the app to your Home Screen, and turn on notifications there.
                            </p>
                        </div>

                        <p className="text-[11px] text-zinc-500">
                            You can still customize your rehearsal notification preferences below from desktop.
                        </p>
                    </div>
                ) : isMobile === true && isStandalone === false ? (
                    // 2. Mobile Browser view: user is on phone/tablet browser, must install app first
                    <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.03] space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                                <Download className="h-4 w-4 text-amber-400" />
                                Install App to Enable Notifications
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[11px] font-medium text-amber-400">
                                Not Installed
                            </span>
                        </div>

                        <p className="text-xs text-zinc-300 leading-relaxed">
                            Push notifications require installing <strong className="text-white">Sadhusanga</strong> to your phone&apos;s Home Screen.
                        </p>

                        <div className="p-3 rounded-lg bg-black/40 border border-white/10 space-y-2">
                            <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider block">
                                How to Install:
                            </span>

                            {platform === 'ios' ? (
                                <div className="space-y-2 text-xs text-zinc-300">
                                    <div className="flex items-start gap-2">
                                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-white mt-0.5">1</span>
                                        <span>Tap the <strong className="text-white">Share</strong> button <Share className="inline h-3.5 w-3.5 text-primary mx-0.5" /> in Safari&apos;s bottom toolbar.</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-white mt-0.5">2</span>
                                        <span>Scroll down and tap <strong className="text-white">&quot;Add to Home Screen&quot;</strong>.</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-white mt-0.5">3</span>
                                        <span>Open the newly installed app on your Home Screen and return to this page to enable notifications.</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2 text-xs text-zinc-300">
                                    <div className="flex items-start gap-2">
                                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-white mt-0.5">1</span>
                                        <span>Tap the browser menu <strong className="text-white">(⋮)</strong> in Chrome.</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-white mt-0.5">2</span>
                                        <span>Tap <strong className="text-white">&quot;Install App&quot;</strong> or <strong className="text-white">&quot;Add to Home screen&quot;</strong>.</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-white mt-0.5">3</span>
                                        <span>Launch the installed app from your Home Screen to activate rehearsal push alerts.</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : isMobile === true && isStandalone === true ? (
                    // 3. Installed Mobile App (Standalone): full notification controls
                    <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                                <Smartphone className="h-4 w-4 text-primary" />
                                Mobile App Notifications
                            </span>
                            {isSubscribed ? (
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Active on this App
                                </span>
                            ) : permission === 'denied' ? (
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-400">
                                    <AlertCircle className="h-4 w-4" />
                                    Blocked in Settings
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                                    <BellOff className="h-4 w-4" />
                                    Not Enabled
                                </span>
                            )}
                        </div>

                        <p className="text-xs text-zinc-400">
                            {isSubscribed
                                ? "This app is registered to receive rehearsal reminders, door codes, and band updates directly on your phone."
                                : permission === 'denied'
                                    ? "Notifications are disabled in device settings. Please enable notifications for Sadhusanga to receive rehearsal alerts."
                                    : "Enable push notifications to receive practice reminders and door codes on your phone."}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                            {!isSubscribed ? (
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={handleEnablePush}
                                    disabled={isPending || !isSupported || permission === 'denied'}
                                    className="gap-1.5 bg-primary text-primary-foreground font-semibold"
                                >
                                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellRing className="h-4 w-4" />}
                                    Enable Notifications
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleTestPush}
                                        disabled={isPending}
                                        className="gap-1.5 text-xs"
                                    >
                                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                                        Send Test Push
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleDisablePush}
                                        disabled={isPending}
                                        className="text-xs text-zinc-400 hover:text-red-400"
                                    >
                                        Disable on This App
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    // Loading skeleton while detecting device type and standalone state
                    <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] animate-pulse space-y-2">
                        <div className="h-4 bg-white/10 rounded w-1/3" />
                        <div className="h-3 bg-white/5 rounded w-2/3" />
                    </div>
                )}

                {/* Section 1: Rehearsal Timing Reminders */}
                <div className="space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-primary" />
                        Rehearsal Day Reminders
                    </span>

                    {/* Morning (9:00 AM) Alert */}
                    <div className="flex items-start justify-between gap-4 p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                        <div className="space-y-0.5">
                            <Label htmlFor="toggle-morning" className="text-sm font-semibold text-white cursor-pointer">
                                Morning Rehearsal Alert (9:00 AM)
                            </Label>
                            <p className="text-xs text-zinc-400">
                                Alerts you at 9:00 AM on practice day with venue, time, and door code.
                            </p>
                        </div>
                        <input
                            id="toggle-morning"
                            type="checkbox"
                            checked={prefs.morning}
                            onChange={() => handleTogglePref('morning')}
                            disabled={isPending}
                            className="h-5 w-5 rounded border-white/20 bg-black/60 text-primary accent-amber-500 cursor-pointer mt-1"
                        />
                    </div>

                    {/* 1 Hour Before Alert */}
                    <div className="flex items-start justify-between gap-4 p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                        <div className="space-y-0.5">
                            <Label htmlFor="toggle-one-hour" className="text-sm font-semibold text-white cursor-pointer">
                                1 Hour Before Practice
                            </Label>
                            <p className="text-xs text-zinc-400">
                                Final heads-up 1 hour before practice starts.
                            </p>
                        </div>
                        <input
                            id="toggle-one-hour"
                            type="checkbox"
                            checked={prefs.oneHour}
                            onChange={() => handleTogglePref('oneHour')}
                            disabled={isPending}
                            className="h-5 w-5 rounded border-white/20 bg-black/60 text-primary accent-amber-500 cursor-pointer mt-1"
                        />
                    </div>
                </div>

                {/* Section 2: Cancellations & Schedule Changes */}
                <div className="space-y-3 pt-2 border-t border-white/5">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                        <XCircle className="h-3.5 w-3.5 text-red-400" />
                        Cancellations & Reschedules
                    </span>

                    {/* Cancellations */}
                    <div className="flex items-start justify-between gap-4 p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                        <div className="space-y-0.5">
                            <Label htmlFor="toggle-cancel" className="text-sm font-semibold text-white cursor-pointer">
                                Practice Cancellations & Restorations
                            </Label>
                            <p className="text-xs text-zinc-400">
                                Alerts you immediately if a scheduled practice is cancelled or un-cancelled.
                            </p>
                        </div>
                        <input
                            id="toggle-cancel"
                            type="checkbox"
                            checked={prefs.cancel}
                            onChange={() => handleTogglePref('cancel')}
                            disabled={isPending}
                            className="h-5 w-5 rounded border-white/20 bg-black/60 text-primary accent-amber-500 cursor-pointer mt-1"
                        />
                    </div>

                    {/* Schedule changes / Applied suggestions */}
                    <div className="flex items-start justify-between gap-4 p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                        <div className="space-y-0.5">
                            <Label htmlFor="toggle-change" className="text-sm font-semibold text-white cursor-pointer">
                                Approved Reschedules & Changes
                            </Label>
                            <p className="text-xs text-zinc-400">
                                Alerts you when a practice date, time, or location is rescheduled.
                            </p>
                        </div>
                        <input
                            id="toggle-change"
                            type="checkbox"
                            checked={prefs.change}
                            onChange={() => handleTogglePref('change')}
                            disabled={isPending}
                            className="h-5 w-5 rounded border-white/20 bg-black/60 text-primary accent-amber-500 cursor-pointer mt-1"
                        />
                    </div>
                </div>

                {/* Section 3: Attendance & RSVPs */}
                <div className="space-y-3 pt-2 border-t border-white/5">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                        <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                        Attendance & RSVPs
                    </span>

                    {/* Member RSVPs */}
                    <div className="flex items-start justify-between gap-4 p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                        <div className="space-y-0.5">
                            <Label htmlFor="toggle-rsvp" className="text-sm font-semibold text-white cursor-pointer">
                                Member RSVPs (Going / Can't Go)
                            </Label>
                            <p className="text-xs text-zinc-400">
                                Alerts you when a band member confirms they are coming or cannot make it.
                            </p>
                        </div>
                        <input
                            id="toggle-rsvp"
                            type="checkbox"
                            checked={prefs.rsvp}
                            onChange={() => handleTogglePref('rsvp')}
                            disabled={isPending}
                            className="h-5 w-5 rounded border-white/20 bg-black/60 text-primary accent-amber-500 cursor-pointer mt-1"
                        />
                    </div>
                </div>

                {/* Section 4: Suggestions & Voting */}
                <div className="space-y-3 pt-2 border-t border-white/5">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5 text-blue-400" />
                        Suggestions & Team Voting
                    </span>

                    {/* New Suggestions */}
                    <div className="flex items-start justify-between gap-4 p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                        <div className="space-y-0.5">
                            <Label htmlFor="toggle-suggestion" className="text-sm font-semibold text-white cursor-pointer">
                                New Reschedule Suggestions
                            </Label>
                            <p className="text-xs text-zinc-400">
                                Alerts you when someone suggests an alternative date, time, or venue so you can vote.
                            </p>
                        </div>
                        <input
                            id="toggle-suggestion"
                            type="checkbox"
                            checked={prefs.suggestion}
                            onChange={() => handleTogglePref('suggestion')}
                            disabled={isPending}
                            className="h-5 w-5 rounded border-white/20 bg-black/60 text-primary accent-amber-500 cursor-pointer mt-1"
                        />
                    </div>

                    {/* Votes on Suggestions */}
                    <div className="flex items-start justify-between gap-4 p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                        <div className="space-y-0.5">
                            <Label htmlFor="toggle-vote" className="text-sm font-semibold text-white cursor-pointer">
                                Votes on Suggestions
                            </Label>
                            <p className="text-xs text-zinc-400">
                                Alerts you when band members cast Yes or No votes on suggestions.
                            </p>
                        </div>
                        <input
                            id="toggle-vote"
                            type="checkbox"
                            checked={prefs.vote}
                            onChange={() => handleTogglePref('vote')}
                            disabled={isPending}
                            className="h-5 w-5 rounded border-white/20 bg-black/60 text-primary accent-amber-500 cursor-pointer mt-1"
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
