'use client';

import React from 'react';
import { getStatAbbreviation } from '@/lib/stats-calculator';

interface CardPreviewProps {
  template: any;
  cardData: {
    player: {
      name?: string;
      team?: string;
      position?: string;
      jerseyNumber?: string | number;
      year?: number;
      throws?: 'left' | 'right' | string;
    };
    stats?: Record<string, number | string>;
    imageUrl?: string;
    customFields?: {
      careerHighlights?: string;
      [key: string]: any;
    };
  };
}

export default function CardPreview({ template, cardData }: CardPreviewProps) {
  if (!template) {
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 min-h-[400px] flex items-center justify-center">
        <p className="text-gray-500">Select a template to see preview</p>
      </div>
    );
  }

  // Parse JSON if it's a string, with error handling
  let frontLayout: any = {};
  let backLayout: any = {};
  
  try {
    frontLayout = typeof template.frontJson === 'string' 
      ? JSON.parse(template.frontJson) 
      : (template.frontJson || {});
  } catch (e) {
    console.error('Error parsing frontJson:', e);
    frontLayout = template.frontJson || {};
  }
  
  try {
    backLayout = typeof template.backJson === 'string'
      ? JSON.parse(template.backJson)
      : (template.backJson || {});
  } catch (e) {
    console.error('Error parsing backJson:', e);
    backLayout = template.backJson || {};
  }

  const renderElement = (element: any, side: 'front' | 'back') => {
    if (!element.visible) return null;

    switch (element.type) {
      case 'text':
        return renderTextElement(element, side);
      case 'image':
        return renderImageElement(element, side);
      case 'stat':
        return renderStatElement(element, side);
      case 'rectangle':
        return renderRectangleElement(element, side);
      default:
        return null;
    }
  };

  const renderTextElement = (element: any, side: 'front' | 'back') => {
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
      // Handle both with and without # prefix - replace all occurrences
      const jerseyNum = cardData.player?.jerseyNumber?.toString() || '';
      content = content.replace(/\{\{player\.jerseyNumber\}\}/g, jerseyNum);
    }
    if (content.includes('{{player.year}}')) {
      content = content.replace('{{player.year}}', cardData.player?.year?.toString() || '');
    }
    if (content.includes('{{player.throws}}')) {
      const throws = cardData.player?.throws || '';
      content = content.replace('{{player.throws}}', throws ? throws.charAt(0).toUpperCase() + throws.slice(1) : '');
    }
    if (content.includes('{{customFields.careerHighlights}}')) {
      content = content.replace('{{customFields.careerHighlights}}', (cardData as any).customFields?.careerHighlights || 'No highlights available');
    }
    if (content.includes('Player Name')) {
      content = content.replace('Player Name', cardData.player?.name || 'Player Name');
    }
    if (content.includes('Team • Position')) {
      const team = cardData.player?.team || '';
      const position = cardData.player?.position || '';
      const teamPosition = team && position ? `${team} • ${position}` : team || position || 'Team • Position';
      content = content.replace('Team • Position', teamPosition);
    }

    const textShadow = element.textShadow || (element.textOutline ? `0 0 ${element.textOutlineWidth || 3}px ${element.textOutlineColor || '#000000'}, 0 0 ${element.textOutlineWidth || 3}px ${element.textOutlineColor || '#000000'}` : '');
    const webkitTextStroke = element.textOutline ? `${element.textOutlineWidth || 2}px ${element.textOutlineColor || '#000000'}` : '';

    const style: React.CSSProperties = {
      position: 'absolute',
      left: `${element.x}px`,
      top: `${element.y}px`,
      width: element.width ? `${element.width}px` : undefined,
      height: element.height ? `${element.height}px` : undefined,
      fontSize: `${element.fontSize}px`,
      fontFamily: element.fontFamily || 'Arial, sans-serif',
      fontWeight: element.fontWeight || 'normal',
      color: element.color || '#000000',
      textAlign: element.textAlign || 'left',
      zIndex: element.zIndex || 1,
      textShadow: textShadow || undefined,
      WebkitTextStroke: webkitTextStroke || undefined,
      whiteSpace: element.whiteSpace || 'nowrap',
      overflow: element.overflow || 'visible',
      backgroundColor: element.backgroundColor || undefined,
      padding: element.padding || undefined,
      borderRadius: element.borderRadius || undefined,
    };

    return (
      <div key={element.id} style={style}>
        {content}
      </div>
    );
  };

  const renderImageElement = (element: any, side: 'front' | 'back') => {
    // Don't render image elements for Donruss style front - it's handled specially
    const isDonrussStyle = 
      template?.frontJson?.borderWidth !== undefined || 
      template?.frontJson?.innerPadding !== undefined ||
      template?.name?.toLowerCase().includes('donruss') ||
      template?.id?.includes('donruss');
    
    if (isDonrussStyle && side === 'front' && (element.id === 'player-photo' || element.type === 'image')) {
      return null; // Photo is rendered in the Donruss card structure
    }
    
    let src = '';
    if (element.src && element.src !== '' && !element.src.includes('{{')) {
      const url = element.src.trim();
      if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('/')) {
        src = url;
      }
    }
    if (!src && cardData.imageUrl) {
      const url = cardData.imageUrl.trim();
      if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('/')) {
        src = url;
      }
    }

    if (!src) return null;

    const style: React.CSSProperties = {
      position: 'absolute',
      left: `${element.x}px`,
      top: `${element.y}px`,
      width: `${element.width}px`,
      height: `${element.height}px`,
      objectFit: element.objectFit || 'cover',
      zIndex: element.zIndex || 1,
    };

    return (
      <img
        key={element.id}
        src={src}
        alt=""
        style={style}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  };

  const renderStatElement = (element: any, side: 'front' | 'back') => {
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
    
    const label = element.label || statKey;
    const content = element.format === 'label-value'
      ? `${label}: ${statValue}`
      : element.format === 'value-only'
      ? `${statValue}`
      : `${label}: ${statValue}`;

    // Don't render if stat value is empty, null, or undefined (except for year which might be 0)
    if ((statValue === '' || statValue === null || statValue === undefined) && statKey !== 'year') {
      return null;
    }

    const textShadow = element.textShadow || (element.textOutline ? `0 0 ${element.textOutlineWidth || 3}px ${element.textOutlineColor || '#000000'}, 0 0 ${element.textOutlineWidth || 3}px ${element.textOutlineColor || '#000000'}` : '');
    const webkitTextStroke = element.textOutline ? `${element.textOutlineWidth || 2}px ${element.textOutlineColor || '#000000'}` : '';

    const style: React.CSSProperties = {
      position: 'absolute',
      left: `${element.x}px`,
      top: `${element.y}px`,
      width: element.width ? `${element.width}px` : undefined,
      height: element.height ? `${element.height}px` : undefined,
      fontSize: `${element.fontSize}px`,
      fontFamily: element.fontFamily || 'Arial, sans-serif',
      fontWeight: element.fontWeight || 'normal',
      color: element.color || '#000000',
      textAlign: element.textAlign || 'left',
      zIndex: element.zIndex || 1,
      textShadow: textShadow || undefined,
      WebkitTextStroke: webkitTextStroke || undefined,
      whiteSpace: element.whiteSpace || 'nowrap',
    };

    return (
      <div key={element.id} style={style}>
        {content}
      </div>
    );
  };

  const renderRectangleElement = (element: any, side: 'front' | 'back') => {
    const style: React.CSSProperties = {
      position: 'absolute',
      left: `${element.x}px`,
      top: `${element.y}px`,
      width: `${element.width}px`,
      height: `${element.height}px`,
      backgroundColor: element.backgroundColor || '#FFFFFF',
      border: element.borderColor ? `${element.borderWidth || 1}px solid ${element.borderColor}` : undefined,
      borderRadius: element.borderRadius ? `${element.borderRadius}px` : undefined,
      zIndex: element.zIndex || 1,
    };

    return (
      <div key={element.id} style={style} />
    );
  };

  const renderCard = (layout: any, side: 'front' | 'back') => {
    // Check if this is a Donruss-style card with border and inner structure
    // Also check by template name or ID for Donruss
    const isDonrussStyle = 
      layout.borderWidth !== undefined || 
      layout.innerPadding !== undefined ||
      template?.name?.toLowerCase().includes('donruss') ||
      template?.id?.includes('donruss') ||
      template?.id === 'donruss-1991-style';
    
    
    if (isDonrussStyle && side === 'front') {
      // Render Donruss '91 style card
      const borderWidth = layout.borderWidth || 12;
      const innerPadding = layout.innerPadding || 6;
      const innerWidth = layout.width - (borderWidth * 2);
      const innerHeight = layout.height - (borderWidth * 2);
      
      // Find photo element
      const photoElement = (layout.elements || []).find((el: any) => el.id === 'player-photo' || el.type === 'image');
      const nameElement = (layout.elements || []).find((el: any) => el.id === 'player-name');
      const positionElement = (layout.elements || []).find((el: any) => el.id === 'player-position');
      
      // Validate imageUrl - ensure it's a valid URL, not HTML
      let photoSrc = '';
      if (cardData.imageUrl) {
        const url = cardData.imageUrl.trim();
        // Check if it looks like a valid URL (starts with http:// or https://)
        if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('/')) {
          photoSrc = url;
        }
      }
      if (!photoSrc && photoElement?.src) {
        const url = photoElement.src.trim();
        if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('/')) {
          photoSrc = url;
        }
      }
      
      return (
        <div
          key={side}
          style={{
            width: `${layout.width}px`,
            height: `${layout.height}px`,
            backgroundColor: layout.backgroundColor || '#3f7f4f',
            padding: `${borderWidth}px`,
            boxSizing: 'border-box',
            borderRadius: '4px',
            position: 'relative',
            fontFamily: 'sans-serif',
          }}
        >
          {/* Inner white card */}
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: layout.innerBackgroundColor || '#FFFFFF',
              padding: `${innerPadding}px`,
              boxSizing: 'border-box',
              position: 'relative',
              borderRadius: '3px',
            }}
          >
            {/* Photo area */}
            <div
              style={{
                width: '100%',
                height: '78%',
                backgroundColor: '#ccc',
                borderRadius: '2px',
                backgroundImage: photoSrc ? `url('${photoSrc}')` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                marginBottom: '6px',
              }}
            />
            
            {/* Diagonal banner */}
            <div
              style={{
                position: 'absolute',
                bottom: `${innerPadding}px`,
                left: `${innerPadding}px`,
                width: `calc(100% - ${innerPadding * 2}px)`,
                height: '22%',
                pointerEvents: 'none',
              }}
            >
              {/* Diagonal gradient background */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  bottom: 0,
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(10deg, #b4463f 60%, #4a90a6 60%)',
                  transform: 'skewY(-10deg)',
                  transformOrigin: 'bottom left',
                  zIndex: 1,
                }}
              />
              
              {/* Player name */}
              {nameElement && (
                <div
                  style={{
                    position: 'absolute',
                    left: '20px',
                    bottom: '40px',
                    zIndex: 2,
                    fontSize: `${nameElement.fontSize || 20}px`,
                    fontWeight: nameElement.fontWeight || 'bold',
                    color: nameElement.color || '#FFFFFF',
                  }}
                >
                  {cardData.player?.name || 'Player Name'}
                </div>
              )}
              
              {/* Position badge */}
              {positionElement && (
                <div
                  style={{
                    position: 'absolute',
                    right: '20px',
                    bottom: '20px',
                    zIndex: 2,
                    padding: positionElement.padding || '2px 8px',
                    backgroundColor: positionElement.backgroundColor || '#86a8b8',
                    borderRadius: positionElement.borderRadius || '2px',
                    fontSize: `${positionElement.fontSize || 14}px`,
                    color: positionElement.color || '#000000',
                  }}
                >
                  {cardData.player?.position || 'POSITION'}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
    
    // Standard card rendering for other templates or back side
    // Filter out image elements if this is a Donruss card (they're handled specially)
    let filteredElements = isDonrussStyle && side === 'front'
      ? (layout.elements || []).filter((el: any) => el.type !== 'image' || el.id !== 'player-photo')
      : (layout.elements || []);
    
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
        const titleIndex = filteredElements.findIndex((el: any) => el.id === 'stats-title');
        if (titleIndex >= 0) {
          filteredElements = [
            ...filteredElements.slice(0, titleIndex + 1),
            ...dynamicStats,
            ...filteredElements.slice(titleIndex + 1),
          ];
        } else {
          filteredElements = [...filteredElements, ...dynamicStats];
        }
      }
    }
    
    const elements = filteredElements
      .filter((el: any) => el.visible !== false) // Only filter out explicitly false
      .map((element: any) => renderElement(element, side))
      .filter((el: any) => el !== null); // Remove null elements
    
    // Validate imageUrl before using it
    let backgroundImage = layout.backgroundImage;
    if (side === 'front') {
      if (cardData.imageUrl) {
        const url = cardData.imageUrl.trim();
        if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('/')) {
          backgroundImage = url;
        }
      }
    } else {
      if ((cardData as any).backImageUrl) {
        const url = (cardData as any).backImageUrl.trim();
        if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('/')) {
          backgroundImage = url;
        }
      }
    }

    const cardStyle: React.CSSProperties = {
      width: `${layout.width}px`,
      height: `${layout.height}px`,
      backgroundColor: layout.backgroundColor || '#FFFFFF',
      backgroundImage: backgroundImage ? `url('${backgroundImage}')` : undefined,
      backgroundSize: backgroundImage ? 'cover' : undefined,
      backgroundPosition: backgroundImage ? 'center' : undefined,
      backgroundRepeat: backgroundImage ? 'no-repeat' : undefined,
      position: 'relative',
      overflow: 'hidden',
      margin: '0 auto',
      border: '1px solid #ccc',
      borderRadius: '8px',
    };

    return (
      <div key={side} style={cardStyle}>
        {elements}
      </div>
    );
  };

  // Calculate scale to fit preview area (increased card size)
  const frontCardWidth = frontLayout.width || 630;
  const backCardWidth = backLayout.width || 630;
  const frontScale = Math.min(0.8, 800 / frontCardWidth); // Increased from 0.595 to 0.8
  const backScale = Math.min(0.48, 480 / backCardWidth); // Reduced by 20% from 0.6 to 0.48

  return (
    <div className="flex gap-4 items-start">
      <div className="flex-1">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Front</h3>
        <div className="flex justify-center">
          <div style={{ transform: `scale(${frontScale})`, transformOrigin: 'top center' }}>
            {renderCard(frontLayout, 'front')}
          </div>
        </div>
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Back</h3>
        <div className="flex justify-center">
          <div style={{ transform: `scale(${backScale})`, transformOrigin: 'top center' }}>
            {renderCard(backLayout, 'back')}
          </div>
        </div>
      </div>
    </div>
  );
}

