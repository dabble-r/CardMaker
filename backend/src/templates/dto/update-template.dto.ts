import { IsString, IsOptional, IsObject } from 'class-validator';

export class UpdateTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  frontJson?: any;

  @IsOptional()
  @IsObject()
  backJson?: any;
}

