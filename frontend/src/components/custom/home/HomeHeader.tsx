"use client";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { LogoutButton } from "../LogoutButton";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  Calendar,
  ChevronDown,
  Heart,
  HelpCircle,
  Inbox,
  Menu,
  Settings,
  Star,
  FileEdit,
  LayoutDashboard,
  Loader2,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Role } from "@/types/prismaTypes";
import { RatingDisplay } from "../talents/RatingDisplay";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/app/utils/axios";

export default function HomeHeader() {
  const { data: session, status } = useSession();
  const user = session?.user;

  // Fetch talent data if user is a talent
  const { data: talentData, isLoading: isTalentLoading } = useQuery({
    queryKey: ["talent", user?.userId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/talents/user/${user?.userId}`);
      if (response.status !== 200) {
        throw new Error(
          response?.data?.message || "Failed to fetch talent data"
        );
      }
      return response.data;
    },
    enabled: !!user?.userId && user?.role === "TALENT",
  });

  // Menu items configuration
  const menuItems = [
    {
      href: "/dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
      roles: ["ADMIN", "TALENT", "CUSTOMER"],
    },
    {
      href: "/dashboard/inbox",
      icon: Inbox,
      label: "Inbox",
      roles: ["ADMIN", "TALENT", "CUSTOMER"],
    },
    {
      href: "/reviews",
      icon: Star,
      label: "Reviews",
      roles: ["ADMIN", "TALENT", "CUSTOMER"],
    },
    {
      href: "/talent/profile/edit/overview",
      icon: FileEdit,
      label: "Edit Profile",
      roles: ["TALENT"],
    },
    /* {
      href: "/talents/@me",
      icon: Eye,
      label: "View Profile",
      roles: ["TALENT"]
    }, */
    {
      href: "/talent/profile/edit/calendar",
      icon: Calendar,
      label: "Calendar",
      roles: ["TALENT"],
    },
    {
      href: "/account",
      icon: Settings,
      label: "Account",
      roles: ["ADMIN", "TALENT", "CUSTOMER"],
    },
    {
      href: "/help",
      icon: HelpCircle,
      label: "Help",
      roles: ["ADMIN", "TALENT", "CUSTOMER"],
    },
  ];

  // Mock notifications data - replace with real data from API
  const [notifications] = useState([
    {
      id: 1,
      title: "New booking request",
      message: "Sarah Johnson wants to book you for a wedding",
      time: "2 minutes ago",
      read: false,
      type: "booking",
    },
    {
      id: 2,
      title: "Payment received",
      message: "You received $500 for the corporate event",
      time: "1 hour ago",
      read: false,
      type: "payment",
    },
    {
      id: 3,
      title: "New review",
      message: "Mike Chen left you a 5-star review",
      time: "3 hours ago",
      read: true,
      type: "review",
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          {/* Direct image reference with explicit width and height */}
          <Image
            src="/assets/talent-logo.png"
            alt="Talent Logo"
            width={120}
            height={48}
            priority
          />
        </Link>
        <nav className="hidden md:flex gap-6">
          <Link
            href="/talents"
            className="text-sm font-medium hover:underline underline-offset-4"
          >
            Find Talent
          </Link>
          <Link
            href="#"
            className="text-sm font-medium hover:underline underline-offset-4"
          >
            How It Works
          </Link>
          <Link
            href="#"
            className="text-sm font-medium hover:underline underline-offset-4"
          >
            Pricing
          </Link>
          <Link
            href="#"
            className="text-sm font-medium hover:underline underline-offset-4"
          >
            About Us
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          {status === "authenticated" ? (
            <>
              {/* Notification Icon */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center font-medium">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <div className="flex items-center justify-between p-3 border-b">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-orange-500 hover:text-orange-600"
                      >
                        Mark all as read
                      </Button>
                    )}
                  </div>

                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No notifications
                    </div>
                  ) : (
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map((notification) => (
                        <DropdownMenuItem key={notification.id} className="p-0">
                          <div
                            className={`w-full p-3 hover:bg-gray-50 cursor-pointer border-l-4 ${
                              !notification.read
                                ? "border-l-orange-500 bg-orange-50/30"
                                : "border-l-transparent"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`mt-1 h-2 w-2 rounded-full ${
                                  !notification.read
                                    ? "bg-orange-500"
                                    : "bg-transparent"
                                }`}
                              />
                              <div className="flex-1 min-w-0">
                                <p
                                  className={`text-sm font-medium ${
                                    !notification.read
                                      ? "text-gray-900"
                                      : "text-gray-600"
                                  }`}
                                >
                                  {notification.title}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {notification.time}
                                </p>
                              </div>
                            </div>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  )}

                  {notifications.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <div className="p-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-sm text-gray-600 hover:text-gray-800"
                        >
                          View all notifications
                        </Button>
                      </div>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

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
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 pl-1 pr-0"
                  >
                    <div className="relative h-8 w-8 rounded-full overflow-hidden">
                      <Image
                        src={user?.profilePicture || "/assets/placeholder.svg"}
                        alt={user?.name || "User"}
                        width={32}
                        height={32}
                        className="object-cover"
                        priority
                        unoptimized={user?.profilePicture?.includes(
                          "cloudinary.com"
                        )}
                        onError={(e) => {
                          console.error(
                            "Image failed to load:",
                            user?.profilePicture
                          );
                          const target = e.target as HTMLImageElement;
                          target.src = "/assets/placeholder.svg";
                        }}
                      />
                    </div>
                    <span className="hidden sm:inline-block font-medium text-sm">
                      {user?.name}
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center gap-2 p-2">
                    <div className="relative h-10 w-10 rounded-full overflow-hidden">
                      <Image
                        src={
                          user?.profilePicture ||
                          "/placeholder.svg?height=40&width=40"
                        }
                        alt="User"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{user?.name}</span>
                      {user?.role === "TALENT" && (
                        <>
                          {isTalentLoading ? (
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              <span>Loading rating...</span>
                            </div>
                          ) : (
                            talentData && (
                              <RatingDisplay
                                rating={Number(talentData.rating)}
                                reviewCount={talentData.reviews?.length ?? 0}
                                size="sm"
                                showCount={true}
                              />
                            )
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />

                  {/* User Menu Items */}
                  {menuItems.map((item, index) => {
                    // Only show items for the user's role
                    if (!item.roles.includes(user?.role as Role)) return null;

                    return (
                      <DropdownMenuItem key={index} asChild>
                        <Link
                          href={item.href}
                          className="flex items-center cursor-pointer"
                        >
                          <item.icon className="mr-2 h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <div className="flex items-center cursor-pointer text-red-500 hover:text-red-600">
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
                <Link
                  href="/talents"
                  className="text-base font-medium hover:text-orange-500 transition-colors"
                >
                  Find Talent
                </Link>
                <Link
                  href="#"
                  className="text-base font-medium hover:text-orange-500 transition-colors"
                >
                  How It Works
                </Link>
                <Link
                  href="#"
                  className="text-base font-medium hover:text-orange-500 transition-colors"
                >
                  Pricing
                </Link>
                <Link
                  href="#"
                  className="text-base font-medium hover:text-orange-500 transition-colors"
                >
                  About Us
                </Link>
                {status !== "authenticated" && (
                  <>
                    <Link
                      href="/login"
                      className="text-base font-medium hover:text-orange-500 transition-colors"
                    >
                      Log In
                    </Link>
                    <Button
                      asChild
                      className="bg-orange-500 hover:bg-orange-600 mt-2 w-full"
                    >
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
  );
}
