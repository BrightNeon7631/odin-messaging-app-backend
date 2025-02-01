import type { NextFunction, Request, Response } from 'express';
import * as db from '../db/queries';
import bcrypt from 'bcryptjs';
import { validationResult, body } from 'express-validator';
import { UnauthorizedError, NotFoundError } from '../utils/CustomErrors';
import { Prisma } from '@prisma/client';
import { issueJWT } from '../utils/auth';

export const validateUser = [
  body('firstName')
    .isLength({ min: 3, max: 30 })
    .withMessage('First name must be between 3 and 30 characters.'),
  body('lastName')
    .optional()
    .isLength({ max: 30 })
    .withMessage('Last name cannot exceed 30 characters.'),
  body('email')
    .trim()
    .isEmail()
    .isLength({ min: 3, max: 100 })
    .withMessage('Email must be between 3 and 30 characters.'),
  body('password')
    .trim()
    .isLength({ min: 6, max: 100 })
    .withMessage('Password must be between 6 and 100 characters.'),
  body('imgUrl')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Image URL cannot exceed 500 characters.'),
  body('about')
    .optional()
    .isLength({ max: 120 })
    .withMessage('About cannot exceed 120 characters.'),
];

export const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .isLength({ min: 3, max: 100 })
    .withMessage('Email must be between 3 and 30 characters.'),
  body('password')
    .trim()
    .isLength({ min: 6, max: 100 })
    .withMessage('Password must be between 6 and 100 characters.'),
];

export const validateUserUpdate = [
  body('firstName')
    .optional()
    .isLength({ min: 3, max: 30 })
    .withMessage('First name must be between 3 and 30 characters.'),
  body('lastName')
    .optional()
    .isLength({ max: 30 })
    .withMessage('Last name cannot exceed 30 characters.'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .isLength({ min: 3, max: 100 })
    .withMessage('Email must be between 3 and 30 characters.'),
  body('password')
    .optional()
    .trim()
    .isLength({ min: 6, max: 100 })
    .withMessage('Password must be between 6 and 100 characters.'),
  body('imgUrl')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Image URL cannot exceed 500 characters.'),
  body('about')
    .optional()
    .isLength({ max: 120 })
    .withMessage('About cannot exceed 120 characters.'),
];

// get all users but without login data (like email and password)
export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const users = await db.queryGetUsers();
    res.send(users);
  } catch (err) {
    next(err);
  }
};

// either by first or last name
export const getUsersByName = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userName = req.params.name;
    const users = await db.queryGetUsersByName(userName);
    res.send(users);
  } catch (err) {
    next(err);
  }
};

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors);
  }
  const { firstName, lastName, email, password, imgUrl, about } = req.body;
  bcrypt.hash(password, 10, async (err, hashedPassword) => {
    if (err) {
      next(err);
    } else {
      try {
        const newUser = await db.queryCreateUser({
          firstName,
          lastName,
          email,
          password: hashedPassword,
          imgUrl,
          about,
        });
        const jwt = issueJWT(newUser);
        res.send({ token: jwt.token });
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
          if (err.code === 'P2002') {
            next(new Error('User with this email already exists'));
          } else {
            next(err);
          }
        }
      }
    }
  });
};

export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors);
  }
  const { email, password } = req.body;

  try {
    const user = await db.queryGetUserByEmail(email);
    if (!user) {
      throw new NotFoundError(`User with email: ${email} wasn't found`);
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedError('The password is incorrect.');
    }
    const jwt = issueJWT(user);
    res.send({ token: jwt.token });
  } catch (err) {
    next(err);
  }
};

export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors);
  }
  const userId = parseInt(req.params.id, 10);
  const { firstName, lastName, email, password, imgUrl, about } = req.body;

  if (password) {
    bcrypt.hash(password, 10, async (err, hashedPassword) => {
      if (err) {
        next(err);
      } else {
        try {
          await db.queryUpdateUser(userId, {
            firstName,
            lastName,
            email,
            password: hashedPassword,
            imgUrl,
            about,
          });
          res.send({ message: 'Password has been changed.' })
        } catch (err) {
          if (err instanceof Prisma.PrismaClientKnownRequestError) {
            if (err.code === 'P2002') {
              next(new Error('User with this email already exists'));
            } else {
              next(err);
            }
          }
        }
      }
    });
  } else {
    try {
      const updatedUser = await db.queryUpdateUser(userId, {
        firstName,
        lastName,
        email,
        imgUrl,
        about,
      });
      if (updatedUser) {
        const jwt = issueJWT(updatedUser);
        res.send({ token: jwt.token });
      }
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
          next(new Error('User with this email already exists'));
        } else {
          next(err);
        }
      }
    }
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = parseInt(req.params.id, 10);
  try {
    await db.queryDeleteUser(userId);
    res.send({ message: `User with id: ${userId} was deleted` });
  } catch (err) {
    next(err);
  }
};
