import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConversationDto {
  @ApiProperty({
    description: 'Array of user IDs to include in the conversation',
    example: ['user-id-1', 'user-id-2'],
  })
  @IsArray()
  @IsString({ each: true })
  participantIds: string[];

  @ApiProperty({
    description: 'Whether this is a group conversation',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isGroup?: boolean;

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
}
