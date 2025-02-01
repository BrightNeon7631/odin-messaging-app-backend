import { Router } from 'express';
import * as userController from '../controllers/userController';
import passport from 'passport';
import { isSameUser } from '../utils/auth';

export const userRouter = Router();

// all
userRouter.post('/signup', userController.validateUser, userController.createUser);

// all
userRouter.post('/login', userController.validateLogin, userController.loginUser);

// member
userRouter.get(
  '/',
  passport.authenticate('jwt', { session: false }),
  userController.getUsers
);

// member
userRouter.get(
  '/name/:name',
  passport.authenticate('jwt', { session: false }),
  userController.getUsersByName
);

// same user
userRouter.patch(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  isSameUser,
  userController.validateUserUpdate,
  userController.updateUser
);

// same user
userRouter.delete(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  isSameUser,
  userController.deleteUser
);

// protected routes use passport.authenticate('jwt', { session: false }) to protect the route.
// If the JWT is valid, the user will be available in req.user.