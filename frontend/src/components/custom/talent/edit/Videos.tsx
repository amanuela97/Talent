import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, X, AlertCircle } from 'lucide-react';

interface MediaItem {
  id: string;
  url: string;
}

interface VideosEditorProps {
  videos: MediaItem[];
  onSubmit: (videos: File[]) => Promise<void>;
  onRemove: (mediaId: string) => Promise<void>;
}

export default function VideosEditor({
  videos,
  onSubmit,
  onRemove,
}: VideosEditorProps) {
  const [videoList, setVideoList] = useState(videos);
  const [newVideoFiles, setNewVideoFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleVideosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      setNewVideoFiles((prev) => [...prev, ...newFiles]);

      // Create preview URLs for all new files
      const newVideoUrls = newFiles.map((file) => ({
        id: `new-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        url: URL.createObjectURL(file),
      }));

      setVideoList((prev) => [...prev, ...newVideoUrls]);
    }
  };

  const removeVideo = async (index: number, id: string) => {
    if (id.startsWith('new-')) {
      // For new videos that aren't uploaded yet, just remove from state
      setVideoList((prev) => prev.filter((_, i) => i !== index));

      // Find the index in newVideoFiles
      const originalVideosLength = videos.length;
      const newFileIndex = index - originalVideosLength;
      if (newFileIndex >= 0) {
        setNewVideoFiles((prev) => prev.filter((_, i) => i !== newFileIndex));
      }
    } else {
      // For existing videos, call the API
      try {
        await onRemove(id);
        setVideoList((prev) => prev.filter((_, i) => i !== index));
      } catch (error) {
        console.error('Failed to remove video:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await onSubmit(newVideoFiles);
      // Clear the new files after successful upload
      setNewVideoFiles([]);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Check if we have at least the minimum recommended number of videos
  const hasMinimumVideos = videoList.length >= 2;
  // Check if we're exceeding the maximum allowed videos
  const hasMaximumVideos = videoList.length >= 4;

  return (
    <div className="flex-1 p-6">
      <div className="bg-white rounded-md shadow-sm">
        <div className="border-b p-6">
          <h1 className="text-2xl font-bold text-gray-800">Videos</h1>
          <p className="text-gray-600 mt-2">
            Showcase your talent with video content
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Video Gallery</h2>
                <p className="text-gray-600">
                  Upload videos showcasing your talent in action
                </p>
              </div>

              {!hasMinimumVideos && (
                <div className="flex items-center text-amber-600">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  <span className="text-sm font-medium">
                    Add at least {2 - videoList.length} more video(s)
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {videoList.map((video, index) => (
                <div
                  key={video.id}
                  className="relative rounded-md overflow-hidden border group bg-gray-100"
                >
                  <div className="aspect-video flex items-center justify-center bg-gray-200">
                    <video
                      src={video.url}
                      className="w-full h-full object-contain"
                      controls
                    />
                  </div>
                  <div className="p-3 flex justify-between items-center">
                    <span className="text-sm truncate">Video {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeVideo(index, video.id)}
                      className="bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Add video button (if below maximum limit) */}
              {!hasMaximumVideos && (
                <label
                  htmlFor="videos"
                  className="cursor-pointer border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center aspect-video bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex flex-col items-center text-gray-500">
                    <Upload className="h-8 w-8 mb-2" />
                    <span>Add Video</span>
                    <span className="text-xs mt-1">{videoList.length}/4</span>
                  </div>
                  <Input
                    id="videos"
                    type="file"
                    accept="video/*"
                    multiple
                    className="hidden"
                    onChange={handleVideosChange}
                    disabled={hasMaximumVideos}
                  />
                </label>
              )}
            </div>

            <p className="text-sm text-gray-500">
              Upload at least 2 and up to 4 videos that showcase your talent.
              Maximum file size: 50MB per video. Recommended length: 30 seconds
              to 2 minutes.
            </p>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={submitting || newVideoFiles.length === 0}
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
