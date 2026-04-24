import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth';
import { regionsRouter } from './routes/regions';
import { postsRouter } from './routes/posts';
import { votesRouter } from './routes/votes';
import { moderationRouter } from './routes/moderation';
import { uploadRouter } from './routes/upload';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.APP_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth',       authRouter);
app.use('/api/regions',    regionsRouter);
app.use('/api/posts',      postsRouter);
app.use('/api/posts',      votesRouter);   // vote routes: /api/posts/:id/vote
app.use('/api/moderation', moderationRouter);
app.use('/api/upload',     uploadRouter);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Citizen Shield API listening on port ${PORT}`);
});
