"use client"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { LogoutButton } from "../LogoutButton"
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
} from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export default function HomeHeader() {
  const { data: session, status } = useSession()
  const user = session?.user;

  console.log('Session:', session);
  console.log('User:', user);
  console.log('Profile Picture URL:', user?.profilePicture);

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          {/* Direct image reference with explicit width and height */}
          <Image src="/assets/talent-logo.png" alt="Talent Logo" width={120} height={48} priority />
        </Link>
        <nav className="hidden md:flex gap-6">
          <Link href="/talents" className="text-sm font-medium hover:underline underline-offset-4">
            Find Talent
          </Link>
          <Link href="#" className="text-sm font-medium hover:underline underline-offset-4">
            How It Works
          </Link>
          <Link href="#" className="text-sm font-medium hover:underline underline-offset-4">
            Pricing
          </Link>
          <Link href="#" className="text-sm font-medium hover:underline underline-offset-4">
            About Us
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          {status === "authenticated" ? (
            <>
              {/* Notification Icon */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-orange-500" />
              </Button>

              {/* Favorites/Saved */}
              <Button variant="ghost" size="icon">
                <Heart className="h-5 w-5" />
              </Button>

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
                        src={user?.profilePicture || "/assets/placeholder.svg"}
                        alt={user?.name || "User"}
                        width={32}
                        height={32}
                        className="object-cover"
                        priority
                        unoptimized={user?.profilePicture?.includes('cloudinary.com')}
                        onError={(e) => {
                          console.error('Image failed to load:', user?.profilePicture);
                          const target = e.target as HTMLImageElement;
                          target.src = "/assets/placeholder.svg";
                        }}
                      />
                    </div>
                    <span className="hidden sm:inline-block font-medium text-sm">{user?.name}</span>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center gap-2 p-2">
                    <div className="relative h-10 w-10 rounded-full overflow-hidden">
                      <Image src={user?.profilePicture || "/placeholder.svg?height=40&width=40"} alt="User" fill className="object-cover" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{user?.name}</span>
                      <div className="flex items-center">
                        <Star className="h-3 w-3 text-gray-400" />
                        <Star className="h-3 w-3 text-gray-400" />
                        <Star className="h-3 w-3 text-gray-400" />
                        <Star className="h-3 w-3 text-gray-400" />
                        <Star className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500 ml-1">No Reviews</span>
                      </div>
                    </div>
                  </div>
                  <DropdownMenuSeparator />

                  {/* User Menu Items */}
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
                    <Link href="/reviews" className="flex items-center cursor-pointer">
                      <Star className="mr-2 h-4 w-4" />
                      <span>Reviews</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/edit-promokit" className="flex items-center cursor-pointer">
                      <FileEdit className="mr-2 h-4 w-4" />
                      <span>Edit PromoKit</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/view-promokit" className="flex items-center cursor-pointer">
                      <Eye className="mr-2 h-4 w-4" />
                      <span>View PromoKit</span>
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
                    <div className="flex items-center cursor-pointer text-red-500 hover:text-red-600">
                      {/* <LogOut className="mr-2 h-4 w-4" /> */}
                      <LogoutButton />
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium hover:underline underline-offset-4 hidden md:inline-flex"
              >
                Log In
              </Link>
              <Link href="/register">
                <Button className="cursor-pointer">Sign Up</Button>
              </Link>
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
                <Link href="/talents" className="text-base font-medium hover:text-orange-500 transition-colors">
                  Find Talent
                </Link>
                <Link href="#" className="text-base font-medium hover:text-orange-500 transition-colors">
                  How It Works
                </Link>
                <Link href="#" className="text-base font-medium hover:text-orange-500 transition-colors">
                  Pricing
                </Link>
                <Link href="#" className="text-base font-medium hover:text-orange-500 transition-colors">
                  About Us
                </Link>
                {status !== "authenticated" && (
                  <>
                    <Link href="/login" className="text-base font-medium hover:text-orange-500 transition-colors">
                      Log In
                    </Link>
                    <Button asChild className="bg-orange-500 hover:bg-orange-600 mt-2 w-full">
                      <Link href="/register">Sign Up</Link>
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