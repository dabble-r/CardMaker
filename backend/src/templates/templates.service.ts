import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';

@Injectable()
export class TemplatesService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId?: string, includeDefaults: boolean = true) {
    const where: any = {};

    if (userId) {
      where.OR = [
        { userId },
        ...(includeDefaults ? [{ isDefault: true }] : []),
      ];
    } else if (includeDefaults) {
      where.isDefault = true;
    }

    return this.prisma.template.findMany({
      where,
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async findOne(id: string) {
    const template = await this.prisma.template.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    return template;
  }

  async create(userId: string, createTemplateDto: CreateTemplateDto) {
    return this.prisma.template.create({
      data: {
        name: createTemplateDto.name,
        description: createTemplateDto.description,
        frontJson: createTemplateDto.frontJson as any,
        backJson: createTemplateDto.backJson as any,
        userId,
      },
    });
  }

  async update(id: string, userId: string, updateTemplateDto: UpdateTemplateDto) {
    const template = await this.findOne(id);

    // Check if user owns the template or if it's a default template
    if (template.userId !== userId && template.isDefault) {
      throw new ForbiddenException('Cannot update default templates');
    }

    if (template.userId !== userId) {
      throw new ForbiddenException('You do not have permission to update this template');
    }

    return this.prisma.template.update({
      where: { id },
      data: {
        ...(updateTemplateDto.name && { name: updateTemplateDto.name }),
        ...(updateTemplateDto.description !== undefined && { description: updateTemplateDto.description }),
        ...(updateTemplateDto.frontJson && { frontJson: updateTemplateDto.frontJson as any }),
        ...(updateTemplateDto.backJson && { backJson: updateTemplateDto.backJson as any }),
      },
    });
  }

  async remove(id: string, userId: string) {
    const template = await this.findOne(id);

    if (template.isDefault) {
      throw new ForbiddenException('Cannot delete default templates');
    }

    if (template.userId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this template');
    }

    return this.prisma.template.delete({
      where: { id },
    });
  }
}

