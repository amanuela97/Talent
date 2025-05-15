"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { v4 as uuidv4 } from "uuid";
import axiosInstance from "@/app/utils/axios";
import { useSession } from "next-auth/react";

// Form steps
import PersonalInfoStep from "./steps/PersonalInfoStep";
import GeneralCategoryStep from "./steps/GeneralCategoryStep";
import SpecificCategoryStep from "./steps/SpecificCategoryStep";
import ServiceNameStep from "./steps/ServiceNameStep";
import AddressStep from "./steps/AddressStep";
import PhoneNumberStep from "./steps/PhoneNumberStep";
import ReviewStep from "./steps/ReviewStep";
import { isAxiosError } from "axios";

// Form schema
const formSchema = z.object({
  profilePicture: z.instanceof(File, {
    message: "Profile picture is required",
  }),
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Valid email is required"),
  categories: z.array(z.any()).min(1, "At least one category is required"),
  serviceName: z.string().min(3, "Service name is required"),
  address: z.string().min(5, "Address is required"),
  phoneNumber: z.string().min(10, "Valid phone number is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface TalentRegistrationFormProps {
  userId: string;
  isRejected: boolean;
  existingTalentId: string | null;
}

export default function TalentRegistrationForm({
  userId,
  isRejected,
  existingTalentId,
}: TalentRegistrationFormProps) {
  const { data: session } = useSession();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const methods = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: session?.user?.email || "",
      categories: [],
      serviceName: "",
      address: "",
      phoneNumber: "",
    },
    mode: "onChange",
  });

  const { handleSubmit, trigger, watch } = methods;

  // Fields to validate at each step
  const stepValidationFields = [
    ["profilePicture", "firstName", "lastName", "email"],
    ["categories"],
    ["categories"],
    ["serviceName"],
    ["address"],
    ["phoneNumber"],
    [], // No validation for review step
  ];

  // Go to next step after validation
  const goToNextStep = async () => {
    const fieldsToValidate = stepValidationFields[currentStep];
    console.log("Validating fields:", fieldsToValidate);

    // For the categories step, let's do a manual check first
    if (currentStep === 1) {
      // General Category step
      const categories = watch("categories");
      console.log("Current categories:", categories);

      if (!categories || !categories.length || !categories[0]) {
        console.log("No general category selected");
        methods.setError("categories", {
          type: "manual",
          message: "Please select a general category",
        });
        return;
      }
    }

    const isValid = await trigger(fieldsToValidate as (keyof FormValues)[]);
    console.log("Validation result:", isValid);

    if (isValid) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo(0, 0);
    } else {
      console.log("Validation errors:", methods.formState.errors);
    }
  };

  // Go to previous step
  const goToPreviousStep = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
    window.scrollTo(0, 0);
  };

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);

    try {
      const verificationToken = uuidv4();

      // Create form data for multipart/form-data
      const formData = new FormData();
      formData.append("firstName", data.firstName);
      formData.append("lastName", data.lastName);
      formData.append("email", data.email);

      // Extract categories for submission
      if (data.categories && data.categories.length > 0) {
        // Convert categories array to JSON string for backend processing
        formData.append(
          "categories",
          JSON.stringify(data.categories.map((cat) => cat.id))
        );
      }

      formData.append("serviceName", data.serviceName);
      formData.append("address", data.address);
      formData.append("phoneNumber", data.phoneNumber);
      formData.append("verificationToken", verificationToken);
      formData.append("isEmailVerified", "true");

      // Add profile picture to form data
      if (data.profilePicture) {
        formData.append("profilePicture", data.profilePicture);
      }

      // Status field (optional, but we want to be explicit)
      formData.append("status", "PENDING");

      if (isRejected && existingTalentId) {
        // Update existing talent profile for rejected talents
        await axiosInstance.patch(`/talents/${existingTalentId}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        // Create new talent profile
        await axiosInstance.post(`/talents/profile/${userId}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      if (isRejected && existingTalentId) {
        // Send verification email - use session email instead of localStorage
        await axiosInstance.post("/auth/send-verification-email", {
          email: session?.user?.email,
          verificationToken,
          name: `${data.firstName} ${data.lastName}`,
        });
      }

      // Redirect to verification page
      router.push("/join/verify");
    } catch (error) {
      const errorMessage = isAxiosError(error)
        ? error.response?.data?.message
        : "Error creating/updating talent profile";
      console.error(errorMessage, error);
      alert(
        errorMessage || "Failed to process talent profile. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Form steps
  const steps = [
    <PersonalInfoStep key="personal" />,
    <GeneralCategoryStep key="general" />,
    <SpecificCategoryStep key="specific" />,
    <ServiceNameStep key="service" />,
    <AddressStep key="address" />,
    <PhoneNumberStep key="phone" />,
    <ReviewStep key="review" formValues={watch()} />,
  ];

  // Step titles
  const stepTitles = [
    "Personal Information",
    "General Category",
    "Specific Category",
    "Service Name",
    "Address",
    "Phone Number",
    "Review & Submit",
  ];

  return (
    <div className="max-w-2xl mx-auto min-h-screen">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">
          {stepTitles[currentStep]}
        </h2>
        <div className="w-full bg-gray-200 h-2 rounded-full">
          <div
            className="bg-orange-500 h-2 rounded-full"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          ></div>
        </div>
      </div>

      <FormProvider {...methods}>
        <form
          // Remove the onSubmit handler from the form element
          // We'll manually trigger submission when the submit button is clicked
          onSubmit={(e) => {
            // Only allow submission on the last step
            if (currentStep !== steps.length - 1) {
              e.preventDefault();
            }
          }}
          onKeyDown={(e) => {
            // Prevent form submission on Enter key press
            if (e.key === "Enter") {
              e.preventDefault();
              // Optionally, if on a non-final step, go to next step when Enter is pressed
              if (currentStep !== steps.length - 1) {
                goToNextStep();
              }
            }
          }}
        >
          {steps[currentStep]}

          <div className="flex justify-between mt-8">
            {currentStep > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={goToPreviousStep}
                disabled={isSubmitting}
              >
                Previous
              </Button>
            )}

            {currentStep < steps.length - 1 ? (
              <Button type="button" onClick={goToNextStep} className="ml-auto">
                Next
              </Button>
            ) : (
              <Button
                type="button"
                className="ml-auto bg-orange-500 hover:bg-orange-600"
                disabled={isSubmitting}
                onClick={() => {
                  // Manually trigger form submission only when on the last step
                  // This ensures the form is only submitted when the user explicitly clicks the Submit button
                  if (currentStep === steps.length - 1) {
                    handleSubmit(onSubmit)();
                  }
                }}
              >
                {isSubmitting
                  ? "Submitting..."
                  : isRejected
                  ? "Resubmit"
                  : "Submit"}
              </Button>
            )}
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
