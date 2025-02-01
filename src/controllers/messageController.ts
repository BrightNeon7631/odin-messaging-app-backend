import type { NextFunction, Request, Response } from 'express';
import * as db from '../db/queries';
import { body, validationResult } from 'express-validator';
import { UnauthorizedError, NotFoundError } from '../utils/CustomErrors';
import { User } from '@prisma/client';
import {
  convertArrayValuesToNumbers,
  removeDuplicatesFromArrays,
} from '../utils/helperFunctions';

export const validateMessage = [
  body('text')
    .optional()
    .isLength({ max: 10000 })
    .withMessage('Message text cannot exceed 10 000 characters.'),
  body('imgUrl')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Image URL cannot exceed 500 characters.'),
];

export const validateReadBy = [
  body('messageIds')
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
          'All messageIds array elements must be either a string or a number'
        );
      }
      return true;
    }),
];

export const createMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors);
  }

  const { text, imgUrl } = req.body;
  const conversationId = parseInt(req.params.conversationid, 10);

  try {
    const currentUser = req.user as User;
    const currentUserId = currentUser?.id;

    const conversation = await db.queryGetUserConversationById(
      currentUserId,
      conversationId
    );
    
    if (!conversation) {
      throw new NotFoundError(
        `404 - Either conversation with id ${conversationId} wasn't found or user with id ${currentUserId} is not part of this conversation`
      );
    }

    const message = await db.queryCreateMessage(
      currentUserId,
      conversationId,
      text,
      imgUrl
    );
    
    res.send(message);
  } catch (err) {
    next(err);
  }
};

export const updateMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors);
  }

  const { text, imgUrl } = req.body;
  const messageId = parseInt(req.params.id, 10);

  try {
    const currentUser = req.user as User;
    const currentUserId = currentUser?.id;

    const message = await db.queryGetMessage(messageId);
    
    if (!message) {
      throw new NotFoundError(
        `404 - Message with id ${messageId} wasn't found`
      );
    }

    if (message.senderId !== currentUserId) {
      throw new UnauthorizedError(
        `User is not authorized to make this request.`
      );
    }

    if (message.deleted) {
        throw new UnauthorizedError(
          `You can't edit a deleted message.`
        );
      }

    const updatedMessage = await db.queryUpdateMessage(messageId, {
      text,
      imgUrl,
    });

    res.send(updatedMessage);
  } catch (err) {
    next(err);
  }
};

export const markMessageAsDeleted = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors);
  }

  const messageId = parseInt(req.params.id, 10);

  try {
    const currentUser = req.user as User;
    const currentUserId = currentUser?.id;

    const message = await db.queryGetMessage(messageId);
    
    if (!message) {
      throw new NotFoundError(
        `404 - Message with id ${messageId} wasn't found`
      );
    }

    if (message.senderId !== currentUserId) {
      throw new UnauthorizedError(
        `User is not authorized to make this request.`
      );
    }

    const updatedMessage = await db.queryUpdateMessage(messageId, {
      deleted: true,
      text: null,
      imgUrl: null,
    });

    res.send(updatedMessage);
  } catch (err) {
    next(err);
  }
};

export const markMessagesAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors);
  }

  const { messageIds } = req.body;

  try {
    const currentUser = req.user as User;
    const currentUserId = currentUser?.id;
    const messageIdsInt = removeDuplicatesFromArrays(
      convertArrayValuesToNumbers(messageIds)
    );

    const updatedMessages = await db.queryMarkMessagesAsRead(
      currentUserId,
      messageIdsInt
    );

    res.send(updatedMessages);
  } catch (err) {
    next(err);
  }
};