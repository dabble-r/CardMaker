import express from 'express';
import cors from 'cors';
import { renderCard } from './renderer/renderer';

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Root route
app.get('/', (req, res) => {
  res.json({ 
    service: 'Baseball Card Rendering Service',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      render: 'POST /render',
    },
  });
});

app.post('/render', async (req, res) => {
  try {
    const { template, cardData, format = 'png' } = req.body;

    if (!template || !cardData) {
      return res.status(400).json({ error: 'Missing template or cardData' });
    }

    const result = await renderCard(template, cardData, format);

    res.setHeader('Content-Type', getContentType(format));
    res.send(result);
  } catch (error) {
    console.error('Rendering error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to render card', message: errorMessage });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

function getContentType(format: string): string {
  switch (format) {
    case 'png':
      return 'image/png';
    case 'jpeg':
      return 'image/jpeg';
    case 'pdf':
      return 'application/pdf';
    default:
      return 'application/octet-stream';
  }
}

app.listen(PORT, () => {
  console.log(`Rendering service listening on port ${PORT}`);
});

