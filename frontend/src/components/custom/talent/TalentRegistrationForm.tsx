'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { v4 as uuidv4 } from 'uuid';
import axiosInstance from '@/app/utils/axios';
import { useSession } from 'next-auth/react';

// Form steps
import PersonalInfoStep from './steps/PersonalInfoStep';
import GeneralCategoryStep from './steps/GeneralCategoryStep';
import SpecificCategoryStep from './steps/SpecificCategoryStep';
import ServiceNameStep from './steps/ServiceNameStep';
import AddressStep from './steps/AddressStep';
import PhoneNumberStep from './steps/PhoneNumberStep';
import ReviewStep from './steps/ReviewStep';

// Form schema
const formSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  generalCategory: z.string().min(1, 'General category is required'),
  specificCategory: z.string().min(1, 'Specific category is required'),
  serviceName: z.string().min(3, 'Service name is required'),
  address: z.string().min(5, 'Address is required'),
  phoneNumber: z.string().min(10, 'Valid phone number is required'),
});

type FormValues = z.infer<typeof formSchema>;

export default function TalentRegistrationForm({ userId }: { userId: string }) {
  const { data: session } = useSession();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const methods = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      generalCategory: '',
      specificCategory: '',
      serviceName: '',
      address: '',
      phoneNumber: '',
    },
    mode: 'onChange',
  });

  const { handleSubmit, trigger, watch } = methods;

  // Fields to validate at each step
  const stepValidationFields = [
    ['firstName', 'lastName'],
    ['generalCategory'],
    ['specificCategory'],
    ['serviceName'],
    ['address'],
    ['phoneNumber'],
    [], // No validation for review step
  ];

  // Go to next step after validation
  const goToNextStep = async () => {
    const fieldsToValidate = stepValidationFields[currentStep];
    const isValid = await trigger(fieldsToValidate as (keyof FormValues)[]);

    if (isValid) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo(0, 0);
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
      formData.append('firsName', data.firstName);
      formData.append('lastName', data.lastName);
      formData.append('generalCategory', data.generalCategory);
      formData.append('specificCategory', data.specificCategory);
      formData.append('ServiceName', data.serviceName);
      formData.append('address', data.address);
      formData.append('phoneNumber', data.phoneNumber);
      formData.append('verificationToken', verificationToken);

      // Status field (optional, but we want to be explicit)
      formData.append('status', 'PENDING');
      formData.append('isEmailVerified', 'false');

      // Send the request to create talent profile
      await axiosInstance.post(`/talents/profile/${userId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Send verification email - use session email instead of localStorage
      await axiosInstance.post('/auth/send-verification-email', {
        email: session?.user?.email,
        verificationToken,
        name: `${data.firstName} ${data.lastName}`,
      });

      // Redirect to verification page
      router.push('/join/verify');
    } catch (error) {
      console.error('Error creating talent profile:', error);
      alert('Failed to create talent profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Form steps
  const steps = [
    <PersonalInfoStep key="personal" />,
    <GeneralCategoryStep key="general" />,
    <SpecificCategoryStep
      key="specific"
      generalCategory={watch('generalCategory')}
    />,
    <ServiceNameStep key="service" />,
    <AddressStep key="address" />,
    <PhoneNumberStep key="phone" />,
    <ReviewStep key="review" formValues={watch()} />,
  ];

  // Step titles
  const stepTitles = [
    'Personal Information',
    'General Category',
    'Specific Category',
    'Service Name',
    'Address',
    'Phone Number',
    'Review & Submit',
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
        <form onSubmit={handleSubmit(onSubmit)}>
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
                type="submit"
                className="ml-auto bg-orange-500 hover:bg-orange-600"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Button>
            )}
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
