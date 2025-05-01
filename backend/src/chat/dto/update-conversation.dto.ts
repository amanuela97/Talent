import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateConversationDto {
  @ApiProperty({
    description: 'Optional name for group conversations',
    example: 'Project Team',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Optional image URL for group conversations',
    example: 'https://example.com/group-image.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  groupImage?: string;

  @ApiProperty({
    description: 'Whether this is a group conversation',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isGroup?: boolean;
}
