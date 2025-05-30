import axiosInstance from "@/app/utils/axios";

export async function sendMessage(
  talentId: string,
  message: string
): Promise<void> {
  await axiosInstance.post("/messages", {
    talentId,
    message,
  });
}
