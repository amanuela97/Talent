'use client';
import { useFormContext } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';

export default function AddressStep() {
  const { control } = useFormContext();

  return (
    <div className="space-y-4">
      <p className="text-gray-600 mb-4">
        Enter your address. This will be used internally for location-based
        searches and won&apos;t be publicly displayed.
      </p>

      <FormField
        control={control}
        name="address"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Address</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Your full address"
                {...field}
                className="min-h-[100px]"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <p className="text-sm text-gray-500 mt-2">
        Your privacy is important to us. Your full address will not be visible
        to customers. Only your general location (city/area) will be shown
        publicly.
      </p>
    </div>
  );
}
