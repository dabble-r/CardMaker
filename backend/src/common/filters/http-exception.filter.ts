import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | object = 'Internal server error';
    
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        // Extract message from the response object
        message = (exceptionResponse as any).message || 
                  (exceptionResponse as any).error || 
                  JSON.stringify(exceptionResponse);
      } else {
        message = exception.message || 'Internal server error';
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const errorDetails = {
      status,
      message: typeof message === 'string' ? message : JSON.stringify(message),
      path: request.url,
      method: request.method,
      stack: exception instanceof Error ? exception.stack : undefined,
      exceptionType: exception?.constructor?.name,
    };

    console.error('Exception caught by filter:', errorDetails);

    // Don't override response if it's already been sent (when using @Res())
    if (!response.headersSent) {
      response.status(status).json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        message: typeof message === 'string' ? message : (message as any).message || 'Internal server error',
        error: exception instanceof HttpException ? exception.name : 'Error',
      });
    }
  }
}

