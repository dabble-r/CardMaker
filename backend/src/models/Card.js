const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Template',
    required: true,
  },
  cardDataJson: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Card', cardSchema);

