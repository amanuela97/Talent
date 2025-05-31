import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  PartyPopper,
  Music,
  Mic,
  Palette,
  Search,
  Calendar,
} from "lucide-react";
import FadeCarousel from "../FadeCarousel";

const HomeMain = () => {
  return (
    <main className="flex-1">
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-white to-sky-50">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="space-y-4">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                Book Amazing Talent for Your Next Event
              </h1>
              <p className="max-w-[600px] text-gray-500 md:text-xl">
                Find and hire the perfect entertainers for any occasion. From
                clowns and musicians to magicians and more.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-orange-500 hover:bg-orange-600 cursor-pointer"
                >
                  <Link href="/talents">Find Talent</Link>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="cursor-pointer">
                  <Link href="/join">Become a Talent</Link>
                </Button>
              </div>
            </div>
            <FadeCarousel />
          </div>
        </div>
      </section>

      <section className="w-full py-12 md:py-24 bg-white">
        <div className="container mx-auto px-4 md:px-6 flex flex-col items-center">
          <div className="flex flex-col items-center justify-center space-y-4 text-center max-w-3xl mx-auto">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Find the Perfect Entertainment
              </h2>
              <p className="max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Browse through our diverse categories of talented performers
                ready to make your event unforgettable.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-4 w-full">
            <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="rounded-full bg-orange-100 p-3">
                <PartyPopper className="h-6 w-6 text-orange-500" />
              </div>
              <h3 className="text-xl font-bold">Clowns & Characters</h3>
              <p className="text-center text-sm text-gray-500">
                Perfect for children&apos;s parties and family events
              </p>
            </div>
            <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="rounded-full bg-blue-100 p-3">
                <Music className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold">Musicians</h3>
              <p className="text-center text-sm text-gray-500">
                Solo artists, bands, and DJs for any occasion
              </p>
            </div>
            <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="rounded-full bg-purple-100 p-3">
                <Mic className="h-6 w-6 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold">Performers</h3>
              <p className="text-center text-sm text-gray-500">
                Magicians, dancers, and specialty acts
              </p>
            </div>
            <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="rounded-full bg-green-100 p-3">
                <Palette className="h-6 w-6 text-green-500" />
              </div>
              <h3 className="text-xl font-bold">Artists</h3>
              <p className="text-center text-sm text-gray-500">
                Face painters, caricaturists, and more
              </p>
            </div>
          </div>
          <div className="flex justify-center w-full">
            <Button variant="outline" size="lg">
              View All Categories
            </Button>
          </div>
        </div>
      </section>

      <section className="w-full py-12 md:py-24 bg-sky-50">
        <div className="container mx-auto px-4 md:px-6 flex flex-col items-center">
          <div className="flex flex-col items-center justify-center space-y-4 text-center max-w-3xl mx-auto">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                How It Works
              </h2>
              <p className="max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Booking talent for your event has never been easier
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 py-12 md:grid-cols-3 w-full">
            <div className="flex flex-col items-center space-y-4">
              <div className="rounded-full bg-orange-500 p-3 text-white">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">1. Search</h3>
              <p className="text-center text-gray-500">
                Browse our extensive catalog of talented performers and filter
                by category, location, and price.
              </p>
            </div>
            <div className="flex flex-col items-center space-y-4">
              <div className="rounded-full bg-orange-500 p-3 text-white">
                <Calendar className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">2. Book</h3>
              <p className="text-center text-gray-500">
                Select your preferred date and time, then request a booking with
                your chosen talent.
              </p>
            </div>
            <div className="flex flex-col items-center space-y-4">
              <div className="rounded-full bg-orange-500 p-3 text-white">
                <PartyPopper className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">3. Enjoy</h3>
              <p className="text-center text-gray-500">
                Sit back and enjoy as professional entertainers make your event
                memorable.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full py-12 md:py-24 bg-white">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="space-y-4">
              <div className="inline-block rounded-lg bg-orange-100 px-3 py-1 text-sm text-orange-500">
                Testimonials
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                What Our Customers Say
              </h2>
              <blockquote className="border-l-4 border-orange-500 pl-4 italic text-gray-500">
                &quot;We hired a clown for my daughter&apos;s birthday party and
                it was the highlight of the event! The booking process was
                seamless and the performer was absolutely amazing with the
                kids.&quot;
              </blockquote>
              <p className="font-medium">- Sarah Johnson, Birthday Party</p>
              <blockquote className="border-l-4 border-orange-500 pl-4 italic text-gray-500">
                &quot;Found an incredible jazz band for our corporate event with
                just a few clicks. Our clients were impressed and we&apos;ve
                already booked them again for our next function.&quot;
              </blockquote>
              <p className="font-medium">- Michael Chen, Corporate Event</p>
            </div>
            <FadeCarousel />
          </div>
        </div>
      </section>

      <section className="w-full py-12 md:py-24 bg-orange-500 text-white">
        <div className="container mx-auto px-4 md:px-6 flex flex-col items-center">
          <div className="flex flex-col items-center justify-center space-y-4 text-center max-w-3xl mx-auto">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Ready to Make Your Event Unforgettable?
              </h2>
              <p className="max-w-[700px] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Join thousands of satisfied customers who have found the perfect
                talent for their events.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-white text-orange-500 hover:bg-gray-100"
              >
                Get Started Today
              </Button>
              {/* Fixed the Learn More button to have visible text */}
              <Button
                size="lg"
                className="bg-transparent border-2 border-white text-white hover:bg-white/20 hover:border-white"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full py-12 md:py-24 bg-white">
        <div className="container mx-auto px-4 md:px-6 flex flex-col items-center">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl w-full">
            <div className="space-y-2">
              <h3 className="text-lg font-bold">For Event Planners</h3>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>
                  <Link href="#" className="hover:underline">
                    How to Book
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    FAQs
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Event Ideas
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold">For Performers</h3>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>
                  <Link href="#" className="hover:underline">
                    Join as Talent
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Success Stories
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Resources
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Talent Community
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold">Company</h3>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>
                  <Link href="#" className="hover:underline">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Press
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold">Support</h3>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>
                  <Link href="#" className="hover:underline">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Safety
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default HomeMain;
