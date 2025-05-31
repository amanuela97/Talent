"use client";

import { useState } from "react";
import { ImageIcon, Video, Music } from "lucide-react";
import type { Media } from "@prisma/client";
import { MediaModal } from "./media-modal";

interface MediaGalleryProps {
  media: Media[];
}

export function MediaGallery({ media }: MediaGalleryProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMediaType, setSelectedMediaType] = useState<
    "IMAGE" | "VIDEO" | "AUDIO" | null
  >(null);

  const images = media.filter((item) => item.type === "IMAGE");
  const videos = media.filter((item) => item.type === "VIDEO");
  const audios = media.filter((item) => item.type === "AUDIO");

  const openModal = (mediaType: "IMAGE" | "VIDEO" | "AUDIO") => {
    setSelectedMediaType(mediaType);
    setIsModalOpen(true);
  };

  // Filter media by selected type for the modal
  const filteredMedia = selectedMediaType
    ? media.filter((item) => item.type === selectedMediaType)
    : media;

  // Get a thumbnail image for each category

  return (
    <div>
      <h3 className="text-xl font-bold mb-6">Media</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Images Category */}
        <div
          className="cursor-pointer group"
          onClick={() => images.length > 0 && openModal("IMAGE")}
        >
          <div className="aspect-square relative overflow-hidden rounded-xl shadow-md">
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20 z-10" />
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <ImageIcon className="h-20 w-20 text-gray-300" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
              <h4 className="text-white text-xl font-bold">Images</h4>
              <p className="text-white/80 text-sm">{images.length} items</p>
            </div>
          </div>
        </div>

        {/* Videos Category */}
        <div
          className="cursor-pointer group"
          onClick={() => videos.length > 0 && openModal("VIDEO")}
        >
          <div className="aspect-square relative overflow-hidden rounded-xl shadow-md">
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20 z-10" />
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <Video className="h-20 w-20 text-gray-300" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
              <h4 className="text-white text-xl font-bold">Videos</h4>
              <p className="text-white/80 text-sm">{videos.length} items</p>
            </div>
          </div>
        </div>

        {/* Audio Category */}
        <div
          className="cursor-pointer group"
          onClick={() => audios.length > 0 && openModal("AUDIO")}
        >
          <div className="aspect-square relative overflow-hidden rounded-xl shadow-md">
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20 z-10" />
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <Music className="h-20 w-20 text-gray-300" />
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
              <h4 className="text-white text-xl font-bold">Audio</h4>
              <p className="text-white/80 text-sm">{audios.length} items</p>
            </div>
          </div>
        </div>
      </div>

      {/* Media Modal */}
      <MediaModal
        media={filteredMedia}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedMediaType(null);
        }}
        initialIndex={0}
        title={
          selectedMediaType
            ? `${
                selectedMediaType.charAt(0) +
                selectedMediaType.slice(1).toLowerCase()
              } Gallery`
            : "Media Gallery"
        }
      />
    </div>
  );
}
