import { Controller, Post, Param, Query, UseGuards, Request, HttpException, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ExportService } from './export.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('export')
@UseGuards(JwtAuthGuard)
export class ExportController {
  constructor(private exportService: ExportService) {}

  @Post('card/:id')
  async exportCard(
    @Param('id') id: string,
    @Query('format') format: 'png' | 'jpeg' | 'pdf' = 'png',
    @Request() req,
    @Res() res: Response,
  ) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'User not authenticated',
          error: 'Unauthorized',
        });
      }
      
      console.log('Export request received:', { cardId: id, format, userId: req.user.id });
      const result = await this.exportService.exportCard(id, req.user.id, format);
      console.log('Export successful:', { cardId: id, format, resultSize: result.size });
      
      // If result contains a file buffer (local mode), return it directly
      if (result.fileBuffer) {
        res.setHeader('Content-Type', result.contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
        res.setHeader('Content-Length', result.size);
        res.send(result.fileBuffer);
        return;
      }
      
      // Otherwise return JSON with URL (S3 mode)
      return res.json(result);
    } catch (error: any) {
      // Log full error details
      console.error('Export controller error - Full details:', {
        message: error?.message,
        name: error?.name,
        constructor: error?.constructor?.name,
        stack: error?.stack,
        status: error?.status,
        response: error?.response,
        isHttpException: error instanceof HttpException,
      });
      
      // Always return errors as JSON, not binary
      if (error instanceof HttpException) {
        const status = error.getStatus();
        const errorResponse = error.getResponse();
        const errorMessage = typeof errorResponse === 'string' 
          ? errorResponse 
          : (errorResponse as any)?.message || error.message || 'Internal server error';
        
        console.error('HttpException details:', { status, errorMessage, errorResponse });
        
        return res.status(status).json({
          statusCode: status,
          message: errorMessage,
          error: error.name || 'Error',
        });
      }
      
      // For non-HttpException errors, extract message
      const errorMessage = error?.message || error?.toString() || 'Failed to export card';
      console.error('Non-HttpException error:', { errorMessage, error });
      
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: errorMessage,
        error: 'Internal Server Error',
      });
    }
  }
}

