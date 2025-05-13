'use client';
import Image from 'next/image';

type FormValues = {
  profilePicture: File;
  firstName: string;
  lastName: string;
  email: string;
  generalCategory: string;
  specificCategory: string;
  serviceName: string;
  address: string;
  phoneNumber: string;
};

export default function ReviewStep({ formValues }: { formValues: FormValues }) {
  // Create a preview URL for the profile picture
  const previewUrl = formValues.profilePicture
    ? URL.createObjectURL(formValues.profilePicture)
    : null;

  return (
    <div className="space-y-6">
      <p className="text-gray-600 mb-4">
        Review your information before submitting your talent profile
      </p>

      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="font-semibold text-lg mb-4">Your Talent Profile</h3>

        {/* Profile Picture Preview */}
        {previewUrl && (
          <div className="flex justify-center mb-6">
            <div className="relative h-48 w-48 rounded-full overflow-hidden border-2 border-orange-500">
              <Image
                src={previewUrl}
                alt="Profile preview"
                fill
                className="object-cover"
              />
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">First Name</p>
              <p className="font-medium">{formValues.firstName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Last Name</p>
              <p className="font-medium">{formValues.lastName}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium">{formValues.email}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">General Category</p>
              <p className="font-medium">{formValues.generalCategory}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Specific Category</p>
              <p className="font-medium">{formValues.specificCategory}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500">Service Name</p>
            <p className="font-medium">{formValues.serviceName}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Address</p>
            <p className="font-medium">{formValues.address}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Phone Number</p>
            <p className="font-medium">{formValues.phoneNumber}</p>
          </div>
        </div>
      </div>

      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm">
          By submitting, you confirm that all information provided is accurate.
          After submission, you&apos;ll need to verify your email before your
          profile is reviewed by our team.
        </p>
      </div>
    </div>
  );
}
