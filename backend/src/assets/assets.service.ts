import { Injectable } from '@nestjs/common';
import { S3Service } from './s3.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AssetsService {
  constructor(private s3Service: S3Service) {}

  async uploadUserImage(userId: string, file: Express.Multer.File) {
    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new Error('Invalid file type. Only images are allowed.');
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('File size exceeds 10MB limit.');
    }

    // Generate unique filename
    const extension = file.originalname.split('.').pop();
    const key = `users/${userId}/${uuidv4()}.${extension}`;

    // Upload to S3
    const url = await this.s3Service.uploadUserImage(key, file.buffer, file.mimetype);

    return {
      url,
      key,
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    };
  }
}

