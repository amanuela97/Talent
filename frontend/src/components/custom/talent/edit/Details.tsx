import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X, Check, ChevronsUpDown } from "lucide-react";
import languagesData from "../../../../../languages.json";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
  const [dayAvailable, setDayAvailable] = useState<Record<string, boolean>>({});
  const [languages, setLanguages] = useState(languagesSpoken || []);
  const [links, setLinks] = useState(socialLinks || {});
  const [newService, setNewService] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [newSocialPlatform, setNewSocialPlatform] = useState("");
  const [newSocialUrl, setNewSocialUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const daysOfWeek = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  // Initialize props and day availability state safely if they change
  useEffect(() => {
    if (services) setServiceList(services);
    if (hourlyRate !== undefined) setRate(hourlyRate);
    if (availability) {
      setAvailabilityData(availability);

      // Initialize day availability based on whether the day exists in the availability object
      const availableDays: Record<string, boolean> = {};
      daysOfWeek.forEach((day) => {
        availableDays[day] = !!availability[day];
      });
      setDayAvailable(availableDays);
    }
    if (languagesSpoken) setLanguages(languagesSpoken);
    if (socialLinks) setLinks(socialLinks);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [services, hourlyRate, availability, languagesSpoken, socialLinks]);

  // Handle services
  const addService = () => {
    if (newService.trim() !== "") {
      setServiceList([...serviceList, newService.trim()]);
      setNewService("");
    }
  };

  const removeService = (index: number) => {
    setServiceList(serviceList.filter((_, i) => i !== index));
  };

  // Handle languages
  const addLanguage = (language: string) => {
    if (language && !languages.includes(language)) {
      setLanguages([...languages, language]);
      setSelectedLanguage("");
    }
  };

  const removeLanguage = (index: number) => {
    setLanguages(languages.filter((_, i) => i !== index));
  };

  // Handle social links
  const addSocialLink = () => {
    if (newSocialPlatform.trim() !== "" && newSocialUrl.trim() !== "") {
      setLinks({
        ...links,
        [newSocialPlatform.trim()]: newSocialUrl.trim(),
      });
      setNewSocialPlatform("");
      setNewSocialUrl("");
    }
  };

  const removeSocialLink = (platform: string) => {
    const newLinks = { ...links };
    delete newLinks[platform];
    setLinks(newLinks);
  };

  // Handle availability checkbox change
  const handleAvailabilityCheckboxChange = (day: string, checked: boolean) => {
    setDayAvailable((prev) => ({ ...prev, [day]: checked }));

    // If the day is being marked as available but doesn't have times yet (or was previously removed),
    // initialize with empty times or restore from backup
    if (checked && !availabilityData[day]) {
      setAvailabilityData((prev) => ({
        ...prev,
        [day]: ["", ""],
      }));
    }
    // Note: We don't remove the day from availabilityData when unchecked
    // This preserves the time values when the checkbox is toggled
  };

  // Handle availability
  const handleAvailabilityChange = (
    day: string,
    timeType: "start" | "end",
    value: string
  ) => {
    setAvailabilityData((prev) => {
      const dayTimes = prev[day] || ["", ""];
      const newTimes = [...dayTimes];

      if (timeType === "start") {
        newTimes[0] = value;
      } else {
        newTimes[1] = value;
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
      // Filter out days that are unchecked before submitting
      const filteredAvailability: Record<string, string[]> = {};

      // Only include days where the checkbox is checked
      Object.keys(availabilityData).forEach((day) => {
        if (dayAvailable[day]) {
          filteredAvailability[day] = availabilityData[day];
        }
      });

      await onSubmit({
        services: serviceList,
        hourlyRate: rate,
        availability: filteredAvailability,
        languagesSpoken: languages,
        socialLinks: links,
      });
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setSubmitting(false);
    }
  };

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
                const dayAvailability = availabilityData[day] || ["", ""];
                return (
                  <div
                    key={day}
                    className="grid grid-cols-4 gap-3 items-center"
                  >
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`available-${day}`}
                        checked={dayAvailable[day] || false}
                        onCheckedChange={(checked) =>
                          handleAvailabilityCheckboxChange(
                            day,
                            checked === true
                          )
                        }
                      />
                      <label
                        htmlFor={`available-${day}`}
                        className="text-sm capitalize cursor-pointer"
                      >
                        {day}
                      </label>
                    </div>
                    <div className="col-span-3 flex items-center gap-2">
                      <Input
                        type="time"
                        value={dayAvailability[0] || ""}
                        onChange={(e) =>
                          handleAvailabilityChange(day, "start", e.target.value)
                        }
                        className="cursor-pointer"
                        disabled={!dayAvailable[day]}
                      />
                      <span>to</span>
                      <Input
                        type="time"
                        value={dayAvailability[1] || ""}
                        onChange={(e) =>
                          handleAvailabilityChange(day, "end", e.target.value)
                        }
                        className="cursor-pointer"
                        disabled={!dayAvailable[day]}
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
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {selectedLanguage
                        ? languagesData.languages.find(
                            (language) => language === selectedLanguage
                          )
                        : "Select a language..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search language..." />
                      <CommandEmpty>No language found.</CommandEmpty>
                      <CommandGroup className="max-h-[300px] overflow-auto">
                        {languagesData.languages.map((language) => (
                          <CommandItem
                            key={language}
                            value={language}
                            onSelect={() => {
                              if (!languages.includes(language)) {
                                addLanguage(language);
                              }
                            }}
                            disabled={languages.includes(language)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                languages.includes(language)
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {language}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
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
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
