import { IsString, IsObject } from 'class-validator';
import type { CardData } from '../interfaces/card-data.interface';

export class CreateCardDto {
  @IsString()
  templateId: string;

  @IsObject()
  cardDataJson: CardData;
}

