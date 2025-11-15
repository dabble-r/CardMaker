import { IsString, IsObject, IsOptional } from 'class-validator';
import type { CardData } from '../interfaces/card-data.interface';

export class UpdateCardDto {
  @IsOptional()
  @IsString()
  templateId?: string;

  @IsOptional()
  @IsObject()
  cardDataJson?: CardData;
}

