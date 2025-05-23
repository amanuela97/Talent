"use client";

import { useState, use, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import axiosInstance from "@/app/utils/axios";
import EventTypeData from "../../../../../EventTypes.json";

// Budget ranges
const budgetRanges = [
  "Under $500",
  "$500 - $1,000",
  "$1,000 - $2,000",
  "$2,000 - $5,000",
  "Over $5,000",
];

export default function BookingPage({
  params,
}: {
  params: Promise<{ serviceName: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const talentId = searchParams.get("talentId");
  const services = searchParams.get("services");
  const { serviceName } = use(params);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [talentData, setTalentData] = useState<{
    talentId: string;
    services: string[];
  } | null>({
    talentId: talentId || "",
    services: JSON.parse(services ? services : "[]"),
  });

  // Form state
  const [formData, setFormData] = useState({
    eventType: "",
    equipmentNeeded: "",
    guestCount: "",
    location: "",
    eventDate: null as Date | null,
    eventTime: "",
    duration: "",
    budgetRange: "",
    budgetAmount: "",
    serviceRequirements: [] as string[],
    additionalComments: "",
  });

  // Add validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch talent data if talentId or services are missing
  useEffect(() => {
    const fetchTalentData = async () => {
      if (!talentId || !services) {
        try {
          setLoading(true);
          const response = await axiosInstance.get(
            `/talents/service/${serviceName}`
          );
          if (response.data) {
            setTalentData({
              talentId: response.data.talentId,
              services: response.data.services || [],
            });
          }
        } catch (error) {
          console.error("Error fetching talent data:", error);
          toast.error("Failed to fetch talent information. Please try again.");
          router.push(`/talents/${serviceName}`);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchTalentData();
  }, [talentId, services, serviceName, router]);

  // Use either the URL params or fetched data
  const finalTalentId = talentId || talentData?.talentId;

  // Show loading state while fetching data
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading talent information...</p>
        </div>
      </div>
    );
  }

  // Redirect if we couldn't get talent data
  if (!talentId && !talentData) {
    return null; // The useEffect will handle the redirect
  }

  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    setFormData((prev) => ({ ...prev, eventDate: date || null }));
  };

  // Handle service requirement toggle
  const toggleServiceRequirement = (service: string) => {
    setFormData((prev) => ({
      ...prev,
      serviceRequirements: prev.serviceRequirements.includes(service)
        ? prev.serviceRequirements.filter((s) => s !== service)
        : [...prev.serviceRequirements, service],
    }));
  };

  // Validate step 1
  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.eventType) {
      newErrors.eventType = "Event type is required";
    }
    if (!formData.guestCount) {
      newErrors.guestCount = "Guest count is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate step 2
  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.location) {
      newErrors.location = "Location is required";
    }
    if (!formData.eventDate) {
      newErrors.eventDate = "Event date is required";
    }
    if (!formData.duration) {
      newErrors.duration = "Duration is required";
    } else {
      const duration = Number(formData.duration);
      if (isNaN(duration) || !Number.isInteger(duration)) {
        newErrors.duration = "Duration must be a whole number";
      } else if (duration < 1) {
        newErrors.duration = "Duration must be at least 1 hour";
      } else if (duration > 24) {
        newErrors.duration = "Duration cannot exceed 24 hours";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate step 3
  const validateStep3 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.budgetRange) {
      newErrors.budgetRange = "Budget range is required";
    }
    if (formData.serviceRequirements.length === 0) {
      newErrors.serviceRequirements =
        "At least one service requirement is required";
    }
    if (
      formData.budgetAmount &&
      (isNaN(Number(formData.budgetAmount)) ||
        Number(formData.budgetAmount) <= 0)
    ) {
      newErrors.budgetAmount = "Budget amount must be a positive number";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle next step
  const handleNextStep = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent form submission
    let isValid = false;
    switch (currentStep) {
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      case 3:
        isValid = validateStep3();
        break;
    }

    if (isValid) {
      setCurrentStep((prev) => prev + 1);
      setErrors({});
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all steps before submission
    const isStep1Valid = validateStep1();
    const isStep2Valid = validateStep2();
    const isStep3Valid = validateStep3();

    if (!isStep1Valid || !isStep2Valid || !isStep3Valid) {
      toast.error("Please complete all required fields before submitting");
      return;
    }

    setLoading(true);

    try {
      // Create booking with proper number conversions
      const response = await axiosInstance.post("/bookings", {
        ...formData,
        duration: parseInt(formData.duration, 10), // Convert to integer
        budgetAmount: formData.budgetAmount
          ? parseFloat(formData.budgetAmount)
          : undefined, // Convert to float if provided
        guestCount: parseInt(formData.guestCount, 10), // Convert to integer
        talentId: finalTalentId,
        eventDate: formData.eventDate,
      });

      if (response.data) {
        toast.success("Booking request submitted successfully!");
        router.push(`/talents/${serviceName}/booking-confirmation`);
      }
    } catch (error) {
      console.error("Error submitting booking:", error);
      toast.error("Failed to submit booking request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="eventType">Event Type *</Label>
              <Select
                value={formData.eventType}
                onValueChange={(value) =>
                  handleSelectChange("eventType", value)
                }
              >
                <SelectTrigger
                  className={errors.eventType ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  {EventTypeData.EventTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.eventType && (
                <p className="text-sm text-red-500">{errors.eventType}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="equipmentNeeded">
                What equipment will you need the performer to provide?
              </Label>
              <Textarea
                id="equipmentNeeded"
                name="equipmentNeeded"
                value={formData.equipmentNeeded}
                onChange={handleInputChange}
                placeholder="Please specify any equipment requirements..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="guestCount">
                How many guests are you expecting at the event? *
              </Label>
              <Input
                id="guestCount"
                name="guestCount"
                type="number"
                value={formData.guestCount}
                onChange={handleInputChange}
                placeholder="Enter approximate number of guests"
                className={errors.guestCount ? "border-red-500" : ""}
              />
              {errors.guestCount && (
                <p className="text-sm text-red-500">{errors.guestCount}</p>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="location">Event Location/Address *</Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Enter event location"
                className={errors.location ? "border-red-500" : ""}
              />
              {errors.location && (
                <p className="text-sm text-red-500">{errors.location}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Event Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.eventDate && "text-muted-foreground",
                      errors.eventDate && "border-red-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.eventDate ? (
                      format(formData.eventDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.eventDate || undefined}
                    onSelect={handleDateSelect}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.eventDate && (
                <p className="text-sm text-red-500">{errors.eventDate}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventTime">Event Time</Label>
              <Input
                id="eventTime"
                name="eventTime"
                type="time"
                value={formData.eventTime}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (hours) *</Label>
              <Input
                id="duration"
                name="duration"
                type="number"
                value={formData.duration}
                onChange={handleInputChange}
                placeholder="Enter duration in hours"
                className={errors.duration ? "border-red-500" : ""}
              />
              {errors.duration && (
                <p className="text-sm text-red-500">{errors.duration}</p>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Budget Range *</Label>
              <Select
                value={formData.budgetRange}
                onValueChange={(value) =>
                  handleSelectChange("budgetRange", value)
                }
              >
                <SelectTrigger
                  className={errors.budgetRange ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Select budget range" />
                </SelectTrigger>
                <SelectContent>
                  {budgetRanges.map((range) => (
                    <SelectItem key={range} value={range}>
                      {range}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.budgetRange && (
                <p className="text-sm text-red-500">{errors.budgetRange}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="budgetAmount">
                Specific Budget Amount (Optional)
              </Label>
              <Input
                id="budgetAmount"
                name="budgetAmount"
                type="number"
                value={formData.budgetAmount}
                onChange={handleInputChange}
                placeholder="Enter specific budget amount"
              />
            </div>

            <div className="space-y-2">
              <Label>Service Requirements *</Label>
              <div className="grid grid-cols-2 gap-2">
                {talentData?.services.map((service) => (
                  <Button
                    key={service}
                    type="button"
                    variant={
                      formData.serviceRequirements.includes(service)
                        ? "default"
                        : "outline"
                    }
                    onClick={() => toggleServiceRequirement(service)}
                    className="justify-start"
                  >
                    {service}
                  </Button>
                ))}
              </div>
              {errors.serviceRequirements && (
                <p className="text-sm text-red-500">
                  {errors.serviceRequirements}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalComments">Additional Comments</Label>
              <Textarea
                id="additionalComments"
                name="additionalComments"
                value={formData.additionalComments}
                onChange={handleInputChange}
                placeholder="Any special requirements or questions..."
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-6">Book Talent</h1>

          {/* Progress steps */}
          <div className="flex justify-between mb-8">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`flex-1 text-center ${
                  step !== 3 ? "border-b-2" : ""
                } ${
                  currentStep >= step
                    ? "border-orange-500 text-orange-500"
                    : "border-gray-200 text-gray-400"
                }`}
              >
                Step {step}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {renderStepContent()}

            <div className="flex justify-between mt-8">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep((prev) => prev - 1)}
                >
                  Previous
                </Button>
              )}

              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="ml-auto"
                >
                  Next
                </Button>
              ) : (
                <Button type="submit" className="ml-auto" disabled={loading}>
                  {loading ? "Submitting..." : "Submit Booking"}
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
