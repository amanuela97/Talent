/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// src/cloudinary/cloudinary.service.ts
import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import cloudinary from './cloudinary.config';
import { UploadApiResponse, UploadApiOptions } from 'cloudinary';
import { MediaType } from '@prisma/client';
import * as toStream from 'buffer-to-stream';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  /**
   * Upload multiple files to Cloudinary
   * @param files - List of files to be uploaded
   * @param talentId - Unique Talent ID to organize the files into folders
   * @returns Promise with uploaded file details
   */
  async uploadFiles(
    files: Express.Multer.File[],
    talentId: string,
  ): Promise<
    (
      | {
          url: string;
          type: string;
          publicId: string;
        }
      | undefined
    )[]
  > {
    const folderBase = `talent/${talentId}`;
    const results = await Promise.all(
      files.map(async (file) => {
        const mime = file.mimetype;
        let resourceType: 'image' | 'video' | 'audio' = 'image';
        let folder = '';

        // Determine the resource type and folder structure
        if (mime.startsWith('video')) {
          resourceType = 'video';
          folder = `${folderBase}/videos`;
        } else if (mime.startsWith('audio') || mime.endsWith('mpeg')) {
          resourceType = 'audio';
          folder = `${folderBase}/audios`;
        } else if (mime.startsWith('image')) {
          resourceType = 'image';
          folder = `${folderBase}/images`;
        }

        // Upload file to Cloudinary
        try {
          const uploaded = await this.uploadFile(file, resourceType, folder);
          return {
            url: uploaded.secure_url,
            type: resourceType.toUpperCase(), // For Prisma enum MediaType
            publicId: uploaded.public_id,
          };
        } catch (e) {
          console.error('Upload failed:', e);
        }
      }),
    );

    return results;
  }

  /**
   * Check if a profile picture already exists for a talent in Cloudinary
   * @param talentId The talent ID to check
   * @returns The existing profile picture info or null if none exists
   */
  async checkExistingProfilePicture(
    talentId: string,
  ): Promise<{ publicId: string; url: string } | null> {
    try {
      const folderPath = `talent/profile/${talentId}`;

      return new Promise((resolve) => {
        cloudinary.search
          .expression(`folder:${folderPath}`)
          .sort_by('created_at', 'desc')
          .max_results(1)
          .execute()
          .then((result) => {
            if (result && result.resources && result.resources.length > 0) {
              const resource = result.resources[0];
              resolve({
                publicId: resource.public_id,
                url: resource.secure_url,
              });
            } else {
              resolve(null);
            }
          })
          .catch((err) => {
            console.error('Error checking for existing profile picture:', err);
            // If there's an error searching, just resolve with null
            // instead of failing the request
            resolve(null);
          });
      });
    } catch (error) {
      console.error('Error in checkExistingProfilePicture:', error);
      return null;
    }
  }

  /**
   * Upload a profile picture to Cloudinary
   * @param file The file to upload
   * @param talentId The talent ID to associate with the upload
   * @returns The upload result including public_id and secure_url
   */
  async uploadProfilePicture(file: Express.Multer.File, talentId: string) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    try {
      // Check if a profile picture already exists
      const existingPicture = await this.checkExistingProfilePicture(talentId);

      // If there's an existing picture, delete it first
      if (existingPicture && existingPicture.publicId) {
        try {
          await this.deleteFile(existingPicture.publicId);
        } catch (deleteError) {
          console.warn(
            `Could not delete existing profile picture: ${deleteError.message}`,
          );
          // Continue with upload even if deletion fails
        }
      }

      // Create a readable stream from the file buffer
      const stream = new Readable();
      stream.push(file.buffer);
      stream.push(null);

      return new Promise<{ publicId: string; url: string }>(
        (resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: `talent/profile/${talentId}`,
              resource_type: 'image',
              transformation: [
                { width: 500, height: 500, crop: 'fill', gravity: 'face' },
              ],
            },
            (error, result) => {
              if (error) {
                reject(
                  new BadRequestException(`Upload failed: ${error.message}`),
                );
              } else {
                resolve({
                  publicId: result?.public_id || '',
                  url: result?.secure_url || '',
                });
              }
            },
          );

          stream.pipe(uploadStream);
        },
      );
    } catch (error) {
      console.error('Error in uploadProfilePicture:', error);
      throw new InternalServerErrorException(
        `Failed to upload profile picture: ${error.message}`,
      );
    }
  }

  /**
   * Upload a single file to Cloudinary
   * @param file - File to be uploaded
   * @param mediaType - Type of media (image, video, audio)
   * @param talentId - Unique Talent ID for folder organization
   * @returns Promise with uploaded file details
   */
  async uploadSingleFile(
    file: Express.Multer.File,
    mediaType: MediaType,
    talentId: string,
  ): Promise<{ url: string; publicId: string }> {
    const folderBase = `talent/media/${talentId}`;
    let resourceType: 'image' | 'video' | 'audio' = 'image';
    let folder = '';

    // Determine folder based on media type
    switch (mediaType) {
      case MediaType.VIDEO:
        resourceType = 'video';
        folder = `${folderBase}/videos`;
        break;
      case MediaType.AUDIO:
        resourceType = 'audio';
        folder = `${folderBase}/audios`;
        break;
      case MediaType.IMAGE:
      default:
        resourceType = 'image';
        folder = `${folderBase}/images`;
        break;
    }

    // Upload to Cloudinary
    const result = await this.uploadFile(file, resourceType, folder);

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  }

  /**
   * Delete a file from Cloudinary by its public ID
   * @param publicId - Cloudinary public ID of the file
   * @returns Promise with deletion result
   */
  async deleteFile(publicId: string): Promise<{ result: string }> {
    console.log('Attempting to delete file with public ID:', publicId);

    // Determine resource type based on the path in publicId
    let resourceType = 'image'; // Default resource type

    if (publicId.includes('/videos/') || publicId.includes('/video/')) {
      resourceType = 'video';
      console.log('Detected resource type: video');
    } else if (publicId.includes('/audios/') || publicId.includes('/audio/')) {
      resourceType = 'video'; // Cloudinary uses 'video' resource type for audio files
      console.log('Detected resource type: audio (using video resource type)');
    } else if (publicId.includes('/images/') || publicId.includes('/image/')) {
      resourceType = 'image';
      console.log('Detected resource type: image');
    }

    return new Promise((resolve, reject) => {
      void cloudinary.uploader.destroy(
        publicId,
        {
          invalidate: true,
          resource_type: resourceType,
        },
        (error, result) => {
          if (error) {
            const errorMsg =
              error instanceof Error ? error : new Error(JSON.stringify(error));
            console.error('Cloudinary deletion error:', errorMsg.message);
            return reject(new Error(errorMsg.message));
          }

          console.log(
            'Cloudinary deletion success for',
            publicId,
            'with resource type',
            resourceType,
            ':',
            result,
          );
          resolve({ result: result.result });
        },
      );
    });
  }

  /**
   * Delete multiple files from Cloudinary by their public IDs
   * @param publicIds - Array of Cloudinary public IDs
   * @returns Promise with deletion results
   */
  async deleteFiles(publicIds: string[]): Promise<{ result: string }[]> {
    return Promise.all(publicIds.map((publicId) => this.deleteFile(publicId)));
  }

  /**
   * Extract public ID from Cloudinary URL
   * @param url - Cloudinary URL
   * @returns Public ID or null if not found
   */
  extractPublicIdFromUrl(url: string): string | null {
    // If the input is already a public ID (not a URL), return it as is
    if (!url.startsWith('http')) {
      return url;
    }

    console.log('Attempting to extract public ID from URL:', url);

    // For URLs with a public_id directly included
    if (url.includes('public_id=')) {
      const publicIdMatch = url.match(/public_id=([^&]+)/);
      if (publicIdMatch) return decodeURIComponent(publicIdMatch[1]);
    }

    // Parse the URL to get components
    try {
      const urlObj = new URL(url);
      const pathSegments = urlObj.pathname.split('/');

      // Check for Cloudinary domain
      if (!urlObj.hostname.includes('cloudinary')) {
        console.warn('Not a Cloudinary URL:', url);
        return null;
      }

      // Handle the 'upload' segment in the path - it's part of Cloudinary URL structure
      // Find the upload index
      const uploadIndex = pathSegments.findIndex((segment) =>
        [
          'upload',
          'video/upload',
          'image/upload',
          'audio/upload',
          'raw/upload',
        ].includes(segment),
      );

      if (uploadIndex !== -1) {
        // Find the version part (starts with 'v' followed by numbers)
        const versionIndex = pathSegments.findIndex((segment) =>
          /^v\d+$/.test(segment),
        );

        if (versionIndex !== -1 && versionIndex < pathSegments.length - 1) {
          // Everything after the version is the public ID, excluding the file extension
          const publicIdParts = pathSegments.slice(versionIndex + 1);
          const publicIdWithoutExtension = publicIdParts
            .join('/')
            .replace(/\.[^/.]+$/, '');
          console.log(
            'Extracted public ID (method 1):',
            publicIdWithoutExtension,
          );
          return publicIdWithoutExtension;
        }
      }
    } catch (error) {
      console.error('Error parsing URL:', error);
    }

    // Fallback method using regex patterns

    // Pattern for Cloudinary URLs with version number: /v1234567890/folder/file.ext
    const regexWithVersion = /\/v\d+\/(.+?)(?:\.\w+)?$/;
    const versionMatch = url.match(regexWithVersion);

    if (versionMatch && versionMatch[1]) {
      console.log('Extracted public ID (method 2):', versionMatch[1]);
      return versionMatch[1];
    }

    // Try to match the folder pattern for talent media
    const talentMediaPattern =
      /(talent\/[\w-]+\/(?:images|videos|audios)\/[\w-]+)/;
    const talentMatch = url.match(talentMediaPattern);
    if (talentMatch) {
      console.log('Extracted public ID (method 3):', talentMatch[1]);
      return talentMatch[1];
    }

    // Special case for video/audio URLs
    // For URLs like: https://res.cloudinary.com/metropolia-fi/video/upload/v1746992972/talent/7c1fbe61.../audios/file.mp3
    const resourceTypePattern =
      /\/(?:video|audio|image)\/upload\/v\d+\/(.+?)(?:\.\w+)?$/;
    const resourceMatch = url.match(resourceTypePattern);
    if (resourceMatch) {
      console.log('Extracted public ID (method 4):', resourceMatch[1]);
      return resourceMatch[1];
    }

    // Last attempt - try to extract just the filename
    const filenamePattern = /\/([^/]+?)(?:\.\w+)?$/;
    const filenameMatch = url.match(filenamePattern);
    if (filenameMatch) {
      console.log(
        'Extracted filename as public ID (method 5):',
        filenameMatch[1],
      );
      return filenameMatch[1];
    }

    console.warn('Could not extract public ID from URL:', url);
    return null;
  }

  private async uploadFile(
    file: Express.Multer.File,
    resourceType: 'image' | 'video' | 'audio',
    folder: string,
    transformation?: Record<string, any>,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      if (!file?.buffer || file.buffer.length === 0) {
        return reject(new Error('File buffer is empty or undefined.'));
      }
      const uploadOptions: UploadApiOptions = {
        resource_type: resourceType === 'audio' ? 'video' : resourceType, // Cloudinary uses 'video' for audio as well
        folder,
      };

      // Add transformation options if provided
      if (transformation) {
        uploadOptions.transformation = transformation;
      }

      const stream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            const errorMsg =
              error instanceof Error ? error : new Error(JSON.stringify(error));
            return reject(new Error(errorMsg.message));
          }

          if (result) {
            resolve(result);
          } else {
            reject(new Error('Upload result is undefined.'));
          }
        },
      );
      toStream(file.buffer).pipe(stream);
    });
  }
}
