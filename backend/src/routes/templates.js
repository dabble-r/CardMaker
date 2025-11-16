const express = require('express');
const Template = require('../models/Template');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all templates (public, but can filter by user)
router.get('/', async (req, res) => {
  try {
    const includeDefaults = req.query.includeDefaults !== 'false';
    const userId = req.user?.id;

    let query = {};
    if (userId) {
      query.$or = [
        { userId: userId },
        ...(includeDefaults ? [{ isDefault: true }] : []),
      ];
    } else if (includeDefaults) {
      query.isDefault = true;
    }

    const templates = await Template.find(query)
      .sort({ isDefault: -1, createdAt: -1 });

    res.json(templates.map(template => ({
      id: template._id.toString(),
      userId: template.userId ? template.userId.toString() : null,
      name: template.name,
      description: template.description,
      frontJson: template.frontJson,
      backJson: template.backJson,
      isDefault: template.isDefault,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    })));
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ message: 'Failed to fetch templates', error: error.message });
  }
});

// Get template by ID
router.get('/:id', async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    res.json({
      id: template._id.toString(),
      userId: template.userId ? template.userId.toString() : null,
      name: template.name,
      description: template.description,
      frontJson: template.frontJson,
      backJson: template.backJson,
      isDefault: template.isDefault,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    });
  } catch (error) {
    console.error('Get template error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Template not found' });
    }
    res.status(500).json({ message: 'Failed to fetch template', error: error.message });
  }
});

// Create template (authenticated)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, frontJson, backJson } = req.body;

    if (!name || !frontJson || !backJson) {
      return res.status(400).json({ message: 'name, frontJson, and backJson are required' });
    }

    const template = await Template.create({
      name,
      description,
      frontJson,
      backJson,
      userId: req.user.id,
    });

    res.status(201).json({
      id: template._id.toString(),
      userId: template.userId.toString(),
      name: template.name,
      description: template.description,
      frontJson: template.frontJson,
      backJson: template.backJson,
      isDefault: template.isDefault,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ message: 'Failed to create template', error: error.message });
  }
});

// Update template (authenticated)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, description, frontJson, backJson } = req.body;

    const template = await Template.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Check if user owns the template or if it's a default template
    if (template.isDefault) {
      return res.status(403).json({ message: 'Cannot update default templates' });
    }

    if (template.userId && template.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You do not have permission to update this template' });
    }

    if (name) template.name = name;
    if (description !== undefined) template.description = description;
    if (frontJson) template.frontJson = frontJson;
    if (backJson) template.backJson = backJson;

    await template.save();

    res.json({
      id: template._id.toString(),
      userId: template.userId ? template.userId.toString() : null,
      name: template.name,
      description: template.description,
      frontJson: template.frontJson,
      backJson: template.backJson,
      isDefault: template.isDefault,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    });
  } catch (error) {
    console.error('Update template error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Template not found' });
    }
    res.status(500).json({ message: 'Failed to update template', error: error.message });
  }
});

// Delete template (authenticated)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    if (template.isDefault) {
      return res.status(403).json({ message: 'Cannot delete default templates' });
    }

    if (template.userId && template.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You do not have permission to delete this template' });
    }

    await Template.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Delete template error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Template not found' });
    }
    res.status(500).json({ message: 'Failed to delete template', error: error.message });
  }
});

module.exports = router;

