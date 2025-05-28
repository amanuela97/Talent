"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { Role } from "@/types/prismaTypes";
import Loader from "@/components/custom/Loader";

// List of shared routes that don't require role-based access
const SHARED_ROUTES = ["inbox"];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "loading") {
      return;
    }

    const userRole = session?.user?.role as Role;
    const currentPath = pathname.split("/")[2]; // Get the role part from the path

    // Allow access to shared routes
    if (SHARED_ROUTES.includes(currentPath)) {
      return;
    }

    // If user is already on the correct path, don't redirect
    if (currentPath === userRole?.toLowerCase()) {
      return;
    }

    // Redirect based on role
    switch (userRole) {
      case Role.ADMIN:
        router.push("/dashboard/admin");
        break;
      case Role.TALENT:
        router.push("/dashboard/talent");
        break;
      case Role.CUSTOMER:
        router.push("/dashboard/customer");
        break;
      default:
        router.push("/login");
    }
  }, [status, session?.user?.role, router, pathname]);

  // Show loading state while checking authentication
  if (status === "loading") {
    return <Loader />;
  }

  // Check if user is authenticated
  if (status === "authenticated" && session?.user?.role) {
    const userRole = session.user.role.toLowerCase();
    const currentPath = pathname.split("/")[2];

    // Allow access to shared routes
    if (SHARED_ROUTES.includes(currentPath)) {
      return <>{children}</>;
    }

    // Only render children if the user's role matches the current path
    if (userRole === currentPath) {
      return <>{children}</>;
    }

    // If role doesn't match, show loading while redirecting
    return <Loader />;
  }

  // Return loading state while redirecting to login
  return <Loader />;
}
