import Link from "next/link"
import Image from "next/image"
import { logout as signout } from "@/app/auth/actions"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuGroup,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { NavSyncButton } from "@/components/nav-sync-button"

import { auth } from "@/auth"

import { buttonVariants } from "@/components/ui/button-variants"

export default async function Navbar() {
    const session = await auth()
    const user = session?.user

    const initials = user?.name
        ? user.name.substring(0, 2).toUpperCase()
        : user?.email?.substring(0, 2).toUpperCase() || 'U'

    return (
        <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/40 backdrop-blur-xl">
            <div className="flex h-14 items-center px-4">
                <div className="mr-4 flex items-center">
                    <Link href="/" className="mr-6 flex items-center space-x-2.5">
                        <Image src="/logo.jpg" alt="" width={32} height={32} className="rounded-lg shadow-sm" />
                        <span className="font-bold sm:inline-block text-lg tracking-tight text-white">Sadhusanga</span>
                    </Link>
                    <nav aria-label="Main" className="hidden md:flex items-center space-x-1">
                        <Link
                            href="/"
                            className="px-3 py-1.5 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            Home
                        </Link>
                        <Link
                            href="/songs"
                            className="px-3 py-1.5 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            Songs
                        </Link>
                        <Link
                            href="/setlists"
                            className="px-3 py-1.5 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            Setlists
                        </Link>
                    </nav>
                </div>
                <div className="ml-auto flex items-center gap-1">
                    {/* Manual sync button — visible on all screen sizes */}
                    <NavSyncButton />

                    {/* Desktop: user avatar / auth links */}
                    <div className="hidden md:flex items-center ml-2">
                        {user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger aria-label="Account menu" className="relative h-8 w-8 rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 profile-button">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback>{initials}</AvatarFallback>
                                    </Avatar>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent className="w-56" align="end">
                                    <DropdownMenuGroup>
                                        <DropdownMenuLabel className="font-normal">
                                            <div className="flex flex-col space-y-1">
                                                <p className="text-sm font-medium leading-none">{user?.name || user?.email}</p>
                                                <p className="text-xs leading-none text-muted-foreground">
                                                    {user?.email}
                                                </p>
                                            </div>
                                        </DropdownMenuLabel>
                                    </DropdownMenuGroup>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem render={<Link href="/profile" className="w-full text-left" />}>
                                        Profile Settings
                                    </DropdownMenuItem>
                                    {user?.role === 'admin' && (
                                        <DropdownMenuItem render={<Link href="/admin" className="w-full text-left" />}>
                                            Admin Panel
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <form action={signout} className="w-full">
                                        <DropdownMenuItem render={<button type="submit" className="w-full text-left" />}>
                                            Log out
                                        </DropdownMenuItem>
                                    </form>
                                </DropdownMenuContent>

                            </DropdownMenu>
                        ) : (
                            <div className="flex gap-2">
                                <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                                    Login
                                </Link>
                                <Link href="/register" className={buttonVariants({ variant: "default", size: "sm" })}>
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    )
}
