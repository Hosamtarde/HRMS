import { Module } from '@nestjs/common';
import { RocketChatService } from './rocketchat.service';
import { ChatProvisioningService } from './chat-provisioning.service';

@Module({
  providers: [RocketChatService, ChatProvisioningService],
  exports: [RocketChatService, ChatProvisioningService],
})
export class RocketChatModule {}
