import { Router } from 'express';
import * as messageController from '../controllers/messageController';
import passport from 'passport';

export const messageRouter = Router();

// member (of a conversation)
messageRouter.post(
  '/conversation/:conversationid',
  passport.authenticate('jwt', { session: false }),
  messageController.validateMessage,
  messageController.createMessage
);

// same user
messageRouter.patch(
  '/:id/edit',
  passport.authenticate('jwt', { session: false }),
  messageController.validateMessage,
  messageController.updateMessage
);

// same user
messageRouter.patch(
  '/:id/delete',
  passport.authenticate('jwt', { session: false }),
  messageController.markMessageAsDeleted
);

// same user
messageRouter.patch(
  '/markread',
  passport.authenticate('jwt', { session: false }),
  messageController.validateReadBy,
  messageController.markMessagesAsRead
);
