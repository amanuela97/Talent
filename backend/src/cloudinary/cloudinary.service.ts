/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// src/cloudinary/cloudinary.service.ts
import { Injectable } from '@nestjs/common';
import cloudinary from './cloudinary.config';
import { UploadApiResponse } from 'cloudinary';
import { MediaType } from '@prisma/client';
import * as toStream from 'buffer-to-stream';

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
  ): Promise<any[]> {
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
   * Upload a single file to Cloudinary
   * @param file - File to be uploaded
   * @param mediaType - Type of media (image, video, audio)
   * @param folder - Folder path for organization
   * @returns Promise with uploaded file details
   */
  async uploadSingleFile(
    file: Express.Multer.File,
    mediaType: MediaType,
    talentId: string,
  ): Promise<{ url: string; publicId: string }> {
    const folderBase = `talent/${talentId}`;
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
    return new Promise((resolve, reject) => {
      void cloudinary.uploader.destroy(
        publicId,
        { invalidate: true },
        (error, result) => {
          if (error) {
            const errorMsg =
              error instanceof Error ? error : new Error(JSON.stringify(error));
            return reject(new Error(errorMsg.message));
          }

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
    // Example URL: https://res.cloudinary.com/demo/image/upload/v1234567890/folder/file.jpg
    const regex = /\/v\d+\/(.+)(?:\.\w+)?$/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  private async uploadFile(
    file: Express.Multer.File,
    resourceType: 'image' | 'video' | 'audio',
    folder: string,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      if (!file?.buffer || file.buffer.length === 0) {
        return reject(new Error('File buffer is empty or undefined.'));
      }
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: resourceType === 'audio' ? 'video' : resourceType, // Cloudinary uses 'video' for audio as well
          folder,
        },
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
