import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CardsService } from './cards.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('cards')
@UseGuards(JwtAuthGuard)
export class CardsController {
  constructor(private cardsService: CardsService) {}

  @Get()
  async findAll(@Request() req) {
    return this.cardsService.findAll(req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    return this.cardsService.findOne(id, req.user.id);
  }

  @Post()
  async create(@Request() req, @Body() createCardDto: CreateCardDto) {
    return this.cardsService.create(req.user.id, createCardDto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateCardDto: UpdateCardDto,
  ) {
    return this.cardsService.update(id, req.user.id, updateCardDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    return this.cardsService.remove(id, req.user.id);
  }

  @Post(':id/duplicate')
  async duplicate(@Param('id') id: string, @Request() req) {
    return this.cardsService.duplicate(id, req.user.id);
  }
}

