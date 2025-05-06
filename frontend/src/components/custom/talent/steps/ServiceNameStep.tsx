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

export default function ServiceNameStep() {
  const { control } = useFormContext();

  return (
    <div className="space-y-4">
      <p className="text-gray-600 mb-4">
        Give your service a catchy name that will be shown on your public
        profile
      </p>

      <FormField
        control={control}
        name="serviceName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Service Name</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g., 'Melody Masters Band', 'Chef John's Gourmet Catering'"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <p className="text-sm text-gray-500 mt-2">
        This name will be prominently displayed on your profile and in search
        results.
      </p>
    </div>
  );
}
