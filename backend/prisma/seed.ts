import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Topps 1990 Style Template
  await prisma.template.upsert({
    where: { id: 'topps-1990-style' },
    update: {},
    create: {
      id: 'topps-1990-style',
      name: 'Topps 1990 Style',
      description: 'Classic Topps design inspired by 1990s baseball cards',
      isDefault: true,
      frontJson: {
        width: 630,
        height: 880,
        backgroundColor: '#FFFFFF',
        elements: [
          {
            id: 'player-image',
            type: 'image',
            x: 50,
            y: 100,
            width: 280,
            height: 350,
            zIndex: 1,
            visible: true,
            src: '',
            objectFit: 'cover',
          },
          {
            id: 'player-name',
            type: 'text',
            x: 50,
            y: 480,
            width: 280,
            zIndex: 2,
            visible: true,
            content: 'Player Name',
            fontSize: 32,
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'bold',
            color: '#000000',
            textAlign: 'left',
          },
          {
            id: 'team-position',
            type: 'text',
            x: 50,
            y: 520,
            width: 280,
            zIndex: 2,
            visible: true,
            content: 'Team • Position',
            fontSize: 20,
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'normal',
            color: '#666666',
            textAlign: 'left',
          },
          {
            id: 'stats-section',
            type: 'text',
            x: 50,
            y: 580,
            width: 280,
            zIndex: 2,
            visible: true,
            content: 'STATS',
            fontSize: 18,
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'bold',
            color: '#000000',
            textAlign: 'left',
          },
        ],
      },
      backJson: {
        width: 630,
        height: 880,
        backgroundColor: '#F5F5F5',
        elements: [
          {
            id: 'back-title',
            type: 'text',
            x: 50,
            y: 50,
            width: 530,
            zIndex: 1,
            visible: true,
            content: 'CAREER STATISTICS',
            fontSize: 24,
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'bold',
            color: '#000000',
            textAlign: 'center',
          },
        ],
      },
    },
  });

  // Donruss 1991 Style Template
  // Front: Green border card with white inner, photo area, and diagonal banner with name/position
  // Back: Card design with stats
  const donrussTemplate = {
      id: 'donruss-1991-style',
      name: 'Donruss 1991 Style',
      description: 'Authentic Donruss 1991 design with green border and diagonal banner',
      isDefault: true,
      frontJson: {
        width: 350,
        height: 490, // 2.5:3.5 aspect ratio
        backgroundColor: '#3f7f4f', // Green outer border
        borderWidth: 12,
        innerPadding: 6,
        innerBackgroundColor: '#FFFFFF',
        elements: [
          {
            id: 'player-photo',
            type: 'image',
            x: 18, // borderWidth + innerPadding
            y: 18, // borderWidth + innerPadding
            width: 314, // width - 2*(borderWidth + innerPadding)
            height: 382, // ~78% of inner height
            zIndex: 1,
            visible: true,
            src: '', // Will use cardData.imageUrl
            objectFit: 'cover',
          },
          {
            id: 'player-name',
            type: 'text',
            x: 38, // borderWidth + innerPadding + 20
            y: 420, // Positioned in banner area
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
      },
      backJson: {
        width: 880, // Landscape: rotated from portrait 630x880 to 880x630
        height: 630,
        backgroundColor: '#3f7f4f', // Match Donruss green from front
        // Layout: Player Bio (top) -> Stats Rectangle (center) -> Career Highlights (bottom)
        elements: [
          // Background rectangle for stats section (white inner like front)
          {
            id: 'stats-rectangle',
            type: 'rectangle',
            x: 140, // Centered: (880 - 600) / 2 = 140
            y: 180,
            width: 600,
            height: 280,
            backgroundColor: '#FFFFFF', // White inner like front
            borderColor: '#3f7f4f', // Green border
            borderWidth: 3,
            borderRadius: 10,
            zIndex: 1,
            visible: true,
          },
          // Player Bio Section (above rectangle) - three columns with two stats vertically in each
          // Rectangle starts at y: 180, so we have 180px of space above it
          // Layout: Title + 2 rows of 3 columns each = ~150px total
          // Column 1: Name (top), Position (bottom)
          // Column 2: Team (top), Jersey (bottom)
          // Column 3: Year (top), Throws (bottom)
          {
            id: 'bio-title',
            type: 'text',
            x: 50,
            y: 30,
            width: 780,
            zIndex: 10,
            visible: true,
            content: 'PLAYER BIO',
            fontSize: 24,
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'bold',
            color: '#FFFFFF', // White text on green background
            textAlign: 'center',
          },
          // Column 1: Name (top) and Position (bottom)
          {
            id: 'bio-name',
            type: 'text',
            x: 50,
            y: 70,
            width: 240,
            zIndex: 10,
            visible: true,
            content: 'Name: {{player.name}}',
            fontSize: 18,
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'normal',
            color: '#FFFFFF',
            textAlign: 'center',
          },
          {
            id: 'bio-position',
            type: 'text',
            x: 50,
            y: 105,
            width: 240,
            zIndex: 10,
            visible: true,
            content: 'Position: {{player.position}}',
            fontSize: 18,
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'normal',
            color: '#FFFFFF',
            textAlign: 'center',
          },
          // Column 2: Team (top) and Jersey (bottom)
          {
            id: 'bio-team',
            type: 'text',
            x: 320,
            y: 70,
            width: 240,
            zIndex: 10,
            visible: true,
            content: 'Team: {{player.team}}',
            fontSize: 18,
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'normal',
            color: '#FFFFFF',
            textAlign: 'center',
          },
          {
            id: 'bio-jersey',
            type: 'text',
            x: 320,
            y: 105,
            width: 240,
            zIndex: 10,
            visible: true,
            content: 'Jersey: #{{player.jerseyNumber}}',
            fontSize: 18,
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'normal',
            color: '#FFFFFF',
            textAlign: 'center',
          },
          // Column 3: Year (top) and Throws (bottom)
          {
            id: 'bio-year',
            type: 'text',
            x: 590,
            y: 70,
            width: 240,
            zIndex: 10,
            visible: true,
            content: 'Year: {{player.year}}',
            fontSize: 18,
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'normal',
            color: '#FFFFFF',
            textAlign: 'center',
          },
          {
            id: 'bio-throws',
            type: 'text',
            x: 590,
            y: 105,
            width: 240,
            zIndex: 10,
            visible: true,
            content: 'Throws: {{player.throws}}',
            fontSize: 18,
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'normal',
            color: '#FFFFFF',
            textAlign: 'center',
          },
          // Stats Section Title (inside rectangle)
          {
            id: 'stats-title',
            type: 'text',
            x: 140,
            y: 195,
            width: 600,
            zIndex: 10,
            visible: true,
            content: 'SEASON STATISTICS',
            fontSize: 22,
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'bold',
            color: '#3f7f4f', // Green text to match Donruss theme
            textAlign: 'center',
          },
          // Dynamic stats will be rendered here - no hardcoded stat elements
          // Career Highlights Section (below rectangle)
          {
            id: 'highlights-title',
            type: 'text',
            x: 50,
            y: 490,
            width: 780,
            zIndex: 10,
            visible: true,
            content: 'CAREER HIGHLIGHTS',
            fontSize: 22,
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'bold',
            color: '#FFFFFF', // White text on green background
            textAlign: 'center',
          },
          {
            id: 'highlights-text',
            type: 'text',
            x: 50,
            y: 520,
            width: 780,
            zIndex: 10,
            visible: true,
            content: '{{customFields.careerHighlights}}',
            fontSize: 16,
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'normal',
            color: '#FFFFFF',
            textAlign: 'center',
            whiteSpace: 'normal',
          },
        ],
      },
    };

  await prisma.template.upsert({
    where: { id: 'donruss-1991-style' },
    update: donrussTemplate,
    create: donrussTemplate,
  });

  // Score 1992 Style Template
  await prisma.template.upsert({
    where: { id: 'score-1992-style' },
    update: {},
    create: {
      id: 'score-1992-style',
      name: 'Score 1992 Style',
      description: 'Clean Score design with modern layout',
      isDefault: true,
      frontJson: {
        width: 630,
        height: 880,
        backgroundColor: '#FFFFFF',
        elements: [
          {
            id: 'player-image',
            type: 'image',
            x: 100,
            y: 80,
            width: 230,
            height: 300,
            zIndex: 1,
            visible: true,
            src: '',
            objectFit: 'cover',
          },
          {
            id: 'player-name',
            type: 'text',
            x: 100,
            y: 400,
            width: 230,
            zIndex: 2,
            visible: true,
            content: 'Player Name',
            fontSize: 30,
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'bold',
            color: '#000000',
            textAlign: 'center',
          },
          {
            id: 'team-position',
            type: 'text',
            x: 100,
            y: 440,
            width: 230,
            zIndex: 2,
            visible: true,
            content: 'Team • Position',
            fontSize: 16,
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'normal',
            color: '#666666',
            textAlign: 'center',
          },
          {
            id: 'year',
            type: 'text',
            x: 100,
            y: 500,
            width: 230,
            zIndex: 2,
            visible: true,
            content: '1992',
            fontSize: 24,
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'bold',
            color: '#1E3A8A',
            textAlign: 'center',
          },
        ],
      },
      backJson: {
        width: 630,
        height: 880,
        backgroundColor: '#F9F9F9',
        elements: [
          {
            id: 'back-title',
            type: 'text',
            x: 50,
            y: 50,
            width: 530,
            zIndex: 1,
            visible: true,
            content: 'STATISTICS',
            fontSize: 26,
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'bold',
            color: '#1E3A8A',
            textAlign: 'center',
          },
        ],
      },
    },
  });

  // Upper Deck 1990 Style Template
  await prisma.template.upsert({
    where: { id: 'upper-deck-1990-style' },
    update: {},
    create: {
      id: 'upper-deck-1990-style',
      name: 'Upper Deck 1990 Style',
      description: 'Premium Upper Deck design with elegant styling',
      isDefault: true,
      frontJson: {
        width: 630,
        height: 880,
        backgroundColor: '#000000',
        elements: [
          {
            id: 'player-image',
            type: 'image',
            x: 60,
            y: 100,
            width: 260,
            height: 340,
            zIndex: 1,
            visible: true,
            src: '',
            objectFit: 'cover',
          },
          {
            id: 'player-name',
            type: 'text',
            x: 60,
            y: 460,
            width: 260,
            zIndex: 2,
            visible: true,
            content: 'Player Name',
            fontSize: 26,
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'bold',
            color: '#FFD700',
            textAlign: 'left',
          },
          {
            id: 'team-position',
            type: 'text',
            x: 60,
            y: 500,
            width: 260,
            zIndex: 2,
            visible: true,
            content: 'Team • Position',
            fontSize: 18,
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'normal',
            color: '#FFFFFF',
            textAlign: 'left',
          },
        ],
      },
      backJson: {
        width: 630,
        height: 880,
        backgroundColor: '#1A1A1A',
        elements: [
          {
            id: 'back-title',
            type: 'text',
            x: 50,
            y: 50,
            width: 530,
            zIndex: 1,
            visible: true,
            content: 'CAREER HIGHLIGHTS',
            fontSize: 24,
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'bold',
            color: '#FFD700',
            textAlign: 'center',
          },
        ],
      },
    },
  });

  // Fleer 1991 Style Template
  await prisma.template.upsert({
    where: { id: 'fleer-1991-style' },
    update: {},
    create: {
      id: 'fleer-1991-style',
      name: 'Fleer 1991 Style',
      description: 'Classic Fleer design with colorful borders',
      isDefault: true,
      frontJson: {
        width: 630,
        height: 880,
        backgroundColor: '#FFFFFF',
        elements: [
          {
            id: 'border-top',
            type: 'text',
            x: 0,
            y: 0,
            width: 630,
            height: 20,
            zIndex: 0,
            visible: true,
            content: '',
            fontSize: 1,
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'normal',
            color: '#FF6B35',
            textAlign: 'left',
          },
          {
            id: 'player-image',
            type: 'image',
            x: 70,
            y: 110,
            width: 240,
            height: 310,
            zIndex: 1,
            visible: true,
            src: '',
            objectFit: 'cover',
          },
          {
            id: 'player-name',
            type: 'text',
            x: 70,
            y: 440,
            width: 240,
            zIndex: 2,
            visible: true,
            content: 'Player Name',
            fontSize: 28,
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'bold',
            color: '#000000',
            textAlign: 'center',
          },
          {
            id: 'team-position',
            type: 'text',
            x: 70,
            y: 480,
            width: 240,
            zIndex: 2,
            visible: true,
            content: 'Team • Position',
            fontSize: 16,
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'normal',
            color: '#666666',
            textAlign: 'center',
          },
        ],
      },
      backJson: {
        width: 630,
        height: 880,
        backgroundColor: '#FFFFFF',
        elements: [
          {
            id: 'back-title',
            type: 'text',
            x: 50,
            y: 50,
            width: 530,
            zIndex: 1,
            visible: true,
            content: 'PLAYER INFORMATION',
            fontSize: 22,
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'bold',
            color: '#FF6B35',
            textAlign: 'center',
          },
        ],
      },
    },
  });

  console.log('Default templates seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

