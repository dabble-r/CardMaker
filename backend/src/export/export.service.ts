import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../assets/s3.service';
import axios from 'axios';

@Injectable()
export class ExportService {
  private renderingServiceUrl: string;
  private useLocalStorage: boolean;

  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
    private configService: ConfigService,
  ) {
    this.renderingServiceUrl =
      this.configService.get<string>('RENDERING_SERVICE_URL') || 'http://localhost:3002';
    // Use local storage if AWS credentials are not configured
    this.useLocalStorage = !this.configService.get<string>('AWS_ACCESS_KEY_ID');
  }

  async exportCard(
    cardId: string,
    userId: string,
    format: 'png' | 'jpeg' | 'pdf',
  ) {
    try {
      // Get card and template
      const card = await this.prisma.card.findUnique({
        where: { id: cardId },
        include: {
          template: true,
        },
      });

      if (!card) {
        throw new NotFoundException('Card not found');
      }

      if (card.userId !== userId) {
        throw new NotFoundException('Card not found');
      }

      if (!card.template) {
        throw new InternalServerErrorException('Template not found for card');
      }

      // Ensure JSON fields are properly formatted
      let frontJson: any;
      let backJson: any;
      let cardDataJson: any;
      
      try {
        frontJson = typeof card.template.frontJson === 'string' 
          ? JSON.parse(card.template.frontJson) 
          : card.template.frontJson;
        backJson = typeof card.template.backJson === 'string'
          ? JSON.parse(card.template.backJson)
          : card.template.backJson;
        cardDataJson = typeof card.cardDataJson === 'string'
          ? JSON.parse(card.cardDataJson)
          : card.cardDataJson;
      } catch (parseError: any) {
        console.error('JSON parsing error:', parseError);
        throw new InternalServerErrorException(
          `Failed to parse card data: ${parseError.message || 'Invalid JSON format'}`,
        );
      }

      // Prepare data for rendering service
      const renderData = {
        template: {
          front: frontJson,
          back: backJson,
        },
        cardData: cardDataJson,
      };

      console.log('Calling rendering service:', {
        url: `${this.renderingServiceUrl}/render`,
        format,
        hasTemplate: !!renderData.template,
        hasCardData: !!renderData.cardData,
      });

      // Call rendering service
      let fileBuffer: Buffer;
      try {
        const response = await axios.post(
          `${this.renderingServiceUrl}/render`,
          {
            ...renderData,
            format,
          },
          {
            responseType: 'arraybuffer',
            timeout: 30000, // 30 second timeout
          },
        );

        fileBuffer = Buffer.from(response.data);
        console.log('Rendering successful, buffer size:', fileBuffer.length);
      } catch (error: any) {
        console.error('Rendering service error:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          code: error.code,
        });
        const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
        const statusCode = error.response?.status || 500;
        throw new InternalServerErrorException(
          `Failed to render card: ${errorMessage}. Status: ${statusCode}`,
        );
      }

      const contentType = this.getContentType(format);
      const filename = `card-${cardId}-${Date.now()}.${format}`;

      // For local development, return the file buffer directly
      if (this.useLocalStorage) {
        console.log('Using local storage mode, file size:', fileBuffer.length);
        
        return {
          fileBuffer,
          contentType,
          filename,
          format,
          size: fileBuffer.length,
        };
      }

      // Upload to S3 for production
      try {
        const key = `exports/${userId}/${filename}`;
        const url = await this.s3Service.uploadExport(key, fileBuffer, contentType);

        return {
          url,
          key,
          filename,
          format,
          size: fileBuffer.length,
        };
      } catch (error: any) {
        console.error('S3 upload error:', error);
        throw new InternalServerErrorException(
          `Failed to upload export: ${error.message || 'Unknown error'}`,
        );
      }
    } catch (error: any) {
      console.error('Export service error:', error);
      // Re-throw HttpExceptions as-is
      if (error instanceof InternalServerErrorException || error instanceof NotFoundException) {
        throw error;
      }
      // Wrap other errors
      throw new InternalServerErrorException(
        `Export failed: ${error.message || 'Unknown error'}`,
      );
    }
  }

  private getContentType(format: string): string {
    switch (format) {
      case 'png':
        return 'image/png';
      case 'jpeg':
        return 'image/jpeg';
      case 'pdf':
        return 'application/pdf';
      default:
        return 'application/octet-stream';
    }
  }
}

