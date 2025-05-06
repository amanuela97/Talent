'use client';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useAppStore } from '@/app/store/store';
import { handleSignOut } from '@/app/utils/helper';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Bell,
  Calendar,
  LogOut,
  Settings,
  User,
  MessageSquare,
  Star,
  ChevronDown,
  Edit,
  Upload,
  DollarSign,
} from 'lucide-react';
import Link from 'next/link';
import ClientOnly from '@/components/custom/ClientOnly';
import Loader from '@/components/custom/Loader';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const user = useAppStore((state) => state.user);
  const setUser = useAppStore((state) => state.setUser);
  const clearUser = useAppStore((state) => state.clearUser);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      setUser({ ...session.user });
    }
  }, [session, status, setUser]);

  // Show loading while checking authentication
  if (status === 'loading' || !user) {
    return <Loader />;
  }

  const signOut = async () => {
    handleSignOut();
    clearUser();
  };

  return (
    <ClientOnly>
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        {/* <header className="border-b sticky top-0 z-10 bg-white">
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
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-orange-500" />
              </Button>
              <Separator orientation="vertical" className="h-8" />
              <div className="flex items-center gap-2">
                <div className="relative h-8 w-8 rounded-full bg-orange-100 overflow-hidden">
                  <Image
                    src={
                      user.profilePicture ||
                      '/placeholder.svg?height=32&width=32'
                    }
                    alt="User Avatar"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="hidden md:flex flex-col">
                  <span className="text-sm font-medium">{user.name}</span>
                  <span className="text-xs text-gray-500">Musician</span>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </div>
            </div>
          </div>
        </header> */}


        <div className="flex flex-1">
          {/* Sidebar */}
          <aside className="hidden md:flex w-64 flex-col border-r bg-gray-50 p-4">
            <nav className="space-y-1">
              <Link
                href="/dashboard/talent"
                className="flex items-center gap-3 rounded-lg bg-orange-50 px-3 py-2 text-orange-500"
              >
                <User className="h-5 w-5" />
                <span className="text-sm font-medium">Profile</span>
              </Link>
              <Link
                href="#"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 hover:bg-gray-100"
              >
                <Calendar className="h-5 w-5" />
                <span className="text-sm font-medium">Bookings</span>
              </Link>
              <Link
                href="#"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 hover:bg-gray-100"
              >
                <MessageSquare className="h-5 w-5" />
                <span className="text-sm font-medium">Messages</span>
              </Link>
              <Link
                href="#"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 hover:bg-gray-100"
              >
                <DollarSign className="h-5 w-5" />
                <span className="text-sm font-medium">Earnings</span>
              </Link>
              <Link
                href="#"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 hover:bg-gray-100"
              >
                <Star className="h-5 w-5" />
                <span className="text-sm font-medium">Reviews</span>
              </Link>
              <Separator className="my-2" />
              <Link
                href="#"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 hover:bg-gray-100"
              >
                <Settings className="h-5 w-5" />
                <span className="text-sm font-medium">Settings</span>
              </Link>
              <Link
                href="#"
                onClick={() => signOut()}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 bg-blue-500 hover:bg-gray-100"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-sm font-medium">Logout</span>
              </Link>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-4 md:p-6 bg-gray-50">
            <div className="container mx-auto max-w-4xl">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    Talent Profile
                  </h1>
                  <p className="text-gray-500">
                    Manage your performer profile and booking settings
                  </p>
                </div>
                <Button className="mt-4 md:mt-0 bg-orange-500 hover:bg-orange-600">
                  <Edit className="mr-2 h-4 w-4" /> Edit Profile
                </Button>
              </div>

              <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
                  <TabsTrigger value="availability">Availability</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-6">
                  <Card>
                    <CardHeader className="pb-4">
                      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                        <div className="relative">
                          <div className="h-24 w-24 rounded-full bg-orange-100 overflow-hidden">
                            <Image
                              src={
                                user.profilePicture ||
                                '/placeholder.svg?height=32&width=32'
                              }
                              alt="User Avatar"
                              width={96}
                              height={96}
                              className="object-cover"
                            />
                          </div>
                          <Button
                            size="icon"
                            variant="outline"
                            className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-white"
                          >
                            <Upload className="h-4 w-4" />
                            <span className="sr-only">Upload new photo</span>
                          </Button>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-bold">{user.name}</h2>
                            <Badge className="bg-orange-500">Musician</Badge>
                          </div>
                          <p className="text-gray-500">
                            Member since March 2022
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-500">
                            Full Name
                          </p>
                          <p>{user.name}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-500">
                            Email
                          </p>
                          <p>{user.email}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-500">
                            Phone
                          </p>
                          <p>+1 (555) 987-6543</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-500">
                            Location
                          </p>
                          <p>Austin, TX</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-500">
                            Performance Type
                          </p>
                          <p>Jazz Guitarist</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-500">
                            Experience
                          </p>
                          <p>10+ years</p>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h3 className="font-medium">Bio</h3>
                        <p className="text-gray-600">
                          Professional jazz guitarist with over a decade of
                          experience performing at weddings, corporate events,
                          and private parties. Specializing in smooth jazz,
                          bossa nova, and acoustic covers of popular songs.
                          Available for solo performances or with my quartet.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Details</CardTitle>
                      <CardDescription>
                        Your performance information and pricing
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid gap-6 md:grid-cols-2">
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-500">
                              Performance Type
                            </p>
                            <p>Solo Guitarist, Jazz Quartet</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-500">
                              Event Types
                            </p>
                            <p>Weddings, Corporate Events, Private Parties</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-500">
                              Starting Price
                            </p>
                            <p>$250/hour (Solo), $800/hour (Quartet)</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-500">
                              Travel Distance
                            </p>
                            <p>Up to 50 miles</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Bookings</CardTitle>
                      <CardDescription>
                        Your upcoming and recent performances
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-start gap-4">
                          <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-orange-500" />
                          </div>
                          <div className="space-y-1">
                            <p className="font-medium">
                              Corporate Holiday Party
                            </p>
                            <p className="text-sm text-gray-500">
                              December 15, 2023 • 7:00 PM - 10:00 PM
                            </p>
                          </div>
                        </div>
                        <Separator />
                        <div className="flex items-start gap-4">
                          <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-orange-500" />
                          </div>
                          <div className="space-y-1">
                            <p className="font-medium">Wedding Reception</p>
                            <p className="text-sm text-gray-500">
                              November 12, 2023 • 6:00 PM - 9:00 PM
                            </p>
                          </div>
                        </div>
                        <Separator />
                        <div className="flex items-start gap-4">
                          <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                            <Star className="h-5 w-5 text-orange-500" />
                          </div>
                          <div className="space-y-1">
                            <p className="font-medium">
                              New 5-star review received
                            </p>
                            <p className="text-sm text-gray-500">
                              From Johnson Wedding on October 28, 2023
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="portfolio" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Media Gallery</CardTitle>
                      <CardDescription>
                        Your performance photos and videos
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-500">
                        Portfolio content would appear here
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="availability" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Calendar & Availability</CardTitle>
                      <CardDescription>
                        Manage when you&apos;re available for bookings
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-500">
                        Availability calendar would appear here
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </ClientOnly>
  );
}
