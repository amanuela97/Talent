"use client";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Loader from "@/components/custom/Loader";
import { useTalentProfile } from "@/hooks/useTalentProfile";
import axiosInstance from "@/app/utils/axios";

export default function TalentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status, update: updateSession } = useSession();
  const { talent, loading: talentLoading } = useTalentProfile();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isRefreshingSession, setIsRefreshingSession] = useState(false);
  const authCheckCompleted = useRef(false);

  useEffect(() => {
    // Skip rechecking if we've already done an initial auth check
    if (authCheckCompleted.current) return;

    if (status === "unauthenticated") {
      setIsRedirecting(true);
      router.push("/login");
      return;
    }

    // First fetch the latest user data to check for role updates
    const refreshUserSession = async () => {
      try {
        setIsRefreshingSession(true);
        // Fetch the latest user data
        const response = await axiosInstance.get("/auth/me");

        if (response.data) {
          console.log("Latest user data from server:", response.data);

          // Update the session with the latest user data
          // Note: updateSession() triggers a re-render but doesn't update the current session object immediately
          await updateSession({
            ...session,
            accessToken: response.data.accessToken,
            refreshToken: response.data.refreshToken,
            user: {
              ...session?.user,
              role: response.data.user.role, // Update with the latest role
            },
          });
          // Session is not immediately updated - next render cycle will have the updated value
          return response.data.user.role; // Return the role from the API for immediate use
        }
      } catch (error) {
        console.error("Failed to refresh session:", error);
      } finally {
        setIsRefreshingSession(false);
      }
      return null;
    };

    const checkAccess = async () => {
      // Refresh session only if we have an authenticated session
      let latestRole = null;
      if (status === "authenticated" && talent?.status === "APPROVED") {
        latestRole = await refreshUserSession();
        console.log(
          "Latest role from API:",
          latestRole,
          "(Using this for access control)"
        );
      }

      // Wait until both session and talent data are loaded
      if (
        status === "authenticated" &&
        !talentLoading &&
        !isRefreshingSession
      ) {
        // Use latestRole from API if available, otherwise fallback to session
        // We need this because updateSession() doesn't update the session object immediately
        const userRole = latestRole || session?.user?.role;
        const talentStatus = talent?.status;
        authCheckCompleted.current = true;
        console.log(
          "Using role for access check:",
          userRole,
          "Talent status:",
          talentStatus
        );

        // Only allow APPROVED talents to access talent routes
        if (userRole === "TALENT") {
          if (talentStatus === "APPROVED") {
            // Allow access to talent routes
            return;
          } else if (talentStatus === "PENDING") {
            setIsRedirecting(true);
            router.push("/join/pending");
            return;
          } else if (talentStatus === "REJECTED") {
            setIsRedirecting(true);
            router.push("/join");
            return;
          } else {
            setIsRedirecting(true);
            router.push("/");
            return;
          }
        } else {
          // Check if this user is actually an approved talent but session hasn't updated
          if (talentStatus === "APPROVED") {
            // Try refreshing the session one more time if we haven't already
            if (!latestRole) {
              latestRole = await refreshUserSession();
              console.log("Second attempt latestRole:", latestRole);
            }

            // If after refreshing, the latest role is TALENT, allow access
            if (latestRole === "TALENT") {
              return; // Allow access
            }

            // Otherwise redirect
            setIsRedirecting(true);
            const roleBasedRoute =
              session?.user?.role === "ADMIN"
                ? "/dashboard/admin"
                : "/dashboard/talent";
            const destination = redirect ?? roleBasedRoute;
            router.push(destination);
          } else {
            // Redirect other roles to their appropriate dashboards
            setIsRedirecting(true);
            const roleBasedRoute =
              userRole === "ADMIN" ? "/dashboard/admin" : "/dashboard/talent";
            const destination = redirect ?? roleBasedRoute;
            router.push(destination);
          }
        }
      }
    };

    checkAccess();
  }, [
    status,
    router,
    redirect,
    session,
    talent,
    talentLoading,
    updateSession,
    isRefreshingSession,
  ]);

  // Show the loader during initial load, when refreshing session, or when redirecting
  if (
    (status === "loading" || talentLoading || isRefreshingSession) &&
    !authCheckCompleted.current
  ) {
    return <Loader />;
  }

  if (isRedirecting) {
    return <Loader />;
  }

  // Only render children if user is authenticated and is an APPROVED talent
  return <div className="min-h-screen">{children}</div>;
}
