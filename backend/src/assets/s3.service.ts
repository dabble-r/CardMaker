import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private s3Client: S3Client;
  private userImagesBucket: string;
  private templatesBucket: string;
  private exportsBucket: string;

  constructor(private configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get<string>('AWS_REGION') || 'us-east-1',
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || '',
      },
    });

    this.userImagesBucket = this.configService.get<string>('S3_USER_IMAGES_BUCKET') || 'user-images';
    this.templatesBucket = this.configService.get<string>('S3_TEMPLATES_BUCKET') || 'templates';
    this.exportsBucket = this.configService.get<string>('S3_EXPORTS_BUCKET') || 'exports';
  }

  async uploadUserImage(key: string, file: Buffer, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.userImagesBucket,
      Key: key,
      Body: file,
      ContentType: contentType,
    });

    await this.s3Client.send(command);
    return this.getSignedUrl(this.userImagesBucket, key);
  }

  async uploadTemplateAsset(key: string, file: Buffer, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.templatesBucket,
      Key: key,
      Body: file,
      ContentType: contentType,
    });

    await this.s3Client.send(command);
    return this.getSignedUrl(this.templatesBucket, key);
  }

  async uploadExport(key: string, file: Buffer, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.exportsBucket,
      Key: key,
      Body: file,
      ContentType: contentType,
    });

    await this.s3Client.send(command);
    return this.getSignedUrl(this.exportsBucket, key, 3600); // 1 hour expiry for exports
  }

  async deleteUserImage(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.userImagesBucket,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  getSignedUrl(bucket: string, key: string, expiresIn: number = 3600): string {
    // In production, generate a signed URL
    // For now, return a placeholder URL structure
    return `https://${bucket}.s3.amazonaws.com/${key}`;
  }

  async generatePresignedUrl(bucket: string, key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn });
  }
}

