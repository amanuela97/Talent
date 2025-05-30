import axiosInstance from "@/app/utils/axios";
import { TalentProfileProps } from "@/components/custom/talents/TalentProfile";

export async function getTalentByServiceName(
  serviceName: string
): Promise<TalentProfileProps["talent"]> {
  try {
    // Convert underscore to spaces to match backend format
    const formattedServiceName = serviceName.replace(/_/g, " ");
    const response = await axiosInstance.get(
      `/talents/service/${formattedServiceName}`
    );

    if (!response.data) {
      throw new Error("Talent not found");
    }

    return response.data;
  } catch (error) {
    console.error("Error fetching talent:", error);
    throw error;
  }
}

export async function getTalentReviews(talentId: string, page = 1, limit = 5) {
  try {
    const response = await axiosInstance.get(`/talents/${talentId}/reviews`, {
      params: { page, limit },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching reviews:", error);
    throw error;
  }
}

export async function submitReview(
  talentId: string,
  data: { rating: number; comment: string }
) {
  const response = await axiosInstance.post(
    `/talents/${talentId}/review`,
    data
  );
  return response.data;
}

export async function submitReply(reviewId: string, comment: string) {
  const response = await axiosInstance.post(
    `/talents/reviews/${reviewId}/reply`,
    {
      comment,
    }
  );
  return response.data;
}
