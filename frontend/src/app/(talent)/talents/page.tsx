import Link from 'next/link';
import Image from 'next/image';
import { Search, MapPin, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Mock data based on the Talent model
const talents = [
  {
    talentId: '1',
    firstName: 'Emma',
    lastName: 'Johnson',
    talentProfilePicture: '/placeholder.svg?height=300&width=300',
    generalCategory: 'Music',
    specificCategory: 'Vocalist',
    serviceName: 'Professional Singer',
    city: 'New York',
    hourlyRate: 85,
    rating: 4.8,
    services: ['Wedding', 'Corporate Events', 'Studio Recording'],
  },
  {
    talentId: '2',
    firstName: 'Michael',
    lastName: 'Chen',
    talentProfilePicture: '/placeholder.svg?height=300&width=300',
    generalCategory: 'Performance',
    specificCategory: 'Dancer',
    serviceName: 'Contemporary Dance',
    city: 'Los Angeles',
    hourlyRate: 75,
    rating: 4.9,
    services: ['Music Videos', 'Live Shows', 'Private Events'],
  },
  {
    talentId: '3',
    firstName: 'Sophia',
    lastName: 'Garcia',
    talentProfilePicture: '/placeholder.svg?height=300&width=300',
    generalCategory: 'Entertainment',
    specificCategory: 'Comedian',
    serviceName: 'Stand-up Comedy',
    city: 'Chicago',
    hourlyRate: 95,
    rating: 4.7,
    services: ['Corporate Events', 'Private Parties', 'Comedy Clubs'],
  },
  {
    talentId: '4',
    firstName: 'James',
    lastName: 'Wilson',
    talentProfilePicture: '/placeholder.svg?height=300&width=300',
    generalCategory: 'Music',
    specificCategory: 'DJ',
    serviceName: 'Professional DJ',
    city: 'Miami',
    hourlyRate: 110,
    rating: 4.9,
    services: ['Weddings', 'Nightclubs', 'Corporate Events'],
  },
  {
    talentId: '5',
    firstName: 'Olivia',
    lastName: 'Taylor',
    talentProfilePicture: '/placeholder.svg?height=300&width=300',
    generalCategory: 'Visual Arts',
    specificCategory: 'Photographer',
    serviceName: 'Event Photography',
    city: 'Seattle',
    hourlyRate: 90,
    rating: 4.6,
    services: ['Weddings', 'Portraits', 'Corporate Events'],
  },
  {
    talentId: '6',
    firstName: 'David',
    lastName: 'Brown',
    talentProfilePicture: '/placeholder.svg?height=300&width=300',
    generalCategory: 'Performance',
    specificCategory: 'Magician',
    serviceName: 'Close-up Magic',
    city: 'Las Vegas',
    hourlyRate: 120,
    rating: 4.8,
    services: ['Private Parties', 'Corporate Events', 'Stage Shows'],
  },
];

// Categories for filtering
const categories = [
  'Music',
  'Performance',
  'Entertainment',
  'Visual Arts',
  'Education',
];

export default function TalentsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero section with search */}
      <section className="bg-gradient-to-r from-orange-600 to-orange-500 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-6 text-center">
            Discover Amazing Talent
          </h1>
          <p className="text-xl mb-8 text-center max-w-2xl mx-auto">
            Find the perfect performer for your next event, production, or
            project
          </p>

          <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-2 flex">
            <Input
              placeholder="Search by talent name, category, or service..."
              className="flex-grow border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-gray-800"
            />
            <Button className="ml-2 bg-orange-500 hover:bg-orange-600">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </div>
      </section>

      {/* Main content */}
      <div className="container mx-auto px-4 py-12">
        {/* Filters */}
        <div className="mb-8 flex flex-wrap gap-2">
          <h2 className="text-lg font-semibold mr-4 flex items-center">
            Categories:
          </h2>
          {categories.map((category) => (
            <Badge
              key={category}
              variant="outline"
              className="px-4 py-2 text-sm cursor-pointer hover:bg-orange-100 border-orange-200"
            >
              {category}
            </Badge>
          ))}
        </div>

        {/* Talent grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {talents.map((talent) => (
            <Link
              href={`/talents/${talent.serviceName
                .toLowerCase()
                .replace(/\s+/g, '-')}`}
              key={talent.talentId}
              className="group"
            >
              <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
                <div className="relative h-64 overflow-hidden">
                  <Image
                    fill
                    priority
                    sizes="58px"
                    src={talent.talentProfilePicture || '/placeholder.svg'}
                    alt={`${talent.firstName} ${talent.lastName}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 right-4 bg-white rounded-full px-3 py-1 text-sm font-medium text-gray-900 shadow">
                    ${talent.hourlyRate}/hr
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-gray-900">
                      {talent.firstName} {talent.lastName}
                    </h3>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-orange-500 fill-orange-500" />
                      <span className="ml-1 text-sm font-medium">
                        {talent.rating}
                      </span>
                    </div>
                  </div>

                  <p className="text-orange-600 font-medium mb-2">
                    {talent.serviceName}
                  </p>

                  <div className="flex items-center text-gray-500 mb-3">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="text-sm">{talent.city}</span>
                  </div>

                  <div className="flex flex-wrap gap-1 mt-3">
                    {talent.services.slice(0, 2).map((service, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-orange-50 text-orange-600 border-orange-100"
                      >
                        {service}
                      </Badge>
                    ))}
                    {talent.services.length > 2 && (
                      <Badge
                        variant="secondary"
                        className="bg-orange-50 text-orange-600 border-orange-100"
                      >
                        +{talent.services.length - 2} more
                      </Badge>
                    )}
                  </div>

                  <Button className="w-full mt-4 bg-orange-500 hover:bg-orange-600">
                    View Profile
                  </Button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
