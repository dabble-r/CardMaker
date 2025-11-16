import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import axios, { AxiosError } from 'axios';

interface ExportResult {
  fileBuffer: Buffer;
  contentType: string;
  filename: string;
  format: string;
  size: number;
}

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);
  private readonly renderingServiceUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.renderingServiceUrl =
      this.configService.get<string>('RENDERING_SERVICE_URL') ||
      'http://localhost:3002';
    
    this.logger.log(
      `Export service initialized. Rendering service: ${this.renderingServiceUrl}`,
    );
  }

  async exportCard(
    cardId: string,
    userId: string,
    format: 'png' | 'jpeg' | 'pdf',
  ): Promise<ExportResult> {
    this.logger.log(`Export request: cardId=${cardId}, userId=${userId}, format=${format}`);

    try {
      // Fetch card with template
      const card = await this.fetchCardWithTemplate(cardId, userId);

      // Parse JSON data
      const { frontJson, backJson, cardDataJson } = this.parseCardData(card);

      // Render card using rendering service
      const fileBuffer = await this.renderCard(
        { front: frontJson, back: backJson },
        cardDataJson,
        format,
      );

      // Prepare response
      const contentType = this.getContentType(format);
      const filename = `card-${cardId}-${Date.now()}.${format}`;

      this.logger.log(`Export successful. File: ${filename}, Size: ${fileBuffer.length} bytes`);
      
      return {
        fileBuffer,
        contentType,
        filename,
        format,
        size: fileBuffer.length,
      };
    } catch (error) {
      this.logger.error(`Export failed for card ${cardId}:`, error);
      throw error;
    }
  }

  private async fetchCardWithTemplate(cardId: string, userId: string) {
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: { template: true },
    });

    if (!card) {
      throw new NotFoundException(`Card with ID ${cardId} not found`);
    }

    if (card.userId !== userId) {
      throw new NotFoundException(`Card with ID ${cardId} not found`);
    }

    if (!card.template) {
      throw new InternalServerErrorException(
        `Template not found for card ${cardId}`,
      );
    }

    return card;
  }

  private parseCardData(card: any) {
    try {
      const frontJson =
        typeof card.template.frontJson === 'string'
          ? JSON.parse(card.template.frontJson)
          : card.template.frontJson;

      const backJson =
        typeof card.template.backJson === 'string'
          ? JSON.parse(card.template.backJson)
          : card.template.backJson;

      const cardDataJson =
        typeof card.cardDataJson === 'string'
          ? JSON.parse(card.cardDataJson)
          : card.cardDataJson;

      return { frontJson, backJson, cardDataJson };
    } catch (error) {
      this.logger.error('Failed to parse card JSON data:', error);
      throw new InternalServerErrorException(
        `Invalid card data format: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private async renderCard(
    template: { front: any; back: any },
    cardData: any,
    format: 'png' | 'jpeg' | 'pdf',
  ): Promise<Buffer> {
    this.logger.log(
      `Calling rendering service: ${this.renderingServiceUrl}/render`,
    );

    try {
      const response = await axios.post<ArrayBuffer>(
        `${this.renderingServiceUrl}/render`,
        {
          template,
          cardData,
          format,
        },
        {
          responseType: 'arraybuffer',
          timeout: 60000,
          validateStatus: (status) => status < 500,
        },
      );

      // Check response status
      if (response.status >= 200 && response.status < 300) {
        const contentType = response.headers['content-type'] || '';

        // Check if response is actually an error (JSON error response)
        if (contentType.includes('application/json')) {
          const errorData = this.parseArrayBufferToJson(response.data);
          const errorMessage =
            errorData?.message || errorData?.error || 'Unknown rendering error';
          throw new InternalServerErrorException(
            `Rendering service returned error: ${errorMessage}`,
          );
        }

        // Valid binary response
        const buffer = Buffer.from(response.data);
        this.logger.log(`Rendering successful. Buffer size: ${buffer.length} bytes`);
        return buffer;
      }

      // Non-2xx status - error response
      const errorData = this.parseArrayBufferToJson(response.data);
      const errorMessage =
        errorData?.message || errorData?.error || `HTTP ${response.status}`;
      throw new InternalServerErrorException(
        `Rendering service error: ${errorMessage} (Status: ${response.status})`,
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return this.handleAxiosError(error);
      }

      // Re-throw if already an HttpException
      if (error instanceof InternalServerErrorException) {
        throw error;
      }

      // Wrap other errors
      const message =
        error instanceof Error ? error.message : 'Unknown rendering error';
      throw new InternalServerErrorException(`Rendering failed: ${message}`);
    }
  }

  private handleAxiosError(error: AxiosError): never {
    // Timeout
    if (error.code === 'ECONNABORTED') {
      throw new InternalServerErrorException(
        'Rendering service timed out after 60 seconds',
      );
    }

    // Connection refused - service not running
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      throw new InternalServerErrorException(
        `Cannot connect to rendering service at ${this.renderingServiceUrl}. Please ensure the rendering service is running.`,
      );
    }

    // Network errors
    if (error.code) {
      throw new InternalServerErrorException(
        `Network error: ${error.code} - ${error.message}`,
      );
    }

    // Response with error data
    if (error.response) {
      const errorData = error.response.data
        ? this.parseArrayBufferToJson(error.response.data as ArrayBuffer)
        : null;
      const errorMessage =
        errorData?.message || errorData?.error || error.message || 'Unknown error';
      throw new InternalServerErrorException(
        `Rendering service error: ${errorMessage} (Status: ${error.response.status})`,
      );
    }

    // Generic error
    throw new InternalServerErrorException(
      `Rendering failed: ${error.message || 'Unknown error'}`,
    );
  }

  private parseArrayBufferToJson(buffer: ArrayBuffer): any {
    try {
      const str = Buffer.from(buffer).toString('utf-8');
      return JSON.parse(str);
    } catch {
      return null;
    }
  }

  private getContentType(format: string): string {
    const contentTypes: Record<string, string> = {
      png: 'image/png',
      jpeg: 'image/jpeg',
      pdf: 'application/pdf',
    };
    return contentTypes[format] || 'application/octet-stream';
  }
}
