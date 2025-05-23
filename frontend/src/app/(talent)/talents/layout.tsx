import type React from "react";
import "@/app/globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Talent Discovery Platform",
  description: "Connect with amazing performers for your next event",
};

export default function TalentsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="min-h-screen">{children}</div>;
}
