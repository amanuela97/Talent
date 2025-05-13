import Image from 'next/image';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  Phone,
  Mail,
  Clock,
  Star,
  DollarSign,
  Instagram,
  Twitter,
  Facebook,
  MessageCircle,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  Play,
  Music,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Mock data for a single talent based on the Talent model
const talent = {
  talentId: '1',
  firstName: 'Emma',
  lastName: 'Johnson',
  talentProfilePicture: '/placeholder.svg?height=500&width=500',
  generalCategory: 'Music',
  specificCategory: 'Vocalist',
  serviceName: 'Professional Singer',
  address: '123 Music Avenue',
  city: 'New York',
  phoneNumber: '+1 (555) 123-4567',
  email: 'emma.johnson@example.com',
  bio: 'Award-winning vocalist with over 10 years of experience performing at weddings, corporate events, and music venues across the country. Specializing in jazz, pop, and R&B, I bring a versatile repertoire to suit any occasion. My passion is creating memorable musical experiences that elevate your event.',
  hourlyRate: 85,
  rating: 4.8,
  services: [
    'Wedding Ceremonies',
    'Corporate Events',
    'Private Parties',
    'Studio Recording',
    'Background Music',
    'Live Performances',
  ],
  availability: {
    monday: ['9:00 AM - 5:00 PM'],
    tuesday: ['9:00 AM - 5:00 PM'],
    wednesday: ['9:00 AM - 5:00 PM'],
    thursday: ['9:00 AM - 5:00 PM'],
    friday: ['9:00 AM - 5:00 PM'],
    saturday: ['10:00 AM - 10:00 PM'],
    sunday: ['12:00 PM - 8:00 PM'],
  },
  languagesSpoken: ['English', 'Spanish'],
  socialLinks: {
    instagram: 'https://instagram.com/emmajohnson',
    twitter: 'https://twitter.com/emmajohnson',
    facebook: 'https://facebook.com/emmajohnson',
  },
  media: [
    {
      id: '1',
      type: 'IMAGE',
      url: '/placeholder.svg?height=600&width=800',
      description: 'Live performance at Madison Square Garden',
    },
    {
      id: '2',
      type: 'IMAGE',
      url: '/placeholder.svg?height=600&width=800',
      description: 'Studio recording session',
    },
    {
      id: '3',
      type: 'VIDEO',
      url: '/placeholder.svg?height=600&width=800',
      description: 'Wedding performance highlight reel',
    },
    {
      id: '4',
      type: 'AUDIO',
      url: '/placeholder.svg?height=600&width=800',
      description: 'Original song sample',
    },
    {
      id: '5',
      type: 'AUDIO',
      url: '/placeholder.svg?height=600&width=800',
      description: "Cover of 'At Last' by Etta James",
    },
    {
      id: '6',
      type: 'IMAGE',
      url: '/placeholder.svg?height=600&width=800',
      description: 'Performance at charity gala',
    },
    {
      id: '7',
      type: 'VIDEO',
      url: '/placeholder.svg?height=600&width=800',
      description: 'Corporate event performance',
    },
  ],
  reviews: [
    {
      reviewId: '1',
      userRevieweId: '101',
      rating: 5,
      comment:
        'Emma was absolutely amazing at our wedding! Her voice is incredible and she was so professional. All our guests were impressed.',
      createdAt: '2023-06-15T14:30:00Z',
      user: {
        name: 'Jennifer Smith',
        profilePicture: '/placeholder.svg?height=100&width=100',
      },
    },
    {
      reviewId: '2',
      userRevieweId: '102',
      rating: 4.5,
      comment:
        'Great performance at our corporate event. Very professional and talented. Would definitely book again.',
      createdAt: '2023-05-22T10:15:00Z',
      user: {
        name: 'Michael Brown',
        profilePicture: '/placeholder.svg?height=100&width=100',
      },
    },
  ],
};

// Helper function to format date
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function TalentProfilePage({}: {
  params: { serviceName: string };
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with cover image */}
      <div className="h-64 bg-gradient-to-r from-orange-500 to-orange-600 relative">
        <div className="container mx-auto px-4 h-full flex items-end">
          <div className="absolute -bottom-16 flex items-end">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
              <Image
                src={talent.talentProfilePicture || '/placeholder.svg'}
                alt={`${talent.firstName} ${talent.lastName}`}
                fill
                sizes="100px"
                className="object-cover"
              />
            </div>
            <div className="ml-4 mb-4">
              <div className="bg-white px-4 py-2 rounded-lg shadow-md">
                <h1 className="text-3xl font-bold text-gray-900">
                  {talent.firstName} {talent.lastName}
                </h1>
                <p className="text-orange-600">{talent.serviceName}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left column - Profile info */}
          <div className="lg:w-2/3">
            <Tabs defaultValue="media" className="mb-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="media">Media</TabsTrigger>
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="availability">Availability</TabsTrigger>
                <TabsTrigger value="about">About</TabsTrigger>
              </TabsList>

              <TabsContent
                value="media"
                className="bg-white rounded-lg shadow-md p-6"
              >
                <h3 className="text-xl font-bold mb-4">Media</h3>

                {/* Images Slider */}
                <div className="mb-8">
                  <h4 className="font-semibold mb-3">Images</h4>
                  <div className="relative">
                    <div className="overflow-x-auto pb-4">
                      <div className="flex gap-4">
                        {talent.media
                          .filter((item) => item.type === 'IMAGE')
                          .map((item) => (
                            <div
                              key={item.id}
                              className="min-w-[300px] h-64 rounded-lg overflow-hidden flex-shrink-0"
                            >
                              <Image
                                src={item.url || '/placeholder.svg'}
                                alt={item.description || ''}
                                width={300}
                                height={200}
                                className="w-full h-full object-cover"
                              />
                              <div className="p-2 bg-gray-100">
                                <p className="text-sm truncate">
                                  {item.description}
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                    <div className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-md cursor-pointer">
                      <ChevronLeft className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-md cursor-pointer">
                      <ChevronRight className="h-5 w-5 text-orange-600" />
                    </div>
                  </div>
                </div>

                {/* Videos Slider */}
                <div className="mb-8">
                  <h4 className="font-semibold mb-3">Videos</h4>
                  <div className="relative">
                    <div className="overflow-x-auto pb-4">
                      <div className="flex gap-4">
                        {talent.media
                          .filter((item) => item.type === 'VIDEO')
                          .map((item) => (
                            <div
                              key={item.id}
                              className="min-w-[300px] h-64 rounded-lg overflow-hidden flex-shrink-0 relative"
                            >
                              <Image
                                src={item.url || '/placeholder.svg'}
                                alt={item.description || ''}
                                width={300}
                                height={200}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="bg-white bg-opacity-80 rounded-full p-3">
                                  <Play className="h-8 w-8 text-orange-600" />
                                </div>
                              </div>
                              <div className="p-2 bg-gray-100">
                                <p className="text-sm truncate">
                                  {item.description}
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                    <div className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-md cursor-pointer">
                      <ChevronLeft className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-md cursor-pointer">
                      <ChevronRight className="h-5 w-5 text-orange-600" />
                    </div>
                  </div>
                </div>

                {/* Audio Playlist */}
                <div>
                  <h4 className="font-semibold mb-3">Audio Samples</h4>
                  <div className="border rounded-lg overflow-hidden">
                    {talent.media
                      .filter((item) => item.type === 'AUDIO')
                      .map((item, index) => (
                        <div
                          key={item.id}
                          className={`flex items-center p-3 ${
                            index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                          } hover:bg-orange-50`}
                        >
                          <div className="mr-3 bg-orange-100 rounded-full p-2">
                            <Music className="h-5 w-5 text-orange-600" />
                          </div>
                          <div className="flex-grow">
                            <p className="font-medium">{item.description}</p>
                            <div className="mt-2">
                              <audio
                                controls
                                className="w-full h-8"
                                src={item.url}
                              >
                                Your browser does not support the audio element.
                              </audio>
                            </div>
                          </div>
                          <div className="ml-2 text-gray-500 text-sm">3:45</div>
                        </div>
                      ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent
                value="services"
                className="bg-white rounded-lg shadow-md p-6"
              >
                <h3 className="text-xl font-bold mb-4">Services Offered</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {talent.services.map((service, index) => (
                    <div
                      key={index}
                      className="flex items-center p-3 bg-orange-50 rounded-lg"
                    >
                      <div className="h-2 w-2 rounded-full bg-orange-500 mr-3"></div>
                      <span>{service}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <h4 className="font-semibold mb-2">Languages</h4>
                  <div className="flex gap-2">
                    {talent.languagesSpoken.map((language, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="border-orange-200"
                      >
                        {language}
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent
                value="availability"
                className="bg-white rounded-lg shadow-md p-6"
              >
                <h3 className="text-xl font-bold mb-4">Weekly Availability</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(talent.availability).map(([day, times]) => (
                    <div
                      key={day}
                      className="flex items-start p-3 bg-gray-50 rounded-lg"
                    >
                      <Clock className="h-5 w-5 mr-3 text-orange-500 mt-0.5" />
                      <div>
                        <div className="font-medium capitalize">{day}</div>
                        <div className="text-sm text-gray-600">
                          {times.join(', ')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex justify-center">
                  <Button className="bg-orange-500 hover:bg-orange-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    Check Calendar
                  </Button>
                </div>
              </TabsContent>

              <TabsContent
                value="about"
                className="bg-white rounded-lg shadow-md p-6"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      About Me
                    </h2>
                    <div className="flex items-center mb-4">
                      <Badge className="bg-orange-100 text-orange-600 border-orange-200 mr-2">
                        {talent.generalCategory}
                      </Badge>
                      <Badge className="bg-orange-100 text-orange-600 border-orange-200">
                        {talent.specificCategory}
                      </Badge>
                      <div className="ml-4 flex items-center">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="ml-1 font-medium">
                          {talent.rating}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full"
                    >
                      <Heart className="h-4 w-4 text-orange-500" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full"
                    >
                      <Share2 className="h-4 w-4 text-orange-500" />
                    </Button>
                  </div>
                </div>

                <p className="text-gray-700 mb-6">{talent.bio}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-5 w-5 mr-2 text-orange-500" />
                    <span>{talent.city}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <DollarSign className="h-5 w-5 mr-2 text-orange-500" />
                    <span>${talent.hourlyRate}/hour</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Mail className="h-5 w-5 mr-2 text-orange-500" />
                    <span>{talent.email}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Phone className="h-5 w-5 mr-2 text-orange-500" />
                    <span>{talent.phoneNumber}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  {talent.socialLinks.instagram && (
                    <Link
                      href={talent.socialLinks.instagram}
                      className="text-orange-500 hover:text-orange-700"
                    >
                      <Instagram className="h-5 w-5" />
                    </Link>
                  )}
                  {talent.socialLinks.twitter && (
                    <Link
                      href={talent.socialLinks.twitter}
                      className="text-orange-500 hover:text-orange-700"
                    >
                      <Twitter className="h-5 w-5" />
                    </Link>
                  )}
                  {talent.socialLinks.facebook && (
                    <Link
                      href={talent.socialLinks.facebook}
                      className="text-orange-500 hover:text-orange-700"
                    >
                      <Facebook className="h-5 w-5" />
                    </Link>
                  )}
                </div>

                {/* Reviews section moved to About tab */}
                <div className="mt-8">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">Reviews</h3>
                    <div className="flex items-center">
                      <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                      <span className="ml-1 font-medium text-lg">
                        {talent.rating}
                      </span>
                      <span className="ml-2 text-gray-500">
                        ({talent.reviews.length} reviews)
                      </span>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {talent.reviews.map((review) => (
                      <Card
                        key={review.reviewId}
                        className="border-none shadow-sm"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <Avatar>
                              <AvatarImage
                                src={
                                  review.user.profilePicture ||
                                  '/placeholder.svg'
                                }
                                alt={review.user.name}
                              />
                              <AvatarFallback>
                                {review.user.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium">
                                    {review.user.name}
                                  </h4>
                                  <div className="flex items-center mt-1">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`h-4 w-4 ${
                                          i < Math.floor(review.rating)
                                            ? 'text-yellow-500 fill-yellow-500'
                                            : 'text-gray-300'
                                        }`}
                                      />
                                    ))}
                                    <span className="ml-2 text-sm text-gray-500">
                                      {formatDate(review.createdAt)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <p className="mt-2 text-gray-700">
                                {review.comment}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right column - Booking and contact */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 sticky top-6">
              <h3 className="text-xl font-bold mb-4">
                Book {talent.firstName}
              </h3>
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Hourly Rate</span>
                  <span className="text-xl font-bold text-orange-500">
                    ${talent.hourlyRate}
                  </span>
                </div>
                <div className="h-px bg-gray-200 my-4"></div>
                <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                  <span>Service Fee</span>
                  <span>${Math.round(talent.hourlyRate * 0.1)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Platform Fee</span>
                  <span>${Math.round(talent.hourlyRate * 0.05)}</span>
                </div>
                <div className="h-px bg-gray-200 my-4"></div>
                <div className="flex justify-between items-center font-medium">
                  <span>Total (per hour)</span>
                  <span>${Math.round(talent.hourlyRate * 1.15)}</span>
                </div>
              </div>

              <Button className="w-full mb-3 bg-orange-500 hover:bg-orange-600">
                <Calendar className="h-4 w-4 mr-2" />
                Book Now
              </Button>

              <Button
                variant="outline"
                className="w-full border-orange-200 text-orange-600 hover:bg-orange-50"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Contact
              </Button>
            </div>

            <div className="bg-orange-50 rounded-lg p-6 border border-orange-100">
              <h3 className="text-lg font-medium mb-3">Need Help?</h3>
              <p className="text-gray-600 text-sm mb-4">
                Have questions about booking {talent.firstName} or need
                assistance? Our support team is here to help.
              </p>
              <Button
                variant="outline"
                className="w-full bg-white border-orange-200 text-orange-600 hover:bg-orange-50"
              >
                Contact Support
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
