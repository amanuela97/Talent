"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import Image from "next/image";
import { X, Music } from "lucide-react";
import type { Media } from "@prisma/client";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { ScrollArea } from "@/components/ui/scroll-area";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/effect-fade";

interface MediaModalProps {
  media: Media[];
  isOpen: boolean;
  onClose: () => void;
  initialIndex: number;
  title: string;
}

export function MediaModal({
  media,
  isOpen,
  onClose,
  initialIndex,
  title,
}: MediaModalProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  // Reset active index when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  // Check if all media items are audio
  const isAudioGallery = media.every((item) => item.type === "AUDIO");

  // Render audio list layout
  if (isAudioGallery) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="!fixed flex flex-col !w-[42rem] !h-[80vh] max-h-[800px] bg-black/95 p-0 [&>button]:hidden overflow-hidden">
          <DialogTitle asChild>
            <VisuallyHidden>{title}</VisuallyHidden>
          </DialogTitle>

          {/* Header */}
          <div className="flex justify-between items-center p-4 bg-gradient-to-b from-black/80 to-transparent w-full">
            <h2 className="text-white text-xl font-semibold" aria-hidden="true">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-300 transition rounded-full bg-black/40 p-2"
              aria-label="Close audio gallery"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Audio List */}
          <div className="flex-1 min-h-0">
            <ScrollArea className="h-full">
              <div className="space-y-4 p-4">
                {media.map((item, index) => (
                  <div
                    key={item.id}
                    className="bg-white/10 rounded-lg p-4 space-y-2"
                  >
                    <div className="flex items-center gap-3 text-white mb-2">
                      <Music className="h-5 w-5" />
                      <span className="font-medium">
                        Track {index + 1} of {media.length}
                      </span>
                    </div>
                    <audio
                      src={item.url}
                      controls
                      className="w-full"
                      controlsList="nodownload"
                      aria-label={
                        item.description || `Audio track ${index + 1}`
                      }
                    >
                      Your browser does not support the audio element.
                    </audio>
                    {item.description && (
                      <p className="text-white/80 text-sm" role="description">
                        {item.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Render image/video swiper layout
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex flex-col justify-center items-center max-w-[90vw] w-full sm:max-w-6xl p-0 bg-black/95 [&>button]:hidden">
        <DialogTitle asChild>
          <VisuallyHidden>{title}</VisuallyHidden>
        </DialogTitle>

        {/* Header */}
        <div className="flex justify-between items-center p-4 bg-gradient-to-b from-black/80 to-transparent min-w-full h-[10%]">
          <h2 className="text-white text-xl font-semibold" aria-hidden="true">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 transition rounded-full bg-black/40 p-2"
            aria-label="Close gallery"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex justify-center items-center w-full">
          <Swiper
            modules={[Navigation, Pagination]}
            navigation
            pagination={{ clickable: true }}
            initialSlide={initialIndex}
            onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
            className="h-full"
            style={
              {
                "--swiper-navigation-color": "#fff",
                "--swiper-pagination-color": "#fff",
                "--swiper-navigation-size": "24px",
              } as React.CSSProperties
            }
          >
            {media.map((item) => (
              <SwiperSlide key={item.id}>
                <div className="flex items-center justify-center w-full h-full p-2">
                  {item.type === "IMAGE" && (
                    <div className="relative w-full h-[calc(100vh-250px)]">
                      <Image
                        src={item.url}
                        alt={item.description || "Image"}
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                        priority
                      />
                    </div>
                  )}
                  {item.type === "VIDEO" && (
                    <video
                      src={item.url}
                      controls
                      className="max-w-full max-h-[calc(100vh-250px)]"
                      controlsList="nodownload"
                      aria-label={item.description || "Video content"}
                    >
                      Your browser does not support the video tag.
                    </video>
                  )}
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Footer */}
        <div
          className="p-4 bg-gradient-to-t from-black/80 to-transparent w-full"
          role="status"
          aria-live="polite"
        >
          <p className="text-white text-sm">
            {activeIndex + 1} of {media.length}
          </p>
          {media[activeIndex]?.description && (
            <p className="text-white/80 mt-1" role="description">
              {media[activeIndex].description}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
