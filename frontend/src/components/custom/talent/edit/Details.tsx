import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Plus, X } from 'lucide-react';

interface DetailsEditorProps {
  services: string[];
  hourlyRate: number;
  availability: Record<string, string[]>;
  languagesSpoken: string[];
  socialLinks: Record<string, string>;
  onSubmit: (data: {
    services: string[];
    hourlyRate: number;
    availability: Record<string, string[]>;
    languagesSpoken: string[];
    socialLinks: Record<string, string>;
  }) => Promise<void>;
}

export default function DetailsEditor({
  services,
  hourlyRate,
  availability,
  languagesSpoken,
  socialLinks,
  onSubmit,
}: DetailsEditorProps) {
  const [serviceList, setServiceList] = useState(services || []);
  const [rate, setRate] = useState(hourlyRate || 0);
  const [availabilityData, setAvailabilityData] = useState<
    Record<string, string[]>
  >(availability || {});
  const [languages, setLanguages] = useState(languagesSpoken || []);
  const [links, setLinks] = useState(socialLinks || {});
  const [newService, setNewService] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [newSocialPlatform, setNewSocialPlatform] = useState('');
  const [newSocialUrl, setNewSocialUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Initialize props safely if they change
  useEffect(() => {
    if (services) setServiceList(services);
    if (hourlyRate !== undefined) setRate(hourlyRate);
    if (availability) setAvailabilityData(availability);
    if (languagesSpoken) setLanguages(languagesSpoken);
    if (socialLinks) setLinks(socialLinks);
  }, [services, hourlyRate, availability, languagesSpoken, socialLinks]);

  // Handle services
  const addService = () => {
    if (newService.trim() !== '') {
      setServiceList([...serviceList, newService.trim()]);
      setNewService('');
    }
  };

  const removeService = (index: number) => {
    setServiceList(serviceList.filter((_, i) => i !== index));
  };

  // Handle languages
  const addLanguage = () => {
    if (newLanguage.trim() !== '' && !languages.includes(newLanguage.trim())) {
      setLanguages([...languages, newLanguage.trim()]);
      setNewLanguage('');
    }
  };

  const removeLanguage = (index: number) => {
    setLanguages(languages.filter((_, i) => i !== index));
  };

  // Handle social links
  const addSocialLink = () => {
    if (newSocialPlatform.trim() !== '' && newSocialUrl.trim() !== '') {
      setLinks({
        ...links,
        [newSocialPlatform.trim()]: newSocialUrl.trim(),
      });
      setNewSocialPlatform('');
      setNewSocialUrl('');
    }
  };

  const removeSocialLink = (platform: string) => {
    const newLinks = { ...links };
    delete newLinks[platform];
    setLinks(newLinks);
  };

  // Handle availability
  const handleAvailabilityChange = (
    day: string,
    timeType: 'start' | 'end',
    value: string
  ) => {
    setAvailabilityData((prev) => {
      const dayTimes = prev[day] || ['', ''];
      const newTimes = [...dayTimes];

      if (timeType === 'start') {
        newTimes[0] = value;
      } else {
        newTimes[1] = value;
      }

      // If both values are empty, remove the day from availability
      if (newTimes[0] === '' && newTimes[1] === '') {
        const newAvailability = { ...prev };
        delete newAvailability[day];
        return newAvailability;
      }

      return {
        ...prev,
        [day]: newTimes,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await onSubmit({
        services: serviceList,
        hourlyRate: rate,
        availability: availabilityData,
        languagesSpoken: languages,
        socialLinks: links,
      });
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const daysOfWeek = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ];

  return (
    <div className="flex-1 p-6">
      <div className="bg-white rounded-md shadow-sm">
        <div className="border-b p-6">
          <h1 className="text-2xl font-bold text-gray-800">Profile Details</h1>
          <p className="text-gray-600 mt-2">
            Update additional details about your services
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Services Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Services Offered</h2>
            <p className="text-gray-600">
              List the specific services you provide
            </p>

            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a service..."
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                />
                <Button type="button" onClick={addService} className="shrink-0">
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                {serviceList.map((service, index) => (
                  <div
                    key={index}
                    className="bg-blue-50 text-blue-700 py-1 px-3 rounded-md flex items-center"
                  >
                    {service}
                    <button
                      type="button"
                      onClick={() => removeService(index)}
                      className="ml-2 text-blue-700 hover:text-blue-900"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Hourly Rate Section */}
          <div className="space-y-4 pt-6 border-t">
            <h2 className="text-xl font-semibold">Hourly Rate</h2>
            <p className="text-gray-600">
              Set your hourly rate for your services
            </p>

            <div className="flex items-center w-full max-w-xs">
              <span className="text-gray-500 mr-2">$</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
              <span className="text-gray-500 ml-2">/ hour</span>
            </div>
          </div>

          {/* Availability Section */}
          <div className="space-y-4 pt-6 border-t">
            <h2 className="text-xl font-semibold">Availability</h2>
            <p className="text-gray-600">
              Set your available hours for each day of the week
            </p>

            <div className="space-y-3">
              {daysOfWeek.map((day) => {
                // Safely access availability data with a default empty array
                const dayAvailability = availabilityData[day] || ['', ''];
                return (
                  <div
                    key={day}
                    className="grid grid-cols-3 gap-3 items-center"
                  >
                    <div className="capitalize">{day}</div>
                    <div className="col-span-2 flex items-center gap-2">
                      <Input
                        type="time"
                        value={dayAvailability[0] || ''}
                        onChange={(e) =>
                          handleAvailabilityChange(day, 'start', e.target.value)
                        }
                        className="cursor-pointer"
                      />
                      <span>to</span>
                      <Input
                        type="time"
                        value={dayAvailability[1] || ''}
                        onChange={(e) =>
                          handleAvailabilityChange(day, 'end', e.target.value)
                        }
                        className="cursor-pointer"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Languages Section */}
          <div className="space-y-4 pt-6 border-t">
            <h2 className="text-xl font-semibold">Languages Spoken</h2>
            <p className="text-gray-600">Add the languages you speak</p>

            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a language..."
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                />
                <Button
                  type="button"
                  onClick={addLanguage}
                  className="shrink-0"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                {languages.map((language, index) => (
                  <div
                    key={index}
                    className="bg-green-50 text-green-700 py-1 px-3 rounded-md flex items-center"
                  >
                    {language}
                    <button
                      type="button"
                      onClick={() => removeLanguage(index)}
                      className="ml-2 text-green-700 hover:text-green-900"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Social Links Section */}
          <div className="space-y-4 pt-6 border-t">
            <h2 className="text-xl font-semibold">Social Media Links</h2>
            <p className="text-gray-600">
              Add links to your social media profiles
            </p>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  placeholder="Platform (e.g. Instagram)"
                  value={newSocialPlatform}
                  onChange={(e) => setNewSocialPlatform(e.target.value)}
                />
                <Input
                  placeholder="URL"
                  value={newSocialUrl}
                  onChange={(e) => setNewSocialUrl(e.target.value)}
                  className="col-span-1 md:col-span-2"
                />
              </div>
              <Button type="button" onClick={addSocialLink} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Social Link
              </Button>

              <div className="space-y-2 mt-4">
                {Object.entries(links || {}).map(([platform, url]) => (
                  <div
                    key={platform}
                    className="flex justify-between items-center bg-gray-50 p-3 rounded-md"
                  >
                    <div>
                      <div className="font-medium">{platform}</div>
                      <div className="text-sm text-blue-600 truncate">
                        {url}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSocialLink(platform)}
                      className="text-gray-500 hover:text-red-500"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-6">
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
