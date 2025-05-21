import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionProviderWrapper from "../components/custom/SessionProviderWrapper";
import QueryClientProviderWrapper from "@/components/custom/QueryClientProviderWrapper";
import Footer from "@/components/custom/Footer";
import HomeHeader from "@/components/custom/home/HomeHeader";
import { Toaster } from "@/components/ui/sonner";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Talent",
  description: "Find performers for your next event",
  icons: {
    icon: "/assets/talent-logo.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <QueryClientProviderWrapper>
          <SessionProviderWrapper session={session}>
            <HomeHeader />
            {children}
            <Footer />
            <Toaster />
          </SessionProviderWrapper>
        </QueryClientProviderWrapper>
      </body>
    </html>
  );
}
