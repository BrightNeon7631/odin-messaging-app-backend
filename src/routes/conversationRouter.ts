import { Router } from 'express';
import * as conversationController from '../controllers/conversationController';
import passport from 'passport';
import { isSameUser } from '../utils/auth';

export const conversationRouter = Router();

// same user
conversationRouter.get(
  '/user/:userid',
  passport.authenticate('jwt', { session: false }),
  isSameUser,
  conversationController.getUserConversations
);

// same user
conversationRouter.get(
  '/:conversationid/user/:userid',
  passport.authenticate('jwt', { session: false }),
  isSameUser,
  conversationController.getUserConversation
);

// member
conversationRouter.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  conversationController.validateConversation,
  conversationController.createConversation
);

// admin of a group conversation
conversationRouter.patch(
  '/:id/info',
  passport.authenticate('jwt', { session: false }),
  conversationController.validateConversationUpdateTitleImg,
  conversationController.updateTitleAndImage
);

// admin of a group conversation
conversationRouter.delete(
  '/:id/delete',
  passport.authenticate('jwt', { session: false }),
  conversationController.deleteConversation
);

// member of a group conversation
conversationRouter.patch(
  '/:id/leave',
  passport.authenticate('jwt', { session: false }),
  conversationController.leaveGroup
);

// admin of a group conversation
conversationRouter.patch(
  '/:conversationid/user/:userid/remove',
  passport.authenticate('jwt', { session: false }),
  conversationController.removeUserFromGroup
);

// admin of a group conversation
conversationRouter.patch(
  '/:conversationid/user/:userid/add',
  passport.authenticate('jwt', { session: false }),
  conversationController.addUserToGroup
);

// admin of a group conversation
conversationRouter.patch(
  '/:conversationid/user/:userid/admingive',
  passport.authenticate('jwt', { session: false }),
  conversationController.grantUserAdminStatus
);

// admin of a group conversation
conversationRouter.patch(
  '/:conversationid/user/:userid/adminremove',
  passport.authenticate('jwt', { session: false }),
  conversationController.removeUserAdminStatus
);
