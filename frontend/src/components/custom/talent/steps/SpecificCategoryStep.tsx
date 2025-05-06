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
import { Input } from '@/components/ui/input';

// Specific categories based on general category
const SPECIFIC_CATEGORIES: Record<string, string[]> = {
  Musician: [
    'Folk Band',
    'Country Singer',
    'Rock Band',
    'Jazz Ensemble',
    'Classical Musician',
    'Pop Artist',
    'DJ',
    'Other',
  ],
  Dancer: [
    'Ballet Dancer',
    'Hip-Hop Dancer',
    'Contemporary Dancer',
    'Ballroom Dancer',
    'Latin Dancer',
    'Other',
  ],
  Magician: [
    'Close-up Magician',
    'Illusionist',
    'Mentalist',
    'Card Trick Specialist',
    'Other',
  ],
  Comedian: ['Stand-up Comedian', 'Improv Comedian', 'Comedy Group', 'Other'],
  Actor: [
    'Theater Actor',
    'Character Actor',
    'Voice Actor',
    'Impersonator',
    'Other',
  ],
  DJ: ['Wedding DJ', 'Club DJ', 'Event DJ', 'Radio DJ', 'Other'],
  Chef: [
    'Private Chef',
    'Caterer',
    'Food Demonstrator',
    'Pastry Chef',
    'Other',
  ],
  Photographer: [
    'Wedding Photographer',
    'Portrait Photographer',
    'Event Photographer',
    'Commercial Photographer',
    'Other',
  ],
  Videographer: [
    'Wedding Videographer',
    'Event Videographer',
    'Commercial Videographer',
    'Documentary Filmmaker',
    'Other',
  ],
  Other: ['Other'],
};

export default function SpecificCategoryStep({
  generalCategory,
}: {
  generalCategory: string;
}) {
  const { control } = useFormContext();

  // Get specific categories based on selected general category
  const specificCategories = generalCategory
    ? SPECIFIC_CATEGORIES[generalCategory] || []
    : [];

  return (
    <div className="space-y-4">
      <p className="text-gray-600 mb-4">
        Select a specific category within{' '}
        {generalCategory || 'your talent area'}
      </p>

      <FormField
        control={control}
        name="specificCategory"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Specific Category</FormLabel>
            <FormControl>
              {specificCategories.length > 0 ? (
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a specific category" />
                  </SelectTrigger>
                  <SelectContent>
                    {specificCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input placeholder="Enter your specific category" {...field} />
              )}
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
