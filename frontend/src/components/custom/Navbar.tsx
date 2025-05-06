"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Bell,
    Calendar,
    ChevronDown,
    Heart,
    HelpCircle,
    Inbox,
    LogOut,
    Menu,
    Settings,
    Star,
    FileEdit,
    Eye,
    LayoutDashboard,
    Wrench,
    Users,
    BarChart,
} from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

// This would come from your auth context/provider
type UserRole = "user" | "talent" | "admin" | null

interface NavbarProps {
    userRole?: UserRole
    userName?: string
    userImage?: string
}

export function Navbar({ userRole = null, userName = "", userImage = "" }: NavbarProps) {
    const [isScrolled, setIsScrolled] = useState(false)
    const pathname = usePathname()

    // This would be replaced with your actual auth logic
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)

        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10)
        }

        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    const navLinks = [
        { href: "/find-talent", label: "Find Talent" },
        { href: "/how-it-works", label: "How It Works" },
        { href: "/pricing", label: "Pricing" },
        { href: "/about", label: "About Us" },
    ]

    return (
        <header
            className={`sticky top-0 z-50 w-full transition-all duration-200 ${isScrolled ? "bg-white shadow-sm" : "bg-white"
                } border-b`}
        >
            <div className="container flex h-16 items-center justify-between px-4">
                <div className="flex items-center gap-4">
                    <Link href="/" className="flex items-center gap-2">
                        <Image
                            src="/assets/talent-logo.png"
                            alt="Talent Logo"
                            width={100}
                            height={50}
                            priority
                        />
                    </Link>

                    <nav className="hidden md:flex gap-6 ml-6">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`text-sm font-medium hover:text-orange-500 transition-colors ${pathname === link.href ? "text-orange-500" : "text-gray-700"
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    {isClient && userRole ? (
                        <>
                            {/* Notification Icon */}
                            <Button variant="ghost" size="icon" className="relative">
                                <Bell className="h-5 w-5" />
                                <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-orange-500" />
                            </Button>

                            {/* Favorites/Saved (only for users and talents) */}
                            {(userRole === "user" || userRole === "talent") && (
                                <Button variant="ghost" size="icon">
                                    <Heart className="h-5 w-5" />
                                </Button>
                            )}

                            {/* Messages */}
                            <Button variant="ghost" size="icon">
                                <Inbox className="h-5 w-5" />
                            </Button>

                            {/* User Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="flex items-center gap-2 pl-1 pr-0">
                                        <div className="relative h-8 w-8 rounded-full overflow-hidden">
                                            <Image
                                                src={userImage || "/placeholder.svg?height=32&width=32"}
                                                alt={userName || "User"}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <span className="hidden sm:inline-block font-medium text-sm">{userName}</span>
                                        <ChevronDown className="h-4 w-4 text-gray-500" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <div className="flex items-center gap-2 p-2">
                                        <div className="relative h-10 w-10 rounded-full overflow-hidden">
                                            <Image
                                                src={userImage || "/placeholder.svg?height=40&width=40"}
                                                alt={userName || "User"}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm">{userName || "User"}</span>
                                            {userRole === "talent" && (
                                                <div className="flex items-center">
                                                    <Star className="h-3 w-3 text-gray-400" />
                                                    <Star className="h-3 w-3 text-gray-400" />
                                                    <Star className="h-3 w-3 text-gray-400" />
                                                    <Star className="h-3 w-3 text-gray-400" />
                                                    <Star className="h-3 w-3 text-gray-400" />
                                                    <span className="text-xs text-gray-500 ml-1">No Reviews</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <DropdownMenuSeparator />

                                    {/* User Menu Items */}
                                    {userRole === "user" && (
                                        <>
                                            <DropdownMenuItem asChild>
                                                <Link href="/dashboard" className="flex items-center cursor-pointer">
                                                    <LayoutDashboard className="mr-2 h-4 w-4" />
                                                    <span>Dashboard</span>
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link href="/inbox" className="flex items-center cursor-pointer">
                                                    <Inbox className="mr-2 h-4 w-4" />
                                                    <span>Inbox</span>
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link href="/bookings" className="flex items-center cursor-pointer">
                                                    <Calendar className="mr-2 h-4 w-4" />
                                                    <span>My Bookings</span>
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link href="/favorites" className="flex items-center cursor-pointer">
                                                    <Heart className="mr-2 h-4 w-4" />
                                                    <span>Favorites</span>
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                        </>
                                    )}

                                    {/* Talent Menu Items */}
                                    {userRole === "talent" && (
                                        <>
                                            <DropdownMenuItem asChild>
                                                <Link href="/dashboard/talent" className="flex items-center cursor-pointer">
                                                    <LayoutDashboard className="mr-2 h-4 w-4" />
                                                    <span>Dashboard</span>
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link href="/inbox" className="flex items-center cursor-pointer">
                                                    <Inbox className="mr-2 h-4 w-4" />
                                                    <span>Inbox</span>
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link href="/reviews" className="flex items-center cursor-pointer">
                                                    <Star className="mr-2 h-4 w-4" />
                                                    <span>Reviews</span>
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link href="/edit-promokit" className="flex items-center cursor-pointer">
                                                    <FileEdit className="mr-2 h-4 w-4" />
                                                    <span>Edit Profile</span>
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link href="/view-promokit" className="flex items-center cursor-pointer">
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    <span>View Profile</span>
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link href="/calendar" className="flex items-center cursor-pointer">
                                                    <Calendar className="mr-2 h-4 w-4" />
                                                    <span>Calendar</span>
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link href="/tools" className="flex items-center cursor-pointer">
                                                    <Wrench className="mr-2 h-4 w-4" />
                                                    <span>Tools</span>
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                        </>
                                    )}

                                    {/* Admin Menu Items */}
                                    {userRole === "admin" && (
                                        <>
                                            <DropdownMenuItem asChild>
                                                <Link href="/admin/dashboard" className="flex items-center cursor-pointer">
                                                    <LayoutDashboard className="mr-2 h-4 w-4" />
                                                    <span>Admin Dashboard</span>
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link href="/admin/users" className="flex items-center cursor-pointer">
                                                    <Users className="mr-2 h-4 w-4" />
                                                    <span>Manage Users</span>
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link href="/admin/talents" className="flex items-center cursor-pointer">
                                                    <Star className="mr-2 h-4 w-4" />
                                                    <span>Manage Talents</span>
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link href="/admin/analytics" className="flex items-center cursor-pointer">
                                                    <BarChart className="mr-2 h-4 w-4" />
                                                    <span>Analytics</span>
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                        </>
                                    )}

                                    {/* Common Menu Items for All Logged In Users */}
                                    <DropdownMenuItem asChild>
                                        <Link href="/account" className="flex items-center cursor-pointer">
                                            <Settings className="mr-2 h-4 w-4" />
                                            <span>Account</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/help" className="flex items-center cursor-pointer">
                                            <HelpCircle className="mr-2 h-4 w-4" />
                                            <span>Help</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link href="/logout" className="flex items-center cursor-pointer text-red-500 hover:text-red-600">
                                            <LogOut className="mr-2 h-4 w-4" />
                                            <span>Log Out</span>
                                        </Link>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    ) : (
                        <>
                            <Link
                                href="/login"
                                className="text-sm font-medium hover:text-orange-500 transition-colors hidden md:inline-flex"
                            >
                                Log In
                            </Link>
                            <Button asChild className="bg-orange-500 hover:bg-orange-600">
                                <Link href="/signup">Sign Up</Link>
                            </Button>
                        </>
                    )}

                    {/* Mobile Menu */}
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="md:hidden">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right">
                            <nav className="flex flex-col gap-4 mt-8">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={`text-base font-medium hover:text-orange-500 transition-colors ${pathname === link.href ? "text-orange-500" : "text-gray-700"
                                            }`}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                                {!userRole && (
                                    <>
                                        <Link href="/login" className="text-base font-medium hover:text-orange-500 transition-colors">
                                            Log In
                                        </Link>
                                        <Button asChild className="bg-orange-500 hover:bg-orange-600 mt-2 w-full">
                                            <Link href="/signup">Sign Up</Link>
                                        </Button>
                                    </>
                                )}
                            </nav>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    )
}
