import { sign } from 'jsonwebtoken';
import { UnauthorizedError } from './CustomErrors';
import * as dotenv from 'dotenv';
import { User } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';

dotenv.config();

export const issueJWT = (user: User) => {
  const expiresIn = '10d';

  const payload = {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    imgUrl: user.imgUrl,
    about: user.about,
    createdAt: user.createdAt,
  };

  const signedToken = sign(payload, process.env.JWT_SECRET_KEY as string, {
    expiresIn: expiresIn,
  });

  return {
    token: 'Bearer ' + signedToken,
    expires: expiresIn,
  };
};

export const isSameUser = (req: Request, res: Response, next: NextFunction) => {
  // params in routes must be either :id or :userid
  const userId = parseInt(req.params.id, 10) | parseInt(req.params.userid, 10);
  
  // must use 'as User' syntax; otherwise there'd be a "Property 'id' does not exist on type 'User'" error
  const currentUser = req.user as User;
  if (currentUser?.id !== userId) {
    throw new UnauthorizedError('User is not authorized to make this request.');
  }
  next();
};
