import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import apiRoutes from './routes';

const app = express();

// Middlewares básicos
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Rate limiting simple (aplica a toda la API)
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 100 });
app.use('/api', limiter);

// Rutas raíz
app.get('/', (_req, res) => {
  res.json({ message: 'Qualifica o seu Professor - API' });
});
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});


app.use('/api', apiRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: 'Not Found' });
});


app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  if (res.headersSent) return;
  res.status(err?.status || 500).json({ message: err?.message || 'Internal Server Error' });
});

export default app;
