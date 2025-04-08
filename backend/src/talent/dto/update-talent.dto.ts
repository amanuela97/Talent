export class UpdateTalentDto {
  bio?: string;
  services?: string[];
  hourlyRate?: number;
  location?: string;
  availability?: Record<string, string[]>; // JSON object with availability data
  socialLinks?: Record<string, string>; // Optional social links
}
