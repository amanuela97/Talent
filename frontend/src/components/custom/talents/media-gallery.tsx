import Image from 'next/image';
import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ImageIcon, Film, Music } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import type { Media } from '@/types/prismaTypes';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface MediaGalleryProps {
  media: Media[];
}

export function MediaGallery({ media }: MediaGalleryProps) {
  const images = media.filter((item) => item.type === 'IMAGE');
  const videos = media.filter((item) => item.type === 'VIDEO');
  const audios = media.filter((item) => item.type === 'AUDIO');

  const [activeTab, setActiveTab] = useState<string>(
    images.length > 0
      ? 'images'
      : videos.length > 0
      ? 'videos'
      : audios.length > 0
      ? 'audio'
      : 'images'
  );

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold mb-4">Media</h3>

      {/* Fixed height container to prevent layout shifts */}
      <div className="w-full" style={{ minHeight: '500px' }}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="images" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              <span>Images</span>
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center gap-2">
              <Film className="h-4 w-4" />
              <span>Videos</span>
            </TabsTrigger>
            <TabsTrigger value="audio" className="flex items-center gap-2">
              <Music className="h-4 w-4" />
              <span>Audio</span>
            </TabsTrigger>
          </TabsList>

          {/* Images Content */}
          <TabsContent value="images" className="w-full mx-auto">
            {images.length > 0 ? (
              <div className="max-w-2xl mx-auto">
                <Swiper
                  modules={[Navigation, Pagination]}
                  navigation
                  pagination={{ clickable: true }}
                  spaceBetween={20}
                  slidesPerView={1}
                  loop={images.length > 1}
                  className="w-full py-4"
                >
                  {images.map((item) => (
                    <SwiperSlide key={item.id}>
                      <div className="rounded-lg overflow-hidden shadow-md">
                        <div className="relative h-80 w-full">
                          <Image
                            src={item.url || '/placeholder.svg'}
                            alt={item.description || ''}
                            fill
                            className="object-cover"
                          />
                        </div>
                        {item.description && (
                          <div className="p-3 bg-gray-50">
                            <p className="text-sm">{item.description}</p>
                          </div>
                        )}
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg max-w-2xl mx-auto">
                <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No images available</p>
              </div>
            )}
          </TabsContent>

          {/* Videos Content */}
          <TabsContent value="videos" className="w-full mx-auto">
            {videos.length > 0 ? (
              <div className="max-w-2xl mx-auto">
                <Swiper
                  modules={[Navigation, Pagination]}
                  navigation
                  pagination={{ clickable: true }}
                  spaceBetween={20}
                  slidesPerView={1}
                  loop={videos.length > 1}
                  className="w-full py-4"
                >
                  {videos.map((item) => (
                    <SwiperSlide key={item.id}>
                      <div className="rounded-lg overflow-hidden shadow-md">
                        <div className="aspect-video">
                          <video
                            src={item.url}
                            controls
                            className="w-full h-full object-cover"
                            poster="/placeholder.svg"
                          >
                            Your browser does not support the video tag.
                          </video>
                        </div>
                        {item.description && (
                          <div className="p-3 bg-gray-50">
                            <p className="text-sm">{item.description}</p>
                          </div>
                        )}
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg max-w-2xl mx-auto">
                <Film className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No videos available</p>
              </div>
            )}
          </TabsContent>

          {/* Audio Content */}
          <TabsContent value="audio" className="w-full mx-auto">
            {audios.length > 0 ? (
              <div className="border rounded-lg max-w-2xl mx-auto">
                {audios.map((item, index) => (
                  <div
                    key={item.id}
                    className={`flex items-center p-4 ${
                      index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                    } hover:bg-orange-50 transition-colors duration-200`}
                  >
                    <div className="mr-4 bg-orange-100 rounded-full p-3">
                      <Music className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="flex-grow">
                      <p className="font-medium mb-2">
                        {item.description || `Track ${index + 1}`}
                      </p>
                      <audio controls className="w-full h-10" src={item.url}>
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg max-w-2xl mx-auto">
                <Music className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No audio samples available</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
