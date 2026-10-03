import express, { Application } from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { swaggerSpec } from './config/swagger';
import apiRouter from './routes';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { processTelegramUpdate, setWebhook } from './services/telegramBot';

const app: Application = express();

// ─── Static Uploads Directory ───────────────────────────────────────────
app.use('/uploads', express.static(path.resolve(process.cwd(), env.uploadDir)));

// ─── Security Middleware ───────────────────────────────────────────────────────
// Helmet: Swagger UI uchun CSP ni yumshatamiz
app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);

app.use(
  cors({
    origin: (origin, callback) => {
      // In dev mode allow any localhost origin or no origin (Postman/curl), 
      // or if it matches any allowed clientUrls, or ends with .vercel.app, or local origins
      if (
        !origin || 
        env.isDev || 
        env.clientUrls.includes(origin) || 
        origin.endsWith('.vercel.app') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1')
      ) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
  }),
);

// ─── Body Parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Request Logging (Dev) ─────────────────────────────────────────────────────
if (env.isDev) {
  app.use((req, _res, next) => {
    console.log(`→ ${req.method} ${req.path}`);
    next();
  });
}

// ─── Swagger Docs ─────────────────────────────────────────────────────────────
app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'Tripuz API Docs',
    customCss: `
      .swagger-ui .topbar { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
      .swagger-ui .topbar-wrapper img { content: url('https://ui-avatars.com/api/?name=Tripuz&background=6366f1&color=fff&size=40'); }
      .swagger-ui .info .title { color: #4f46e5; font-size: 2rem; }
      .swagger-ui .scheme-container { background: #f8fafc; }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true,
    },
  }),
);
// Raw JSON spec endpoint
app.get('/api/docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

import { languageMiddleware } from './middlewares/language.middleware';

// ─── Language Middleware ────────────────────────────────_______________________
app.use(languageMiddleware);

// ─── Telegram Webhook (no auth — Telegram servers only) ───────────────────────
app.post('/telegram-webhook', (req, res) => {
  processTelegramUpdate(req.body);
  res.sendStatus(200);
});

// ─── API Routes ────────────────────────────────────────────────────────────────
app.use('/api', apiRouter);

// ─── 404 & Error Handlers ─────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Telegram Webhook Setup (production) ──────────────────────────────────────
if (env.isProd) {
  setWebhook();
}

export default app;