const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

class S3Service {
  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });

    this.userImagesBucket = process.env.S3_USER_IMAGES_BUCKET || 'user-images';
    this.templatesBucket = process.env.S3_TEMPLATES_BUCKET || 'templates';
    this.exportsBucket = process.env.S3_EXPORTS_BUCKET || 'exports';
  }

  async uploadUserImage(key, file, contentType) {
    const command = new PutObjectCommand({
      Bucket: this.userImagesBucket,
      Key: key,
      Body: file,
      ContentType: contentType,
    });

    await this.s3Client.send(command);
    return this.getSignedUrl(this.userImagesBucket, key);
  }

  async uploadTemplateAsset(key, file, contentType) {
    const command = new PutObjectCommand({
      Bucket: this.templatesBucket,
      Key: key,
      Body: file,
      ContentType: contentType,
    });

    await this.s3Client.send(command);
    return this.getSignedUrl(this.templatesBucket, key);
  }

  async uploadExport(key, file, contentType) {
    const command = new PutObjectCommand({
      Bucket: this.exportsBucket,
      Key: key,
      Body: file,
      ContentType: contentType,
    });

    await this.s3Client.send(command);
    return this.getSignedUrl(this.exportsBucket, key, 3600); // 1 hour expiry for exports
  }

  async deleteUserImage(key) {
    const command = new DeleteObjectCommand({
      Bucket: this.userImagesBucket,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  getSignedUrl(bucket, key, expiresIn = 3600) {
    // In production, generate a signed URL
    // For now, return a placeholder URL structure
    return `https://${bucket}.s3.amazonaws.com/${key}`;
  }

  async generatePresignedUrl(bucket, key, expiresIn = 3600) {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn });
  }
}

module.exports = new S3Service();

