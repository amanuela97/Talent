'use client';
import { useFormContext } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// General categories for talents
const GENERAL_CATEGORIES = [
  'Musician',
  'Dancer',
  'Magician',
  'Comedian',
  'Actor',
  'DJ',
  'Chef',
  'Photographer',
  'Videographer',
  'Other',
];

export default function GeneralCategoryStep() {
  const { control } = useFormContext();

  return (
    <div className="space-y-4">
      <p className="text-gray-600 mb-4">
        Choose the general category that best describes your talent
      </p>

      <FormField
        control={control}
        name="generalCategory"
        render={({ field }) => (
          <FormItem>
            <FormLabel>General Category</FormLabel>
            <FormControl>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {GENERAL_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
