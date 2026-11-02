// Client-safe VAPID helpers.
//
// NEXT_PUBLIC_VAPID_PUBLIC_KEY is inlined at build time, so client components
// can read it directly. There is intentionally no fallback key: a public key
// that does not match VAPID_PRIVATE_KEY lets `pushManager.subscribe` succeed
// while every send fails with 403, which is very hard to debug.

export const VAPID_PUBLIC_KEY: string | undefined = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

/** Converts a URL-safe base64 VAPID key into the Uint8Array `pushManager.subscribe` expects. */
export function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const out = new Uint8Array(new ArrayBuffer(rawData.length))
    for (let i = 0; i < rawData.length; ++i) out[i] = rawData.charCodeAt(i)
    return out
}
