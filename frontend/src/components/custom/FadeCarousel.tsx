'use client';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/autoplay';
import { useState } from 'react';

// Import images statically
import musician from '../../../public/assets/musician.jpg';
import performer from '../../../public/assets/performer.jpg';
import dancer from '../../../public/assets/dancer.jpg';
import clown from '../../../public/assets/clown.jpg';
import chef from '../../../public/assets/chef.jpg';

// Use the imported images
const images = [musician, performer, dancer, clown, chef];

export default function FadeCarousel() {
  // Track which images failed to load
  const [imagesLoaded, setImagesLoaded] = useState<Record<number, boolean>>({});
  const [imagesFailed, setImagesFailed] = useState<Record<number, boolean>>({});

  const handleImageLoad = (index: number) => {
    setImagesLoaded((prev) => ({ ...prev, [index]: true }));
  };

  const handleImageError = (index: number) => {
    console.error(`Failed to load image: ${images[index]}`);
    setImagesFailed((prev) => ({ ...prev, [index]: true }));
  };

  return (
    <Swiper
      modules={[Autoplay, EffectFade]}
      effect="fade"
      autoplay={{
        delay: 3000,
        disableOnInteraction: false,
        pauseOnMouseEnter: false,
      }}
      loop={true}
      allowTouchMove={false} // Disable touch/mouse interactions completely
      simulateTouch={false} // Disable simulated touch
      preventClicksPropagation={true} // Prevent clicks from propagating
      preventClicks={true} // Prevent all clicks
      noSwiping={true} // Disable swiping
      className="w-full h-[450px] drag cursor-not-allowed select-none pointer-events-none"
    >
      {images.map((src, index) => (
        <SwiperSlide key={index} className="w-full h-full">
          <div className="relative w-full h-full bg-gray-100">
            {!imagesFailed[index] ? (
              <>
                {/* Show a loading indicator until image loads */}
                {!imagesLoaded[index] && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-pulse text-gray-400">
                      Loading...
                    </div>
                  </div>
                )}

                <Image
                  fill
                  priority={index === 0}
                  src={src}
                  alt={`Slide ${index}`}
                  className="select-none pointer-events-none"
                  draggable={false}
                  style={{
                    objectFit: 'contain',
                    opacity: imagesLoaded[index] ? 1 : 0,
                    transition: 'opacity 0.3s ease-in-out',
                    userSelect: 'none',
                    pointerEvents: 'none',
                  }}
                  onLoad={() => handleImageLoad(index)}
                  onError={() => handleImageError(index)}
                />
              </>
            ) : (
              <div className="flex items-center justify-center w-full h-full bg-gray-200">
                <p className="text-gray-500">Image not available</p>
              </div>
            )}
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
