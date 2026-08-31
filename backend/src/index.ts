import express from 'express';
import cors from 'cors';
import clubRoutes from './routes/clubs';
import memberRoutes from './routes/members';
import eventRoutes from './routes/events';
import taskRoutes from './routes/tasks';
import meetingRoutes from './routes/meetings';
import generalRoutes from './routes/general';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// Routes
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/clubs', clubRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/general', generalRoutes);

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`ClubOps AI Backend running on port ${PORT}`);
});

export default app;