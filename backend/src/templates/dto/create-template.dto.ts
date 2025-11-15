import { IsString, IsOptional, IsObject } from 'class-validator';

export class CreateTemplateDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsObject()
  frontJson: any;

  @IsObject()
  backJson: any;
}

