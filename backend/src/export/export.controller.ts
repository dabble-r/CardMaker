import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  Res,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { ExportService } from './export.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('export')
@UseGuards(JwtAuthGuard)
export class ExportController {
  private readonly logger = new Logger(ExportController.name);

  constructor(private readonly exportService: ExportService) {}

  @Get('card/:id')
  async exportCard(
    @Param('id') cardId: string,
    @Query('format') format: 'png' | 'jpeg' | 'pdf' = 'png',
    @Request() req: any,
    @Res() res: Response,
  ) {
    this.logger.log(
      `Export request: cardId=${cardId}, format=${format}, userId=${req.user?.id}`,
    );

    try {
      // Validate user
      if (!req.user?.id) {
        this.logger.warn('Export request without authenticated user');
        return res.status(HttpStatus.UNAUTHORIZED).json({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'User not authenticated',
          error: 'Unauthorized',
        });
      }

      // Validate format
      if (!['png', 'jpeg', 'pdf'].includes(format)) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: `Invalid format: ${format}. Must be one of: png, jpeg, pdf`,
          error: 'Bad Request',
        });
      }

      // Export card
      const result = await this.exportService.exportCard(
        cardId,
        req.user.id,
        format,
      );

      // Return file as download
      this.logger.log(
        `Returning file: ${result.filename}, size: ${result.size} bytes`,
      );
      
      res.setHeader('Content-Type', result.contentType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${result.filename}"`,
      );
      res.setHeader('Content-Length', result.size.toString());
      return res.send(result.fileBuffer);
    } catch (error: any) {
      this.logger.error(`Export failed for card ${cardId}:`, {
        message: error?.message,
        stack: error?.stack,
        status: error?.status,
      });

      // Determine status code
      const statusCode =
        error?.status || error?.getStatus?.() || HttpStatus.INTERNAL_SERVER_ERROR;

      // Extract error message
      let errorMessage = 'Internal server error';
      if (error?.getResponse) {
        const response = error.getResponse();
        errorMessage =
          typeof response === 'string'
            ? response
            : (response as any)?.message || error.message || errorMessage;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      // Return error as JSON
      return res.status(statusCode).json({
        statusCode,
        message: errorMessage,
        error: error?.name || 'Error',
      });
    }
  }
}
