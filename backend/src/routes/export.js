const express = require('express');
const axios = require('axios');
const Card = require('../models/Card');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Export card
router.get('/card/:id', async (req, res) => {
  try {
    const cardId = req.params.id;
    const format = req.query.format || 'png';

    if (!['png', 'jpeg', 'pdf'].includes(format)) {
      return res.status(400).json({ message: 'Invalid format. Must be png, jpeg, or pdf' });
    }

    // Fetch card with template
    const card = await Card.findById(cardId).populate('templateId');
    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    if (card.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You do not have permission to export this card' });
    }

    // Parse JSON data
    const frontJson = typeof card.templateId.frontJson === 'string'
      ? JSON.parse(card.templateId.frontJson)
      : card.templateId.frontJson;

    const backJson = typeof card.templateId.backJson === 'string'
      ? JSON.parse(card.templateId.backJson)
      : card.templateId.backJson;

    const cardDataJson = typeof card.cardDataJson === 'string'
      ? JSON.parse(card.cardDataJson)
      : card.cardDataJson;

    // Normalize dimensions to ensure front and back are identical in size
    // Use the maximum width and height from both layouts
    const frontWidth = frontJson.width || 630;
    const frontHeight = frontJson.height || 880;
    const backWidth = backJson.width || 630;
    const backHeight = backJson.height || 880;
    
    const normalizedWidth = Math.max(frontWidth, backWidth);
    const normalizedHeight = Math.max(frontHeight, backHeight);
    
    // Create normalized layouts with identical dimensions
    const normalizedFrontJson = {
      ...frontJson,
      width: normalizedWidth,
      height: normalizedHeight,
    };
    
    const normalizedBackJson = {
      ...backJson,
      width: normalizedWidth,
      height: normalizedHeight,
    };

    // Render card using rendering service
    const renderingServiceUrl = process.env.RENDERING_SERVICE_URL || 'http://localhost:3002';
    
    try {
      const response = await axios.post(
        `${renderingServiceUrl}/render`,
        {
          template: { front: normalizedFrontJson, back: normalizedBackJson },
          cardData: cardDataJson,
          format,
        },
        {
          responseType: 'arraybuffer',
          timeout: 60000,
          validateStatus: (status) => status < 500,
        },
      );

      // Check response status
      if (response.status >= 200 && response.status < 300) {
        const contentType = response.headers['content-type'] || getContentType(format);

        // Check if response is actually an error (JSON error response)
        if (contentType.includes('application/json')) {
          const errorData = JSON.parse(Buffer.from(response.data).toString('utf-8'));
          const errorMessage = errorData?.message || errorData?.error || 'Unknown rendering error';
          return res.status(500).json({ message: `Rendering service returned error: ${errorMessage}` });
        }

        // Valid binary response
        const buffer = Buffer.from(response.data);
        const filename = `card-${cardId}-${Date.now()}.${format}`;

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
      } else {
        // Non-2xx status - error response
        const errorData = JSON.parse(Buffer.from(response.data).toString('utf-8'));
        const errorMessage = errorData?.message || errorData?.error || `HTTP ${response.status}`;
        return res.status(500).json({ message: `Rendering service error: ${errorMessage} (Status: ${response.status})` });
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Timeout
        if (error.code === 'ECONNABORTED') {
          return res.status(500).json({ message: 'Rendering service timed out after 60 seconds' });
        }

        // Connection refused - service not running
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
          return res.status(500).json({ message: `Cannot connect to rendering service at ${renderingServiceUrl}. Please ensure the rendering service is running.` });
        }

        // Network errors
        if (error.code) {
          return res.status(500).json({ message: `Network error: ${error.code} - ${error.message}` });
        }

        // Response with error data
        if (error.response) {
          const errorData = error.response.data
            ? JSON.parse(Buffer.from(error.response.data).toString('utf-8'))
            : null;
          const errorMessage = errorData?.message || errorData?.error || error.message || 'Unknown error';
          return res.status(500).json({ message: `Rendering service error: ${errorMessage} (Status: ${error.response.status})` });
        }

        // Generic error
        return res.status(500).json({ message: `Rendering failed: ${error.message || 'Unknown error'}` });
      }

      return res.status(500).json({ message: 'Rendering failed', error: error.message });
    }
  } catch (error) {
    console.error('Export error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Card not found' });
    }
    res.status(500).json({ message: 'Failed to export card', error: error.message });
  }
});

function getContentType(format) {
  const contentTypes = {
    png: 'image/png',
    jpeg: 'image/jpeg',
    pdf: 'application/pdf',
  };
  return contentTypes[format] || 'application/octet-stream';
}

module.exports = router;

