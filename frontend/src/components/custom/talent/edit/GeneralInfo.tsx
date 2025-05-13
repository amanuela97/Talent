import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface GeneralInfoEditorProps {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
  city: string;
  bio: string;
  email: string;
  generalCategory: string;
  specificCategory: string;
  serviceName: string;
  onSubmit: (data: GeneralInfoFormData) => Promise<void>;
}

type GeneralInfoFormData = {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
  city: string;
  bio: string;
  email: string;
  generalCategory: string;
  specificCategory: string;
  serviceName: string;
};

export default function GeneralInfoEditor({
  firstName,
  lastName,
  phoneNumber,
  address,
  city,
  bio,
  email,
  generalCategory,
  specificCategory,
  serviceName,
  onSubmit,
}: GeneralInfoEditorProps) {
  const [formData, setFormData] = useState({
    firstName,
    lastName,
    phoneNumber,
    address,
    city,
    bio,
    email,
    generalCategory,
    specificCategory,
    serviceName,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 p-6">
      <div className="bg-white rounded-md shadow-sm">
        <div className="border-b p-6">
          <h1 className="text-2xl font-bold text-gray-800">
            General Information
          </h1>
          <p className="text-gray-600 mt-2">
            Update your basic profile information
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Your first name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Your last name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="Your phone number"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Your email address"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Your street address"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Your city"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="generalCategory">General Category</Label>
              <Input
                id="generalCategory"
                name="generalCategory"
                value={formData.generalCategory}
                onChange={handleChange}
                placeholder="e.g. Music, Food, Art"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specificCategory">Specific Category</Label>
              <Input
                id="specificCategory"
                name="specificCategory"
                value={formData.specificCategory}
                onChange={handleChange}
                placeholder="e.g. Chef, Pianist, Photographer"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceName">Service Name</Label>
              <Input
                id="serviceName"
                name="serviceName"
                value={formData.serviceName}
                onChange={handleChange}
                placeholder="e.g. Gourmet Cooking, Piano Lessons"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Biography</Label>
            <Textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell clients about yourself and your background"
              rows={5}
              required
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
