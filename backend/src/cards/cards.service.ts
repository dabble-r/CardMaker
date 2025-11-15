import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';

@Injectable()
export class CardsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.card.findMany({
      where: { userId },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, userId: string) {
    const card = await this.prisma.card.findUnique({
      where: { id },
      include: {
        template: true,
      },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    if (card.userId !== userId) {
      throw new ForbiddenException('You do not have permission to view this card');
    }

    return card;
  }

  async create(userId: string, createCardDto: CreateCardDto) {
    // Verify template exists
    const template = await this.prisma.template.findUnique({
      where: { id: createCardDto.templateId },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    return this.prisma.card.create({
      data: {
        userId,
        templateId: createCardDto.templateId,
        cardDataJson: createCardDto.cardDataJson as unknown as Prisma.InputJsonValue,
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });
  }

  async update(id: string, userId: string, updateCardDto: UpdateCardDto) {
    const card = await this.findOne(id, userId);

    if (updateCardDto.templateId) {
      // Verify new template exists
      const template = await this.prisma.template.findUnique({
        where: { id: updateCardDto.templateId },
      });

      if (!template) {
        throw new NotFoundException('Template not found');
      }
    }

    return this.prisma.card.update({
      where: { id },
      data: {
        ...(updateCardDto.templateId && { templateId: updateCardDto.templateId }),
        ...(updateCardDto.cardDataJson && { cardDataJson: updateCardDto.cardDataJson as any }),
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.card.delete({
      where: { id },
    });
  }

  async duplicate(id: string, userId: string) {
    const card = await this.findOne(id, userId);

    return this.prisma.card.create({
      data: {
        userId,
        templateId: card.templateId,
        cardDataJson: card.cardDataJson as Prisma.InputJsonValue,
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });
  }
}

