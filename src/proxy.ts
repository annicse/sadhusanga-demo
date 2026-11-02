import { auth } from "@/auth"

export default auth((req) => {
    const isLoggedIn = !!req.auth
    const isOnAuthPage = req.nextUrl.pathname.startsWith('/login') || req.nextUrl.pathname.startsWith('/register')

    if (isOnAuthPage) {
        if (isLoggedIn) {
            return Response.redirect(new URL('/', req.nextUrl))
        }
        return
    }

    if (!isLoggedIn) {
        return Response.redirect(new URL('/login', req.nextUrl))
    }
})

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api/auth (authentication routes)
         * - api/cron (cron job routes — called by external scheduler, no session)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico, sw.js, workbox-*, manifest.json (PWA / service worker files)
         * - images, fonts
         */
        '/((?!api/auth|api/cron|_next/static|_next/image|favicon.ico|icon.png|sw.js|workbox-|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
