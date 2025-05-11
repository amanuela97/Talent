'use client';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import Image from 'next/image';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';

export default function PersonalInfoStep() {
  const { control, setValue } = useFormContext();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setValue('profilePicture', file);
      const fileUrl = URL.createObjectURL(file);
      setPreviewUrl(fileUrl);
    }
  };

  return (
    <div className="space-y-6">
      <FormField
        control={control}
        name="profilePicture"
        render={({}) => (
          <FormItem className="space-y-4">
            <FormLabel>Profile Picture</FormLabel>
            <FormDescription>
              Please upload a clear, professional photo of yourself
            </FormDescription>

            <div className="flex flex-col items-center gap-4">
              {previewUrl && (
                <div className="relative h-40 w-40 rounded-full overflow-hidden border-2 border-orange-500">
                  <Image
                    src={previewUrl}
                    alt="Profile preview"
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              <FormControl>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-500 transition cursor-pointer">
                  <Input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="profile-picture-upload"
                    onChange={handleFileChange}
                    value="" // Add empty string value to keep it controlled
                  />
                  <label
                    htmlFor="profile-picture-upload"
                    className="cursor-pointer text-gray-500 hover:text-orange-500 flex flex-col items-center"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-10 w-10 mb-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    {previewUrl ? 'Change Photo' : 'Upload Photo'}
                  </label>
                </div>
              </FormControl>
            </div>

            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="firstName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>First Name</FormLabel>
            <FormControl>
              <Input placeholder="Your first name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="lastName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Last Name</FormLabel>
            <FormControl>
              <Input placeholder="Your last name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
