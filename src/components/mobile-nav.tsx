'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Music, ListMusic, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { Session } from 'next-auth'

export function MobileNav({ session }: { session: Session | null }) {
    const pathname = usePathname()

    // Hide the mobile nav entirely on the login/register screens
    if (pathname === '/login' || pathname === '/register') {
        return null
    }

    const navigation = [
        { name: 'Home', href: '/', icon: Home },
        { name: 'Songs', href: '/songs', icon: Music },
        { name: 'Setlists', href: '/setlists', icon: ListMusic },
        { name: 'Profile', href: '/profile', icon: User, requiresAuth: true }
    ]

    const initials = session?.user?.name
        ? session.user.name.substring(0, 2).toUpperCase()
        : session?.user?.email?.substring(0, 2).toUpperCase() || 'U'

    return (
        <nav aria-label="Mobile" className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/60 backdrop-blur-xl pb-safe shadow-2xl">
            <div className="flex h-16 items-center justify-around px-2">
                {navigation.map((item) => {
                    const isActive = pathname === item.href

                    if (item.requiresAuth && !session?.user) return null

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            aria-current={isActive ? 'page' : undefined}
                            className={cn(
                                "touch-active flex flex-col items-center justify-center w-full h-full gap-1 text-xs font-medium transition-colors",
                                isActive
                                    ? "text-primary font-semibold"
                                    : "text-zinc-400 hover:text-zinc-200"
                            )}
                        >
                            {item.name === 'Profile' && session?.user ? (
                                <Avatar className={cn("h-6 w-6", isActive && "ring-2 ring-primary ring-offset-2 ring-offset-background")}>
                                    <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                                </Avatar>
                            ) : (
                                <item.icon className={cn("h-6 w-6", isActive && "fill-primary/20")} strokeWidth={isActive ? 2.5 : 2} />
                            )}
                            <span>{item.name}</span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
