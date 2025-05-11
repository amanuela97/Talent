import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, X, AlertCircle, Music } from 'lucide-react';

interface MediaItem {
  id: string;
  url: string;
}

interface AudioEditorProps {
  audioFiles: MediaItem[];
  onSubmit: (audioFiles: File[]) => Promise<void>;
  onRemove: (mediaId: string) => Promise<void>;
}

export default function AudioEditor({
  audioFiles,
  onSubmit,
  onRemove,
}: AudioEditorProps) {
  const [audioList, setAudioList] = useState(audioFiles);
  const [newAudioFiles, setNewAudioFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      setNewAudioFiles((prev) => [...prev, ...newFiles]);

      // Create preview URLs for all new files
      const newAudioUrls = newFiles.map((file) => ({
        id: `new-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        url: URL.createObjectURL(file),
      }));

      setAudioList((prev) => [...prev, ...newAudioUrls]);
    }
  };

  const removeAudio = async (index: number, id: string) => {
    if (id.startsWith('new-')) {
      // For new files that haven't been uploaded yet, just remove from state
      setAudioList((prev) => prev.filter((_, i) => i !== index));

      // Find the index in newAudioFiles
      const originalAudioLength = audioFiles.length;
      const newFileIndex = index - originalAudioLength;
      if (newFileIndex >= 0) {
        setNewAudioFiles((prev) => prev.filter((_, i) => i !== newFileIndex));
      }
    } else {
      // For existing files, call the API
      try {
        await onRemove(id);
        setAudioList((prev) => prev.filter((_, i) => i !== index));
      } catch (error) {
        console.error('Failed to remove audio:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await onSubmit(newAudioFiles);
      // Clear the new files after successful upload
      setNewAudioFiles([]);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Check if we have at least the minimum recommended number of audio files
  const hasMinimumAudio = audioList.length >= 2;
  // Check if we're exceeding the maximum allowed audio files
  const hasMaximumAudio = audioList.length >= 10;

  return (
    <div className="flex-1 p-6">
      <div className="bg-white rounded-md shadow-sm">
        <div className="border-b p-6">
          <h1 className="text-2xl font-bold text-gray-800">Audio Files</h1>
          <p className="text-gray-600 mt-2">
            Showcase your talent with audio samples
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Audio Gallery</h2>
                <p className="text-gray-600">
                  Upload audio samples of your work
                </p>
              </div>

              {!hasMinimumAudio && (
                <div className="flex items-center text-amber-600">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  <span className="text-sm font-medium">
                    Add at least {2 - audioList.length} more audio file(s)
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {audioList.map((audio, index) => (
                <div
                  key={audio.id}
                  className="relative rounded-md overflow-hidden border group bg-gray-100"
                >
                  <div className="flex items-center p-4">
                    <div className="bg-blue-100 p-3 rounded-full mr-4">
                      <Music className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium mb-1">
                        Audio Sample {index + 1}
                      </div>
                      <audio src={audio.url} controls className="w-full" />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAudio(index, audio.id)}
                      className="ml-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Add audio button (if below maximum limit) */}
              {!hasMaximumAudio && (
                <label
                  htmlFor="audioFiles"
                  className="cursor-pointer border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center h-32 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex flex-col items-center text-gray-500">
                    <Upload className="h-8 w-8 mb-2" />
                    <span>Add Audio</span>
                    <span className="text-xs mt-1">{audioList.length}/10</span>
                  </div>
                  <Input
                    id="audioFiles"
                    type="file"
                    accept="audio/*"
                    multiple
                    className="hidden"
                    onChange={handleAudioChange}
                    disabled={hasMaximumAudio}
                  />
                </label>
              )}
            </div>

            <p className="text-sm text-gray-500">
              Upload at least 2 and up to 10 audio samples that showcase your
              talent. Maximum file size: 20MB per audio file. Recommended
              formats: MP3, WAV.
            </p>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={submitting || newAudioFiles.length === 0}
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
