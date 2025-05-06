'use client';
import { useFormContext } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

export default function PhoneNumberStep() {
  const { control } = useFormContext();

  return (
    <div className="space-y-4">
      <p className="text-gray-600 mb-4">
        Enter your phone number. This will be used for contact purposes.
      </p>

      <FormField
        control={control}
        name="phoneNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Phone Number</FormLabel>
            <FormControl>
              <Input placeholder="Your phone number" type="tel" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <p className="text-sm text-gray-500 mt-2">
        Your phone number will be used for communication about bookings and
        platform updates.
      </p>
    </div>
  );
}
