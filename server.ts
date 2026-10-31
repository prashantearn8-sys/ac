import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { processSendEmailRequest } from './src/server/sendEmailCore.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '16kb' }));

  app.post('/api/send-email', async (req, res) => {
    try {
      const clientIp =
        req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
        req.socket.remoteAddress ||
        'unknown';
      const result = await processSendEmailRequest(req.body, clientIp);
      return res.status(result.statusCode).json(result.payload);
    } catch (error) {
      return res.status(500).json({
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to send email notification',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cool Bros AC Service server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
