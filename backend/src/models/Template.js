const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: null,
  },
  frontJson: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  backJson: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Template', templateSchema);

