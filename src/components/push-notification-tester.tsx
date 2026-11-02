'use client'

import { useTransition } from "react"
import { BellRing, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { savePushSubscription, sendTestNotification } from "@/app/(app)/profile/push-actions"
import { VAPID_PUBLIC_KEY, urlBase64ToUint8Array } from "@/lib/vapid"

export function PushNotificationTester() {
    const [isPending, startTransition] = useTransition()

    const handleTest = () => {
        startTransition(async () => {
            try {
                if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                    toast.error('Push notifications are not supported on this browser.')
                    return
                }

                if (!VAPID_PUBLIC_KEY) {
                    toast.error('Push is not configured on this deployment (NEXT_PUBLIC_VAPID_PUBLIC_KEY missing).')
                    return
                }

                const perm = await Notification.requestPermission()
                if (perm !== 'granted') {
                    toast.error('Notification permission was denied.')
                    return
                }

                const reg = await navigator.serviceWorker.ready
                let sub = await reg.pushManager.getSubscription()
                if (!sub) {
                    sub = await reg.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                    })
                }

                const rawKey = sub.getKey?.('p256dh')
                const rawAuth = sub.getKey?.('auth')
                const p256dh = rawKey ? btoa(String.fromCharCode(...new Uint8Array(rawKey))) : ''
                const auth = rawAuth ? btoa(String.fromCharCode(...new Uint8Array(rawAuth))) : ''

                const saveRes = await savePushSubscription({
                    endpoint: sub.endpoint, p256dh, auth,
                    isMobile: true, isStandalone: true
                })
                if (saveRes?.error) { toast.error(`Could not save subscription: ${saveRes.error}`); return }

                const testRes = await sendTestNotification()
                if (testRes?.error) {
                    toast.error(`Push sent but server returned: ${testRes.error}`)
                } else {
                    toast.success('✅ Push notification sent! Check your notifications.')
                }
            } catch (e) {
                toast.error(`Push failed: ${e instanceof Error ? e.message : 'Unknown error'}`)
            }
        })
    }

    return (
        <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTest}
            disabled={isPending}
            className="gap-2 w-full"
        >
            {isPending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <BellRing className="h-4 w-4" />
            }
            {isPending ? 'Sending test notification...' : 'Test Push Notification'}
        </Button>
    )
}
