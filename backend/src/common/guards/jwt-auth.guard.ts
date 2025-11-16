import { Injectable, ExecutionContext, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    this.logger.log(`JWT Guard checking: ${request.method} ${request.url}`);
    this.logger.debug(`Authorization header: ${request.headers.authorization ? 'present' : 'missing'}`);
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    if (err) {
      this.logger.error(`JWT Guard error: ${err.message}`, err.stack);
      throw err;
    }
    if (!user) {
      this.logger.warn(`JWT Guard: No user found. Info: ${info?.message || JSON.stringify(info)}`);
    } else {
      this.logger.log(`JWT Guard: User authenticated - ${user.id}`);
    }
    return user;
  }
}

