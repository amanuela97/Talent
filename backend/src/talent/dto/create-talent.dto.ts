export class CreateTalentDto {
  bio: string;
  services: string[];
  hourlyRate: number;
  location: string;
  availability: Record<string, string[]>; // Map of days to time ranges
  socialLinks?: Record<string, string>; // Optional social links
}
