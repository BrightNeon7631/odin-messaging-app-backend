import {
  Strategy as JwtStrategy,
  ExtractJwt,
  JwtFromRequestFunction,
} from 'passport-jwt';
import { queryGetUserById } from '../db/queries';
import { PassportStatic } from 'passport';
import * as dotenv from 'dotenv';

dotenv.config();

type jwtOptions = {
  jwtFromRequest: JwtFromRequestFunction;
  secretOrKey: string;
};

const options: jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET_KEY as string, // ensure this is a string
};

export const strategy = (passport: PassportStatic) => {
  passport.use(
    new JwtStrategy(options, async (jwt_payload, done) => {
      try {
        const user = await queryGetUserById(jwt_payload.id);
        if (!user) {
          return done(null, false, {
            message: `User with id: ${jwt_payload.id} doesn't exist.`,
          });
        } else {
          return done(null, user);
        }
      } catch (err) {
        return done(err, false);
      }
    })
  );
};
