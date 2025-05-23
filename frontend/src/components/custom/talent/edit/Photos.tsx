import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, AlertCircle } from 'lucide-react';

interface MediaItem {
  id: string;
  url: string;
}

interface PhotosEditorProps {
  profilePicture: string;
  images: MediaItem[];
  onSubmit: (
    profilePicture: File | null,
    galleryImages: File[]
  ) => Promise<void>;
  onRemove: (mediaId: string) => Promise<void>;
}

export default function PhotosEditor({
  profilePicture,
  images,
  onSubmit,
  onRemove,
}: PhotosEditorProps) {
  const [profilePic, setProfilePic] = useState(profilePicture);
  const [galleryImages, setGalleryImages] = useState(images);
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [newGalleryFiles, setNewGalleryFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setProfilePicFile(file);

      // Create a preview URL
      const objectUrl = URL.createObjectURL(file);
      setProfilePic(objectUrl);
    }
  };

  const handleGalleryImagesChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      setNewGalleryFiles((prev) => [...prev, ...newFiles]);

      // Create preview URLs for all new files
      const newImageUrls = newFiles.map((file) => ({
        id: `new-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        url: URL.createObjectURL(file),
      }));

      setGalleryImages((prev) => [...prev, ...newImageUrls]);
    }
  };

  const removeGalleryImage = async (index: number, id: string) => {
    // If it's an existing image (has a real id), call the API
    if (id.startsWith('new-')) {
      // For new images that aren't uploaded yet, just remove from state
      setGalleryImages((prev) => prev.filter((_, i) => i !== index));

      // Find the index in newGalleryFiles
      const originalImagesLength = images.length;
      const newFileIndex = index - originalImagesLength;
      if (newFileIndex >= 0) {
        setNewGalleryFiles((prev) => prev.filter((_, i) => i !== newFileIndex));
      }
    } else {
      // For existing images, call the API
      try {
        await onRemove(id);
        setGalleryImages((prev) => prev.filter((_, i) => i !== index));
      } catch (error) {
        console.error('Failed to remove image:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await onSubmit(profilePicFile, newGalleryFiles);
      // Clear the new files after successful upload
      setNewGalleryFiles([]);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Check if we have at least the minimum recommended number of images
  const hasMinimumImages = galleryImages.length >= 4;
  // Check if we're exceeding the maximum allowed images
  const hasMaximumImages = galleryImages.length >= 10;

  return (
    <div className="flex-1 p-6">
      <div className="bg-white rounded-md shadow-sm">
        <div className="border-b p-6">
          <h1 className="text-2xl font-bold text-gray-800">Photos</h1>
          <p className="text-gray-600 mt-2">
            Upload your profile picture and gallery images
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Profile Picture Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Profile Picture</h2>
            <p className="text-gray-600">
              This will be displayed on your profile and in search results
            </p>

            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="relative h-48 w-48 rounded-md overflow-hidden border">
                <Image
                  src={profilePic || '/placeholder.svg'}
                  alt="Profile Picture"
                  fill
                  sizes="(48px)"
                  className="object-cover"
                />
              </div>

              <div className="space-y-4 flex-1">
                <div className="space-y-2">
                  <Label htmlFor="profilePicture">
                    Upload New Profile Picture
                  </Label>
                  <Input
                    id="profilePicture"
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePicChange}
                  />
                </div>
                <p className="text-sm text-gray-500">
                  Recommended: A clear photo of your face or logo. Maximum file
                  size: 5MB.
                </p>
              </div>
            </div>
          </div>

          {/* Gallery Images Section */}
          <div className="space-y-4 pt-6 border-t">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Gallery Images</h2>
                <p className="text-gray-600">
                  Showcase your work with high-quality images
                </p>
              </div>

              {!hasMinimumImages && (
                <div className="flex items-center text-amber-600">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  <span className="text-sm font-medium">
                    Add at least {4 - galleryImages.length} more image(s)
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {galleryImages.map((image, index) => (
                <div
                  key={image.id}
                  className="relative h-48 rounded-md overflow-hidden border group"
                >
                  <Image
                    src={image.url}
                    alt={`Gallery image ${index + 1}`}
                    fill
                    sizes="(48px)"
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(index, image.id)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {/* Add image button (if below maximum limit) */}
              {!hasMaximumImages && (
                <label
                  htmlFor="galleryImages"
                  className="cursor-pointer border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center h-48 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex flex-col items-center text-gray-500">
                    <Upload className="h-8 w-8 mb-2" />
                    <span>Add Image</span>
                    <span className="text-xs mt-1">
                      {galleryImages.length}/10
                    </span>
                  </div>
                  <Input
                    id="galleryImages"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleGalleryImagesChange}
                    disabled={hasMaximumImages}
                  />
                </label>
              )}
            </div>

            <p className="text-sm text-gray-500">
              Upload at least 4 and up to 10 high-quality images that showcase
              your work. Maximum file size per image: 5MB.
            </p>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={
                submitting || (newGalleryFiles.length === 0 && !profilePicFile)
              }
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
