"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import {
  UserCheck,
  Users,
  Settings,
  LogOut,
  BarChart2,
  MessageSquare,
  FileText,
  HelpCircle,
  Tag,
  Book,
} from "lucide-react";
import Link from "next/link";
import Loader from "@/components/custom/Loader";
import { toast } from "sonner";
import axiosInstance from "@/app/utils/axios";
import { handleSignOut } from "@/app/utils/helper";

interface DashboardStats {
  totalTalents: number;
  pendingApprovals: number;
  pendingCategories: number;
  totalUsers: number;
  totalBookings: number;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalTalents: 0,
    pendingApprovals: 0,
    pendingCategories: 0,
    totalUsers: 0,
    totalBookings: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated and is an admin
    if (status === "authenticated") {
      if (session?.user?.role !== "ADMIN") {
        toast.info("You do not have permission to view this page.");
        router.push("/");
      } else {
        // Fetch dashboard statistics
        fetchDashboardStats();
      }
    } else if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, session, router]);

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);

      // Initialize default values in case we can't fetch all stats
      let pendingCount = 0;
      let pendingCategoriesCount = 0;
      let totalTalents = 0;

      try {
        // Fetch pending talents to get count
        const pendingResponse = await axiosInstance.get(
          "/talents/admin/pending"
        );
        pendingCount =
          pendingResponse.data.totalCount ||
          (Array.isArray(pendingResponse.data.talents)
            ? pendingResponse.data.talents.length
            : 0) ||
          (Array.isArray(pendingResponse.data)
            ? pendingResponse.data.length
            : 0) ||
          0;
        console.log("Pending talents response:", pendingResponse.data);
      } catch (pendingError) {
        console.error("Error fetching pending talents:", pendingError);
        // Continue with other stats
      }

      try {
        // Fetch pending categories
        const pendingCategoriesResponse = await axiosInstance.get(
          "/talent_categories",
          {
            params: { status: "PENDING" },
          }
        );
        pendingCategoriesCount = pendingCategoriesResponse.data.length || 0;
      } catch (categoriesError) {
        console.error("Error fetching pending categories:", categoriesError);
        // Continue with other stats
      }

      try {
        // Example of how you might fetch other stats
        // In a real app, you would create proper endpoints for these
        const talentsResponse = await axiosInstance.get("/talents", {
          params: { take: 1 },
        });
        totalTalents = talentsResponse.data.totalCount || 0;
      } catch (talentsError) {
        console.error("Error fetching total talents:", talentsError);
        // Continue with default values
      }

      // Set the dashboard stats
      setStats({
        totalTalents,
        pendingApprovals: pendingCount,
        pendingCategories: pendingCategoriesCount,
        totalUsers: totalTalents + 100, // Example placeholder
        totalBookings: 25, // Example placeholder
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      toast.error(
        "Failed to fetch some dashboard statistics. Using available data."
      );

      // Still set stats with defaults to avoid a completely empty dashboard
      setStats({
        totalTalents: 0,
        pendingApprovals: 0,
        pendingCategories: 0,
        totalUsers: 100, // Example placeholder
        totalBookings: 0, // Example placeholder
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || status === "loading") {
    return <Loader />;
  }

  if (!session || session.user?.role !== "ADMIN") {
    return null; // This will be redirected by the useEffect
  }

  // Admin dashboard menu items
  const adminMenuItems = [
    {
      icon: <UserCheck className="h-5 w-5" />,
      title: "Talent Approval",
      description: "Review and approve pending talent applications",
      href: "/dashboard/admin/talent-approval",
      color: "bg-amber-100 text-amber-600",
      count: stats.pendingApprovals,
    },
    {
      icon: <Tag className="h-5 w-5" />,
      title: "Category Management",
      description: "Review and approve pending category suggestions",
      href: "/dashboard/admin/category-management",
      color: "bg-emerald-100 text-emerald-600",
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: "User Management",
      description: "Manage user accounts and permissions",
      href: "/dashboard/admin/users",
      color: "bg-blue-100 text-blue-600",
      count: stats.totalUsers,
    },
    {
      icon: <BarChart2 className="h-5 w-5" />,
      title: "Analytics",
      description: "View platform statistics and metrics",
      href: "/dashboard/admin/analytics",
      color: "bg-purple-100 text-purple-600",
    },
    {
      icon: <MessageSquare className="h-5 w-5" />,
      title: "Messages",
      description: "Manage platform communications",
      href: "/dashboard/admin/messages",
      color: "bg-green-100 text-green-600",
    },
    {
      icon: <Book className="h-5 w-5" />,
      title: "Bookings",
      description: "Manage talent bookings",
      href: "/dashboard/admin/bookings",
      color: "bg-pink-100 text-pink-600",
    },
    {
      icon: <Settings className="h-5 w-5" />,
      title: "Settings",
      description: "Platform configuration and settings",
      href: "/dashboard/admin/settings",
      color: "bg-gray-100 text-gray-600",
    },
    {
      icon: <HelpCircle className="h-5 w-5" />,
      title: "Support",
      description: "Manage user support tickets",
      href: "/dashboard/admin/support",
      color: "bg-teal-100 text-teal-600",
    },
    {
      icon: <LogOut className="h-5 w-5" />,
      title: "Sign Out",
      description: "Log out from the admin dashboard",
      action: handleSignOut,
      color: "bg-red-100 text-red-600",
    },
  ];

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {session.user?.name || "Admin"}
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatsCard
          title="Total Talents"
          value={stats.totalTalents}
          icon={<Users className="h-6 w-6" />}
          color="bg-blue-50 text-blue-500"
        />
        <StatsCard
          title="Pending Approvals"
          value={stats.pendingApprovals}
          icon={<UserCheck className="h-6 w-6" />}
          color="bg-amber-50 text-amber-500"
        />
        <StatsCard
          title="Pending Categories"
          value={stats.pendingCategories}
          icon={<Tag className="h-6 w-6" />}
          color="bg-emerald-50 text-emerald-500"
        />
        <StatsCard
          title="Total Users"
          value={stats.totalUsers}
          icon={<Users className="h-6 w-6" />}
          color="bg-purple-50 text-purple-500"
        />
        <StatsCard
          title="Total Bookings"
          value={stats.totalBookings}
          icon={<FileText className="h-6 w-6" />}
          color="bg-green-50 text-green-500"
        />
      </div>

      {/* Admin Menu */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {adminMenuItems.map((item, index) => (
          <Card
            key={index}
            className="overflow-hidden hover:shadow-md transition-shadow"
          >
            {item.href ? (
              <Link href={item.href} className="block h-full">
                <AdminMenuCard item={item} />
              </Link>
            ) : (
              <button
                className="w-full text-left cursor-pointer"
                onClick={item.action ? item.action : undefined}
              >
                <AdminMenuCard item={item} />
              </button>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

function StatsCard({ title, value, icon, color }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
          </div>
          <div className={`p-3 rounded-full ${color}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

interface AdminMenuItem {
  icon: React.ReactNode;
  title: string;
  description: string;
  href?: string;
  action?: () => void;
  color: string;
  count?: number;
}

function AdminMenuCard({ item }: { item: AdminMenuItem }) {
  return (
    <CardContent className="p-6 h-full flex flex-col">
      <div className={`p-3 rounded-full w-fit ${item.color} mb-4`}>
        {item.icon}
      </div>
      <CardTitle className="text-xl mb-2">{item.title}</CardTitle>
      <CardDescription className="flex-grow">
        {item.description}
      </CardDescription>
      {item.count !== undefined && (
        <div className="mt-4">
          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {item.count}
          </span>
        </div>
      )}
    </CardContent>
  );
}
