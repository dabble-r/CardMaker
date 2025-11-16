require('dotenv').config();
const mongoose = require('mongoose');
const Template = require('./models/Template');
const connectDB = require('./config/database');

// Shared Donruss-style front template (portrait layout) for all templates
const sharedFrontTemplate = {
  width: 350,
  height: 490,
  backgroundColor: '#3f7f4f',
  borderWidth: 12,
  innerPadding: 6,
  innerBackgroundColor: '#FFFFFF',
  elements: [
    {
      id: 'player-photo',
      type: 'image',
      x: 18,
      y: 18,
      width: 314,
      height: 382,
      zIndex: 1,
      visible: true,
      src: '',
      objectFit: 'cover',
    },
    {
      id: 'player-name',
      type: 'text',
      x: 38,
      y: 420,
      width: 200,
      zIndex: 10,
      visible: true,
      content: '{{player.name}}',
      fontSize: 20,
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold',
      color: '#FFFFFF',
      textAlign: 'left',
    },
    {
      id: 'player-position',
      type: 'text',
      x: 250,
      y: 440,
      width: 100,
      zIndex: 10,
      visible: true,
      content: '{{player.position}}',
      fontSize: 14,
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'normal',
      color: '#000000',
      textAlign: 'center',
      backgroundColor: '#86a8b8',
      padding: '2px 8px',
      borderRadius: '2px',
    },
  ],
};

// Shared Donruss-style back template (landscape layout) for all templates
// Width matches front height (490), height matches front width (350)
// Reduced inner content dimensions to fit the smaller canvas
const sharedBackTemplate = {
  width: 490,
  height: 350,
  backgroundColor: '#3f7f4f',
  elements: [
    {
      id: 'stats-rectangle',
      type: 'rectangle',
      x: 20,
      y: 100,
      width: 450,
      height: 180,
      backgroundColor: '#FFFFFF',
      borderColor: '#3f7f4f',
      borderWidth: 2,
      borderRadius: 8,
      zIndex: 1,
      visible: true,
    },
    {
      id: 'bio-title',
      type: 'text',
      x: 20,
      y: 10,
      width: 450,
      zIndex: 10,
      visible: true,
      content: 'PLAYER BIO',
      fontSize: 18,
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold',
      color: '#FFFFFF',
      textAlign: 'center',
    },
    {
      id: 'bio-name',
      type: 'text',
      x: 20,
      y: 35,
      width: 140,
      zIndex: 10,
      visible: true,
      content: 'Name: {{player.name}}',
      fontSize: 12,
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'normal',
      color: '#FFFFFF',
      textAlign: 'center',
    },
    {
      id: 'bio-position',
      type: 'text',
      x: 20,
      y: 55,
      width: 140,
      zIndex: 10,
      visible: true,
      content: 'Position: {{player.position}}',
      fontSize: 12,
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'normal',
      color: '#FFFFFF',
      textAlign: 'center',
    },
    {
      id: 'bio-team',
      type: 'text',
      x: 175,
      y: 35,
      width: 140,
      zIndex: 10,
      visible: true,
      content: 'Team: {{player.team}}',
      fontSize: 12,
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'normal',
      color: '#FFFFFF',
      textAlign: 'center',
    },
    {
      id: 'bio-jersey',
      type: 'text',
      x: 175,
      y: 55,
      width: 140,
      zIndex: 10,
      visible: true,
      content: 'Jersey: #{{player.jerseyNumber}}',
      fontSize: 12,
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'normal',
      color: '#FFFFFF',
      textAlign: 'center',
    },
    {
      id: 'bio-year',
      type: 'text',
      x: 330,
      y: 35,
      width: 140,
      zIndex: 10,
      visible: true,
      content: 'Year: {{player.year}}',
      fontSize: 12,
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'normal',
      color: '#FFFFFF',
      textAlign: 'center',
    },
    {
      id: 'bio-throws',
      type: 'text',
      x: 330,
      y: 55,
      width: 140,
      zIndex: 10,
      visible: true,
      content: 'Throws: {{player.throws}}',
      fontSize: 12,
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'normal',
      color: '#FFFFFF',
      textAlign: 'center',
    },
    {
      id: 'stats-title',
      type: 'text',
      x: 20,
      y: 110,
      width: 450,
      zIndex: 10,
      visible: true,
      content: 'SEASON STATISTICS',
      fontSize: 16,
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold',
      color: '#3f7f4f',
      textAlign: 'center',
    },
    {
      id: 'highlights-title',
      type: 'text',
      x: 20,
      y: 290,
      width: 450,
      zIndex: 10,
      visible: true,
      content: 'CAREER HIGHLIGHTS',
      fontSize: 16,
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold',
      color: '#FFFFFF',
      textAlign: 'center',
    },
    {
      id: 'highlights-text',
      type: 'text',
      x: 20,
      y: 310,
      width: 450,
      zIndex: 10,
      visible: true,
      content: '{{customFields.careerHighlights}}',
      fontSize: 11,
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'normal',
      color: '#FFFFFF',
      textAlign: 'center',
      whiteSpace: 'normal',
    },
  ],
};

const defaultTemplates = [
  {
    _id: new mongoose.Types.ObjectId(),
    id: 'topps-1990-style',
    name: 'Topps 1990 Style',
    description: 'Classic Topps design inspired by 1990s baseball cards',
    isDefault: true,
    frontJson: sharedFrontTemplate,
    backJson: sharedBackTemplate,
  },
  {
    _id: new mongoose.Types.ObjectId(),
    id: 'donruss-1991-style',
    name: 'Donruss 1991 Style',
    description: 'Authentic Donruss 1991 design with green border and diagonal banner',
    isDefault: true,
    frontJson: sharedFrontTemplate,
    backJson: sharedBackTemplate,
  },
  {
    _id: new mongoose.Types.ObjectId(),
    id: 'score-1992-style',
    name: 'Score 1992 Style',
    description: 'Clean Score design with modern layout',
    isDefault: true,
    frontJson: sharedFrontTemplate,
    backJson: sharedBackTemplate,
  },
  {
    _id: new mongoose.Types.ObjectId(),
    id: 'upper-deck-1990-style',
    name: 'Upper Deck 1990 Style',
    description: 'Premium Upper Deck design with elegant styling',
    isDefault: true,
    frontJson: sharedFrontTemplate,
    backJson: sharedBackTemplate,
  },
  {
    _id: new mongoose.Types.ObjectId(),
    id: 'fleer-1991-style',
    name: 'Fleer 1990 Yankees Style',
    description: 'Classic Fleer 1990 design with navy and red accents, inspired by Yankees cards',
    isDefault: true,
    frontJson: sharedFrontTemplate,
    backJson: sharedBackTemplate,
  },
];

async function seed() {
  try {
    await connectDB();

    // Clear existing default templates
    await Template.deleteMany({ isDefault: true });

    // Insert default templates
    for (const template of defaultTemplates) {
      // Remove _id and id from template object for upsert
      const { _id, id, ...templateData } = template;
      await Template.findOneAndUpdate(
        { name: template.name, isDefault: true },
        templateData,
        { upsert: true, new: true }
      );
    }

    console.log('Default templates seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();

