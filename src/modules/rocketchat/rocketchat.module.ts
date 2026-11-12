import { Module } from '@nestjs/common';
import { RocketChatService } from './rocketchat.service';
import { ChatProvisioningService } from './chat-provisioning.service';
import { ChatNotificationService } from './chat-notification.service';

@Module({
  providers: [
    RocketChatService,
    ChatProvisioningService,
    ChatNotificationService,
  ],
  exports: [
    RocketChatService,
    ChatProvisioningService,
    ChatNotificationService,
  ],
})
export class RocketChatModule {}
