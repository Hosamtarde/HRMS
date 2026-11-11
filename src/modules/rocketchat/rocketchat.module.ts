import { Module } from '@nestjs/common';
import { RocketChatService } from './rocketchat.service';

@Module({
  providers: [RocketChatService],
  exports: [RocketChatService],
})
export class RocketChatModule {}
