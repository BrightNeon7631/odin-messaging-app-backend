import type { NextFunction, Request, Response } from 'express';
import * as db from '../db/queries';
import { body, validationResult } from 'express-validator';
import { UnauthorizedError, NotFoundError } from '../utils/CustomErrors';
import { User } from '@prisma/client';
import {
  convertArrayValuesToNumbers,
  removeDuplicatesFromArrays,
} from '../utils/helperFunctions';

export const validateConversation = [
  body('name')
    .optional()
    .isLength({ max: 30 })
    .withMessage('Group name cannot exceed 30 characters.'),
  body('imgUrl')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Image URL cannot exceed 500 characters.'),
  body('userIds')
    .isArray()
    .withMessage('Must be an array')
    .custom((value) => {
      // check if every element in the array is a number or string
      if (
        !value.every(
          (item: unknown) =>
            typeof item === 'number' || typeof item === 'string'
        )
      ) {
        throw new Error(
          'All userIds array elements must be either a string or a number'
        );
      }
      return true; // indicates the validation passed
    }),
  body('adminIds')
    .optional()
    .isArray()
    .withMessage('Must be an array')
    .custom((value) => {
      if (
        !value.every(
          (item: unknown) =>
            typeof item === 'number' || typeof item === 'string'
        )
      ) {
        throw new Error(
          'All adminIds array elements must be either a string or a number'
        );
      }
      return true;
    }),
];

export const validateConversationUpdateTitleImg = [
  body('name')
    .optional()
    .isLength({ max: 30 })
    .withMessage('Group name cannot exceed 30 characters.'),
  body('imgUrl')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Image URL cannot exceed 500 characters.'),
];

// with most recent messages
export const getUserConversations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = parseInt(req.params.userid, 10);
  try {
    const user = await db.queryGetUserById(userId);
    if (!user) {
      throw new NotFoundError(`404 - User with id ${userId} wasn't found`);
    }
    const conversations = await db.queryGetUserConversations(userId);
    res.send(conversations);
  } catch (err) {
    next(err);
  }
};

// single conversation with all the data including messages
export const getUserConversation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = parseInt(req.params.userid, 10);
  const conversationId = parseInt(req.params.conversationid, 10);
  try {
    // checking is user exists is unnecessary, because it's a protected function that only a logged in user can access
    const conversation = await db.queryGetUserConversation(
      userId,
      conversationId
    );
    if (!conversation) {
      throw new NotFoundError(
        `404 - Conversation with id ${conversationId} for user with id ${userId} wasn't found`
      );
    }
    res.send(conversation);
  } catch (err) {
    next(err);
  }
};

export const createConversation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors);
  }
  const { name, imgUrl, adminIds, userIds } = req.body;

  try {
    const currentUser = req.user as User;
    const userIdsInt = removeDuplicatesFromArrays(
      convertArrayValuesToNumbers(userIds)
    );

    if (userIdsInt.length < 2) {
      throw new Error(
        'There have to be at least two users to create a conversation'
      );
    }

    // the array of users ids must contain the id of the user creating a conversation
    if (!userIdsInt.includes(currentUser?.id)) {
      throw new Error(
        'userIds array must contain the id of the user creating a conversation'
      );
    }

    const adminIdsInt = adminIds
      ? removeDuplicatesFromArrays(convertArrayValuesToNumbers(adminIds))
      : [];

    // admin ids array must contain the id of the user creating a group conversation (with more than 2 users)
    // admin array remains empty if there are only two users in a conversation
    if (userIdsInt.length > 2 && !adminIdsInt.includes(currentUser?.id)) {
      throw new Error(
        'adminIds array must contain the id of the user creating a conversation'
      );
    }

    // check if all values of the adminIdsInt are contained within the userIdsInt array
    // it doesn't make sense to have admins that are outside of the group conversation
    const containsAllValues = adminIdsInt.every((value: number) =>
      userIdsInt.includes(value)
    );

    if (!containsAllValues) {
      throw new Error('User IDs do not match the Admin IDs');
    }

    // checks if all user ids actually exist
    // this approach allows to await each asynchronous call sequentially
    for (const id of userIds) {
      const user = await db.queryGetUserById(id);
      if (!user) {
        throw new NotFoundError(`404 - User with id ${id} wasn't found`);
      }
    }

    // there are no admins and the group property is set to 'false' if only two users are in a conversation
    const isGroupValue = userIdsInt.length > 2 ? true : false;
    const adminIdsValue: number[] = userIdsInt.length > 2 ? adminIdsInt : [];

    const conversation = await db.queryCreateConversation({
      name,
      imgUrl,
      isGroup: isGroupValue,
      adminIds: adminIdsValue,
      userIds: userIdsInt,
    });
    return res.send(conversation);
  } catch (err) {
    next(err);
  }
};

export const updateTitleAndImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors);
  }
  const conversationId = parseInt(req.params.id, 10);
  const { name, imgUrl } = req.body;

  try {
    const currentUser = req.user as User;
    const conversation = await db.queryGetConversationById(conversationId);

    if (!conversation) {
      throw new NotFoundError(
        `404 - Conversation with id ${conversationId} wasn't found`
      );
    }

    // data can only be edited by the group's admin
    const isCurrentUserAdmin = conversation.admins.some(
      (admin) => admin.id === currentUser?.id
    );

    if (!isCurrentUserAdmin) {
      throw new UnauthorizedError(
        `User with id ${currentUser?.id} is not an admin of this group conversation`
      );
    }

    const updatedConversation = await db.queryUpdateConversationTitleAndImage(
      conversationId,
      { name, imgUrl }
    );
    res.send(updatedConversation);
  } catch (err) {
    next(err);
  }
};

export const leaveGroup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const currentUser = req.user as User;
  const userId = currentUser?.id;
  const conversationId = parseInt(req.params.id, 10);

  try {
    const conversation = await db.queryGetUserConversationById(
      userId,
      conversationId
    );

    if (!conversation) {
      throw new NotFoundError(
        `404 - Either conversation with id ${conversationId} wasn't found or user with id ${userId} is not part of this group conversation`
      );
    }

    if (!conversation.isGroup) {
      throw new Error(`This is not a group conversation`);
    }

    // admin should not be able to leave a group if they're the only admin left and there are still other non-admin users
    const isCurrentUserAdmin = conversation.admins.find(
      (admin) => admin.id === userId
    );

    if (
      isCurrentUserAdmin &&
      conversation.admins.length === 1 &&
      conversation.users.length > 1
    ) {
      throw new Error(
        `You're trying to leave the group as the only admin user. Try granting admin rights to another user before leaving the group.`
      );
    }

    await db.queryRemoveUserFromGroupConversation(userId, conversationId);
    res.send({ message: 'You left the group conversation.' });
  } catch (err) {
    next(err);
  }
};

export const removeUserFromGroup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const currentUser = req.user as User;
  const currentUserId = currentUser?.id;
  const userId = parseInt(req.params.userid, 10);
  const conversationId = parseInt(req.params.conversationid, 10);

  try {
    if (currentUserId === userId) {
      throw new Error(
        `You can't leave the group this way. Use a different endpoint.`
      );
    }

    const conversation = await db.queryGetUserConversationById(
      userId,
      conversationId
    );
    
    if (!conversation) {
      throw new NotFoundError(
        `404 - Either conversation with id ${conversationId} wasn't found or user with id ${userId} is not part of this group conversation`
      );
    }

    if (!conversation.isGroup) {
      throw new Error(`This is not a group conversation`);
    }

    const isCurrentUserAdmin = conversation.admins.find(
      (admin) => admin.id === currentUserId
    );

    if (!isCurrentUserAdmin) {
      throw new UnauthorizedError(
        `Only admins have permission to remove users.`
      );
    }

    const updatedConversation = await db.queryRemoveUserFromGroupConversation(
      userId,
      conversationId
    );
    res.send(updatedConversation);
  } catch (err) {
    next(err);
  }
};

export const addUserToGroup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const currentUser = req.user as User;
  const currentUserId = currentUser?.id;
  const userId = parseInt(req.params.userid, 10);
  const conversationId = parseInt(req.params.conversationid, 10);

  try {
    const conversation = await db.queryGetUserConversationById(
      currentUserId,
      conversationId
    );
    
    if (!conversation) {
      throw new NotFoundError(
        `404 - Either conversation with id ${conversationId} wasn't found or admin with id ${currentUserId} is not part of this group conversation`
      );
    }

    if (!conversation.isGroup) {
      throw new Error(`This is not a group conversation`);
    }

    const isCurrentUserAdmin = conversation.admins.find(
      (admin) => admin.id === currentUserId
    );

    if (!isCurrentUserAdmin) {
      throw new UnauthorizedError(`Only admins have permission to add users.`);
    }

    const isUserInGroup = conversation.users.find((user) => user.id === userId);
    if (isUserInGroup) {
      throw new Error(`This user is already in this group.`);
    }

    const updatedConversation = await db.queryAddUserToGroupConversation(
      userId,
      conversationId
    );
    res.send(updatedConversation);
  } catch (err) {
    next(err);
  }
};

export const grantUserAdminStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const currentUser = req.user as User;
  const currentUserId = currentUser?.id;
  const userId = parseInt(req.params.userid, 10);
  const conversationId = parseInt(req.params.conversationid, 10);

  try {
    const conversation = await db.queryGetUserConversationById(
      userId,
      conversationId
    );
    
    if (!conversation) {
      throw new NotFoundError(
        `404 - Either conversation with id ${conversationId} wasn't found or user with id ${userId} is not part of this group conversation`
      );
    }

    if (!conversation.isGroup) {
      throw new Error(`This is not a group conversation`);
    }

    const isCurrentUserAdmin = conversation.admins.find(
      (admin) => admin.id === currentUserId
    );

    if (!isCurrentUserAdmin) {
      throw new UnauthorizedError(
        `Only admins have permission to grant admin status to users`
      );
    }

    const isUserAlreadyAdmin = conversation.admins.find(
      (admin) => admin.id === userId
    );
    
    if (isUserAlreadyAdmin) {
      throw new Error(`This user is already an admin`);
    }

    const updatedConversation = await db.queryGrantUserAdminStatus(
      userId,
      conversationId
    );
    res.send(updatedConversation);
  } catch (err) {
    next(err);
  }
};

export const removeUserAdminStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const currentUser = req.user as User;
  const currentUserId = currentUser?.id;
  const userId = parseInt(req.params.userid, 10);
  const conversationId = parseInt(req.params.conversationid, 10);

  try {
    // and there has to be at least one admin left
    if (currentUserId === userId) {
      throw new Error(`You can't remove admin status for yourself`);
    }

    const conversation = await db.queryGetUserConversationById(
      userId,
      conversationId
    );
    
    if (!conversation) {
      throw new NotFoundError(
        `404 - Either conversation with id ${conversationId} wasn't found or user with id ${userId} is not part of this group conversation`
      );
    }

    if (!conversation.isGroup) {
      throw new Error(`This is not a group conversation`);
    }

    const isCurrentUserAdmin = conversation.admins.find(
      (admin) => admin.id === currentUserId
    );

    if (!isCurrentUserAdmin) {
      throw new UnauthorizedError(
        `Only admins have permission to remove user admin status`
      );
    }

    const isUserAdmin = conversation.admins.find(
      (admin) => admin.id === userId
    );

    if (!isUserAdmin) {
      throw new Error(`This user is already not an admin`);
    }

    // most likely unnecessary since admins cannot remove themselves
    if (conversation.admins.length === 1) {
      throw new Error(`There must be at least one admin in a group conversation`);
    }

    const updatedConversation = await db.queryRemoveUserAdminStatus(
      userId,
      conversationId
    );
    res.send(updatedConversation);
  } catch (err) {
    next(err);
  }
};

export const deleteConversation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const currentUser = req.user as User;
  const currentUserId = currentUser?.id;
  const conversationId = parseInt(req.params.id, 10);

  try {
    const conversation = await db.queryGetUserConversationById(
      currentUserId,
      conversationId
    );
    
    if (!conversation) {
      throw new NotFoundError(
        `404 - Either conversation with id ${conversationId} wasn't found or user with id ${currentUserId} is not part of this group conversation`
      );
    }

    if (!conversation.isGroup) {
      throw new Error(`You can only delete a group conversation`);
    }

    const isCurrentUserAdmin = conversation.admins.find(
      (admin) => admin.id === currentUserId
    );

    if (!isCurrentUserAdmin) {
      throw new UnauthorizedError(
        `Only admins have permission to delete group conversations`
      );
    }

    await db.queryDeleteConversation(conversationId);
    res.send({ message: 'Conversation was deleted' });
  } catch (err) {
    next(err);
  }
};
