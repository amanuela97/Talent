import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMessageDto {
  @ApiProperty({
    description: 'Content of the message',
    example: 'Hello, how are you doing?',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    description: 'ID of the conversation',
    example: 'conversation-id-1',
  })
  @IsString()
  @IsNotEmpty()
  conversationId: string;

  @ApiProperty({
    description: 'ID of the sender',
    example: 'sender-id-1',
  })
  @IsString()
  @IsOptional()
  senderId?: string;

  // The senderId will be extracted from JWT
}
