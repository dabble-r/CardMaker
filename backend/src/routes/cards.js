const express = require('express');
const Card = require('../models/Card');
const Template = require('../models/Template');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all user's cards
router.get('/', async (req, res) => {
  try {
    const cards = await Card.find({ userId: req.user.id })
      .populate('templateId', 'id name description frontJson backJson')
      .sort({ createdAt: -1 });

    // Filter out cards with missing templates and map to response format
    const validCards = cards
      .filter(card => card.templateId !== null && card.templateId !== undefined)
      .map(card => ({
        id: card._id.toString(),
        userId: card.userId.toString(),
        templateId: card.templateId._id.toString(),
        cardDataJson: card.cardDataJson,
        createdAt: card.createdAt,
        updatedAt: card.updatedAt,
        template: {
          id: card.templateId._id.toString(),
          name: card.templateId.name,
          description: card.templateId.description,
          frontJson: card.templateId.frontJson,
          backJson: card.templateId.backJson,
        },
      }));

    res.json(validCards);
  } catch (error) {
    console.error('Get cards error:', error);
    res.status(500).json({ message: 'Failed to fetch cards', error: error.message });
  }
});

// Get card by ID
router.get('/:id', async (req, res) => {
  try {
    const card = await Card.findById(req.params.id).populate('templateId', 'id name description frontJson backJson');

    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    if (card.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You do not have permission to view this card' });
    }

    if (!card.templateId) {
      return res.status(404).json({ message: 'Template not found for this card' });
    }

    res.json({
      id: card._id.toString(),
      userId: card.userId.toString(),
      templateId: card.templateId._id.toString(),
      cardDataJson: card.cardDataJson,
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
      template: card.templateId,
    });
  } catch (error) {
    console.error('Get card error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Card not found' });
    }
    res.status(500).json({ message: 'Failed to fetch card', error: error.message });
  }
});

// Create card
router.post('/', async (req, res) => {
  try {
    const { templateId, cardDataJson } = req.body;

    if (!templateId || !cardDataJson) {
      return res.status(400).json({ message: 'templateId and cardDataJson are required' });
    }

    // Verify template exists
    const template = await Template.findById(templateId);
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    const card = await Card.create({
      userId: req.user.id,
      templateId,
      cardDataJson,
    });

    await card.populate('templateId', 'id name description');

    res.status(201).json({
      id: card._id.toString(),
      userId: card.userId.toString(),
      templateId: card.templateId._id.toString(),
      cardDataJson: card.cardDataJson,
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
      template: {
        id: card.templateId._id.toString(),
        name: card.templateId.name,
        description: card.templateId.description,
      },
    });
  } catch (error) {
    console.error('Create card error:', error);
    res.status(500).json({ message: 'Failed to create card', error: error.message });
  }
});

// Update card
router.put('/:id', async (req, res) => {
  try {
    const { templateId, cardDataJson } = req.body;

    const card = await Card.findById(req.params.id);
    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    if (card.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You do not have permission to update this card' });
    }

    // Verify new template exists if provided
    if (templateId) {
      const template = await Template.findById(templateId);
      if (!template) {
        return res.status(404).json({ message: 'Template not found' });
      }
      card.templateId = templateId;
    }

    if (cardDataJson) {
      card.cardDataJson = cardDataJson;
    }

    await card.save();
    await card.populate('templateId', 'id name description');

    res.json({
      id: card._id.toString(),
      userId: card.userId.toString(),
      templateId: card.templateId._id.toString(),
      cardDataJson: card.cardDataJson,
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
      template: {
        id: card.templateId._id.toString(),
        name: card.templateId.name,
        description: card.templateId.description,
      },
    });
  } catch (error) {
    console.error('Update card error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Card not found' });
    }
    res.status(500).json({ message: 'Failed to update card', error: error.message });
  }
});

// Delete card
router.delete('/:id', async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    if (card.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You do not have permission to delete this card' });
    }

    await Card.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Delete card error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Card not found' });
    }
    res.status(500).json({ message: 'Failed to delete card', error: error.message });
  }
});

// Duplicate card
router.post('/:id/duplicate', async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    if (card.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You do not have permission to duplicate this card' });
    }

    const newCard = await Card.create({
      userId: req.user.id,
      templateId: card.templateId,
      cardDataJson: card.cardDataJson,
    });

    await newCard.populate('templateId', 'id name description');

    res.status(201).json({
      id: newCard._id.toString(),
      userId: newCard.userId.toString(),
      templateId: newCard.templateId._id.toString(),
      cardDataJson: newCard.cardDataJson,
      createdAt: newCard.createdAt,
      updatedAt: newCard.updatedAt,
      template: {
        id: newCard.templateId._id.toString(),
        name: newCard.templateId.name,
        description: newCard.templateId.description,
      },
    });
  } catch (error) {
    console.error('Duplicate card error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Card not found' });
    }
    res.status(500).json({ message: 'Failed to duplicate card', error: error.message });
  }
});

module.exports = router;

