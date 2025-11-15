import { CardLayout } from './types';
import { getStatAbbreviation } from './stat-abbreviations';

export function generateHTML(template: { front: CardLayout; back: CardLayout }, cardData: any): string {
  const frontHTML = generateCardHTML(template.front, cardData, 'front');
  const backHTML = generateCardHTML(template.back, cardData, 'back');
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            margin: 0;
            padding: 20px;
            font-family: Arial, sans-serif;
            background-color: #f0f0f0;
          }
          .card-container {
            display: flex;
            gap: 20px;
            justify-content: center;
            flex-wrap: wrap;
          }
          .card {
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
        </style>
      </head>
      <body>
        <div class="card-container">
          ${frontHTML}
          ${backHTML}
        </div>
      </body>
    </html>
  `;
}

function generateCardHTML(layout: CardLayout, cardData: any, side: 'front' | 'back'): string {
  // Check if this is a Donruss-style card with border and inner structure
  // Also check by background color (green #3f7f4f) for back side
  const isDonrussStyle = 
    (layout as any).borderWidth !== undefined || 
    (layout as any).innerPadding !== undefined ||
    layout.backgroundColor === '#3f7f4f';
  
  if (isDonrussStyle && side === 'front') {
    // Render Donruss '91 style card structure
    const borderWidth = (layout as any).borderWidth || 12;
    const innerPadding = (layout as any).innerPadding || 6;
    const elements = layout.elements || [];
    const photoElement = elements.find((el: any) => el.id === 'player-photo' || el.type === 'image');
    const nameElement = elements.find((el: any) => el.id === 'player-name');
    const positionElement = elements.find((el: any) => el.id === 'player-position');
    
    const photoSrc = cardData.imageUrl || photoElement?.src || '';
    const playerName = cardData.player?.name || 'Player Name';
    const playerPosition = cardData.player?.position || 'POSITION';
    
    return `
      <div class="card" style="width: ${layout.width}px; height: ${layout.height}px; background-color: ${layout.backgroundColor || '#3f7f4f'}; padding: ${borderWidth}px; box-sizing: border-box; border-radius: 4px; position: relative; font-family: sans-serif;">
        <div class="card-inner" style="width: 100%; height: 100%; background-color: ${(layout as any).innerBackgroundColor || '#FFFFFF'}; padding: ${innerPadding}px; box-sizing: border-box; position: relative; border-radius: 3px;">
          <div class="photo" style="width: 100%; height: 78%; background-color: #ccc; border-radius: 2px; background-image: ${photoSrc ? `url('${photoSrc}')` : 'none'}; background-size: cover; background-position: center; margin-bottom: 6px;"></div>
          <div class="bottom-banner" style="position: absolute; bottom: ${innerPadding}px; left: ${innerPadding}px; width: calc(100% - ${innerPadding * 2}px); height: 22%; pointer-events: none;">
            <div style="position: absolute; left: 0; bottom: 0; width: 100%; height: 100%; background: linear-gradient(10deg, #b4463f 60%, #4a90a6 60%); transform: skewY(-10deg); transform-origin: bottom left; z-index: 1;"></div>
            <div style="position: absolute; left: 20px; bottom: 40px; z-index: 2; font-size: ${nameElement?.fontSize || 20}px; font-weight: ${nameElement?.fontWeight || 'bold'}; color: ${nameElement?.color || '#FFFFFF'};">${playerName}</div>
            <div style="position: absolute; right: 20px; bottom: 20px; z-index: 2; padding: ${positionElement?.padding || '2px 8px'}; background-color: ${positionElement?.backgroundColor || '#86a8b8'}; border-radius: ${positionElement?.borderRadius || '2px'}; font-size: ${positionElement?.fontSize || 14}px; color: ${positionElement?.color || '#000000'};">${playerPosition}</div>
          </div>
        </div>
      </div>
    `;
  }
  
  // Standard card rendering for other templates or back side
  let elementsList = layout.elements || [];
  
  // For Donruss back, dynamically add stats in a table format
  // Each row = a season, each column = a stat type
  if (isDonrussStyle && side === 'back') {
    const stats = cardData.stats || {};
    const statKeys = Object.keys(stats).filter(key => {
      const value = stats[key];
      return value !== undefined && value !== null && value !== '';
    });
    
    if (statKeys.length > 0) {
      // Rectangle dimensions: x: 140, y: 180, width: 600, height: 280
      // Available space: 600px wide, ~250px tall (280 - 30 for title/padding)
      // Support up to 10 stats with minimal spacing
      const rectX = 140;
      const rectY = 180;
      const rectWidth = 600;
      const rectHeight = 280;
      const padding = 20; // Padding inside rectangle
      const yearColumnWidth = 50; // Reduced width for year column
      const maxStats = 10; // Maximum number of stats to support
      
      // Calculate available space
      const availableWidth = rectWidth - (padding * 2) - yearColumnWidth;
      const numCols = Math.min(statKeys.length, maxStats);
      // Minimal spacing: distribute evenly with minimal gap between columns
      const colSpacing = availableWidth / numCols; // Distribute evenly
      const colWidth = colSpacing * 0.95; // Use 95% of spacing for column width (minimal gap)
      
      // Calculate font size based on available space (must fit up to 10 stats)
      // Estimate: each character is roughly 0.6 * fontSize wide
      // We want to fit stat names (usually 1-4 chars) and values (usually 1-4 digits)
      const maxContentLength = Math.max(...statKeys.map(k => {
        const abbrev = getStatAbbreviation(k);
        return abbrev.length;
      }), 4); // Max stat abbreviation length or 4
      const estimatedCharWidth = maxContentLength * 0.6; // Rough estimate
      // Calculate for max 10 stats to ensure it always fits
      const colWidthForMax = (availableWidth / maxStats) * 0.95;
      // Increase font size while ensuring it fits
      const calculatedFontSize = (colWidthForMax / estimatedCharWidth) * 0.85; // 85% of calculated size for safety
      // Use larger font size but ensure it fits
      const maxFontSize = Math.min(
        calculatedFontSize,
        18, // Increased max to 18px
        (availableWidth / maxStats) * 0.3 // Don't exceed 30% of column width
      );
      const headerFontSize = Math.max(12, Math.floor(maxFontSize * 0.9)); // Slightly smaller for headers, min 12px
      const valueFontSize = Math.max(14, Math.floor(maxFontSize)); // Increased min to 14px
      
      const startY = 230; // Below title
      const rowSpacing = 25; // Reduced spacing between rows (from 35)
      const headerRowY = startY; // Header row
      const dataRowY = startY + rowSpacing; // Data row (current season)
      const tableStartX = rectX + padding + yearColumnWidth; // Start after year column
      
      const dynamicStats: any[] = [];
      
      // Header row: stat names as column headers (using abbreviations)
      statKeys.forEach((statKey, colIndex) => {
        const x = tableStartX + (colIndex * colSpacing);
        const abbrev = getStatAbbreviation(statKey);
        dynamicStats.push({
          id: `dynamic-stat-header-${statKey}`,
          type: 'text',
          content: abbrev,
          x: x,
          y: headerRowY,
          width: colWidth,
          zIndex: 10,
          visible: true,
          fontSize: headerFontSize,
          fontFamily: 'Arial, sans-serif',
          fontWeight: 'bold',
          color: '#3f7f4f', // Green to match theme
          textAlign: 'center',
        });
      });
      
      // Data row: stat values for current season
      statKeys.forEach((statKey, colIndex) => {
        const x = tableStartX + (colIndex * colSpacing);
        dynamicStats.push({
          id: `dynamic-stat-value-${statKey}`,
          type: 'stat',
          statKey: statKey,
          label: '',
          x: x,
          y: dataRowY,
          width: colWidth,
          zIndex: 10,
          visible: true,
          fontSize: valueFontSize,
          fontFamily: 'Arial, sans-serif',
          fontWeight: 'normal',
          color: '#000000',
          textAlign: 'center',
          format: 'value-only',
        });
      });
      
      // Optional: Add year label in first column of data row
      if (cardData.player?.year) {
        dynamicStats.push({
          id: 'dynamic-stat-year-label',
          type: 'text',
          content: String(cardData.player.year),
          x: rectX + padding,
          y: dataRowY,
          width: yearColumnWidth,
          zIndex: 10,
          visible: true,
          fontSize: valueFontSize,
          fontFamily: 'Arial, sans-serif',
          fontWeight: 'bold',
          color: '#000000',
          textAlign: 'right',
        });
      }
      
      // Insert dynamic stats after the stats-title element
      const titleIndex = elementsList.findIndex((el: any) => el.id === 'stats-title');
      if (titleIndex >= 0) {
        elementsList = [
          ...elementsList.slice(0, titleIndex + 1),
          ...dynamicStats,
          ...elementsList.slice(titleIndex + 1),
        ];
      } else {
        elementsList = [...elementsList, ...dynamicStats];
      }
    }
  }
  
  const elements = elementsList
    .filter((el) => el.visible)
    .map((element) => {
      switch (element.type) {
        case 'text':
          return generateTextElement(element, cardData);
        case 'image':
          return generateImageElement(element, cardData);
        case 'stat':
          return generateStatElement(element, cardData);
        case 'rectangle':
          return generateRectangleElement(element);
        default:
          return '';
      }
    })
    .join('\n');

  // For front side, use player image as background if available
  let backgroundImage = layout.backgroundImage;
  if (side === 'front' && !backgroundImage && cardData.imageUrl) {
    backgroundImage = cardData.imageUrl;
  }
  // For back side, use cardData background image if available
  if (side === 'back' && !backgroundImage && cardData.backImageUrl) {
    backgroundImage = cardData.backImageUrl;
  }

  // Build card style with background image support
  const cardStyle = [
    `width: ${layout.width}px`,
    `height: ${layout.height}px`,
    `background-color: ${layout.backgroundColor || '#FFFFFF'}`,
    backgroundImage ? `background-image: url('${backgroundImage}')` : '',
    backgroundImage ? 'background-size: cover' : '',
    backgroundImage ? 'background-position: center' : '',
    backgroundImage ? 'background-repeat: no-repeat' : '',
    'position: relative',
    'overflow: hidden',
  ].filter(Boolean).join('; ');

  return `
    <div class="card" style="${cardStyle}">
      ${elements}
    </div>
  `;
}

function generateTextElement(element: any, cardData: any): string {
  let content = element.content || '';
  
  // Replace placeholders
  if (content.includes('{{player.name}}')) {
    content = content.replace('{{player.name}}', cardData.player?.name || '');
  }
  if (content.includes('{{player.team}}')) {
    content = content.replace('{{player.team}}', cardData.player?.team || '');
  }
  if (content.includes('{{player.position}}')) {
    content = content.replace('{{player.position}}', cardData.player?.position || '');
  }
  if (content.includes('{{player.jerseyNumber}}')) {
    content = content.replace('{{player.jerseyNumber}}', cardData.player?.jerseyNumber?.toString() || '');
  }
  if (content.includes('{{player.year}}')) {
    content = content.replace('{{player.year}}', cardData.player?.year?.toString() || '');
  }
  if (content.includes('{{player.throws}}')) {
    const throws = cardData.player?.throws || '';
    content = content.replace('{{player.throws}}', throws ? throws.charAt(0).toUpperCase() + throws.slice(1) : '');
  }
  if (content.includes('{{customFields.careerHighlights}}')) {
    content = content.replace('{{customFields.careerHighlights}}', cardData.customFields?.careerHighlights || 'No highlights available');
  }
  
  // Build text style with support for text shadows and outlines for visibility over images
  const textShadow = element.textShadow || (element.textOutline ? `0 0 ${element.textOutlineWidth || 3}px ${element.textOutlineColor || '#000000'}, 0 0 ${element.textOutlineWidth || 3}px ${element.textOutlineColor || '#000000'}` : '');
  const webkitTextStroke = element.textOutline ? `${element.textOutlineWidth || 2}px ${element.textOutlineColor || '#000000'}` : '';
  
  const style = [
    'position: absolute',
    `left: ${element.x}px`,
    `top: ${element.y}px`,
    element.width ? `width: ${element.width}px` : '',
    element.height ? `height: ${element.height}px` : '',
    `font-size: ${element.fontSize}px`,
    `font-family: ${element.fontFamily || 'Arial, sans-serif'}`,
    `font-weight: ${element.fontWeight || 'normal'}`,
    `color: ${element.color || '#000000'}`,
    `text-align: ${element.textAlign || 'left'}`,
    `z-index: ${element.zIndex || 1}`,
    textShadow ? `text-shadow: ${textShadow}` : '',
    webkitTextStroke ? `-webkit-text-stroke: ${webkitTextStroke}` : '',
    element.whiteSpace ? `white-space: ${element.whiteSpace}` : 'white-space: nowrap',
  ].filter(Boolean).join('; ');

  return `<div class="element text-element" style="${style}">${content}</div>`;
}

function generateImageElement(element: any, cardData: any): string {
  // Use cardData imageUrl if element.src is empty or placeholder
  const src = element.src && element.src !== '' && !element.src.includes('{{') 
    ? element.src 
    : cardData.imageUrl || cardData.player?.imageUrl || '';
  const style = `
    position: absolute;
    left: ${element.x}px;
    top: ${element.y}px;
    width: ${element.width}px;
    height: ${element.height}px;
    object-fit: ${element.objectFit || 'cover'};
    z-index: ${element.zIndex || 1};
  `;

  return `<img class="element image-element" src="${src}" style="${style}" alt="" onerror="this.style.display='none';" />`;
}

function generateStatElement(element: any, cardData: any): string {
  const statKey = element.statKey || '';
  
  // Handle special case: 'year' is in player data, not stats
  let statValue: any = '';
  if (statKey === 'year') {
    statValue = cardData.player?.year;
  } else {
    statValue = cardData.stats?.[statKey] !== undefined && cardData.stats?.[statKey] !== null 
      ? cardData.stats[statKey] 
      : '';
  }
  
  // Don't render if stat value is empty, null, or undefined
  if (statValue === '' || statValue === null || statValue === undefined) {
    return '';
  }
  
  const label = element.label || statKey;
  const content = element.format === 'label-value' 
    ? `${label}: ${statValue}`
    : element.format === 'value-only'
    ? `${statValue}`
    : `${label}: ${statValue}`;

  // Build text style with support for text shadows and outlines
  const textShadow = element.textShadow || (element.textOutline ? `0 0 ${element.textOutlineWidth || 3}px ${element.textOutlineColor || '#000000'}, 0 0 ${element.textOutlineWidth || 3}px ${element.textOutlineColor || '#000000'}` : '');
  const webkitTextStroke = element.textOutline ? `${element.textOutlineWidth || 2}px ${element.textOutlineColor || '#000000'}` : '';

  const style = [
    'position: absolute',
    `left: ${element.x}px`,
    `top: ${element.y}px`,
    element.width ? `width: ${element.width}px` : '',
    element.height ? `height: ${element.height}px` : '',
    `font-size: ${element.fontSize}px`,
    `font-family: ${element.fontFamily || 'Arial, sans-serif'}`,
    `font-weight: ${element.fontWeight || 'normal'}`,
    `color: ${element.color || '#000000'}`,
    `text-align: ${element.textAlign || 'left'}`,
    `z-index: ${element.zIndex || 1}`,
    textShadow ? `text-shadow: ${textShadow}` : '',
    webkitTextStroke ? `-webkit-text-stroke: ${webkitTextStroke}` : '',
    element.whiteSpace ? `white-space: ${element.whiteSpace}` : 'white-space: nowrap',
  ].filter(Boolean).join('; ');

  return `<div class="element text-element" style="${style}">${content}</div>`;
}

function generateRectangleElement(element: any): string {
  const style = [
    'position: absolute',
    `left: ${element.x}px`,
    `top: ${element.y}px`,
    `width: ${element.width}px`,
    `height: ${element.height}px`,
    `background-color: ${element.backgroundColor || '#FFFFFF'}`,
    element.borderColor ? `border: ${element.borderWidth || 1}px solid ${element.borderColor}` : '',
    element.borderRadius ? `border-radius: ${element.borderRadius}px` : '',
    `z-index: ${element.zIndex || 1}`,
  ].filter(Boolean).join('; ');

  return `<div class="element rectangle-element" style="${style}"></div>`;
}
