import * as dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import passport from 'passport';
import type { NextFunction, Request, Response } from 'express';
import { CustomError } from './utils/CustomErrors';
import { userRouter } from './routes/userRouter';
import { conversationRouter } from './routes/conversationRouter';
import { messageRouter } from './routes/messageRouter';
import { strategy } from './config/passport';

dotenv.config();
// exits with error 1 if there's no defined port in .env
if (!process.env.SERVER_PORT) {
  process.exit(1);
}
const PORT: number = parseInt(process.env.SERVER_PORT as string, 10);

const app = express();
// calling the (jwt) strategy function, passing in the passport instance
strategy(passport);
app.use(cors());
app.use(helmet());
app.disable('x-powered-by');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // limit to 100 requests per `window`
    standardHeaders: 'draft-7',
    legacyHeaders: false, // disable the `X-RateLimit-*` headers
  })
);

app.use('/api/user', userRouter);
app.use('/api/conversation', conversationRouter);
app.use('/api/message', messageRouter);

app.use('*', (req: Request, res: Response) => {
  res.send({ error: '404 - resource not found' });
});

// catch-all error handling middleware
app.use((err: CustomError, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).send({ error: err.message });
});

app.listen(PORT, () => console.log(`server running on port: ${PORT}`));
