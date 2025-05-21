import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/app/utils/axios";
import { BookingStatus, Role, Booking } from "@/types/prismaTypes";
import { toast } from "sonner";
import { isAxiosError } from "axios";

export const useBookings = (
  userId: string,
  role: Role,
  status?: BookingStatus | "ALL"
) => {
  const queryClient = useQueryClient();

  // Query key based on role and status
  const getQueryKey = () => {
    switch (role) {
      case "ADMIN":
        return ["bookings", "admin", status];
      case "TALENT":
        return ["bookings", "talent", userId, status];
      case "CUSTOMER":
        return ["bookings", "customer", userId, status];
      default:
        return ["bookings", status];
    }
  };

  // Fetch bookings based on role
  const fetchBookings = async (): Promise<Booking[]> => {
    let url = "";
    switch (role) {
      case "ADMIN":
        url = `/bookings${status !== "ALL" ? `?status=${status}` : ""}`;
        break;
      case "TALENT":
        url = `/bookings/talent/${userId}${
          status !== "ALL" ? `?status=${status}` : ""
        }`;
        break;
      case "CUSTOMER":
        url = `/bookings/customer/${userId}${
          status !== "ALL" ? `?status=${status}` : ""
        }`;
        break;
      default:
        throw new Error("Invalid role");
    }

    const response = await axiosInstance.get(url);
    return response.data;
  };

  // Query for fetching bookings
  const {
    data: bookings,
    isLoading,
    error,
  } = useQuery({
    queryKey: getQueryKey(),
    queryFn: fetchBookings,
    enabled: !!userId,
  });

  // Mutation for updating booking status
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      bookingId,
      newStatus,
    }: {
      bookingId: string;
      newStatus: BookingStatus;
    }) => {
      const response = await axiosInstance.patch(
        `/bookings/${bookingId}/status`,
        {
          status: newStatus,
        }
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all booking queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Booking status updated successfully");
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        toast.error(
          error.response?.data?.message?.message ||
            "Failed to update booking status"
        );
        console.log(error);
      } else {
        console.log(error);
        toast.error("Failed to update booking status");
      }
    },
  });

  return {
    bookings,
    isLoading,
    error,
    updateStatus: updateStatusMutation.mutate,
    isUpdating: updateStatusMutation.isPending,
  };
};
