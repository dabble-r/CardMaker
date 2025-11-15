import puppeteer from 'puppeteer';
import { generateHTML } from '../template-engine';
import { CardLayout } from '../types';

export async function renderCard(
  template: { front: CardLayout; back: CardLayout },
  cardData: any,
  format: 'png' | 'jpeg' | 'pdf' = 'png',
): Promise<Buffer> {
  const html = generateHTML(template, cardData);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // Set viewport to match card dimensions (front card)
    const cardWidth = template.front.width;
    const cardHeight = template.front.height;
    const totalWidth = cardWidth * 2 + 40; // Two cards + gap
    const totalHeight = Math.max(cardHeight, template.back.height) + 40; // Max height + padding

    // Set viewport for high-resolution rendering (300 DPI)
    // 300 DPI = 3.125x scale factor (96 DPI base)
    const scale = 3.125;
    const scaledWidth = Math.ceil(totalWidth * scale);
    const scaledHeight = Math.ceil(totalHeight * scale);

    await page.setViewport({
      width: scaledWidth,
      height: scaledHeight,
      deviceScaleFactor: 1,
    });

    await page.setContent(html, { waitUntil: 'networkidle0' });

    let result: Buffer;

    if (format === 'pdf') {
      const pdf = await page.pdf({
        width: `${cardWidth}px`,
        height: `${cardHeight}px`,
        printBackground: true,
        margin: {
          top: '0',
          right: '0',
          bottom: '0',
          left: '0',
        },
      });
      result = Buffer.from(pdf);
    } else {
      // For PNG/JPEG, capture the full viewport
      const screenshot = await page.screenshot({
        type: format === 'jpeg' ? 'jpeg' : 'png',
        quality: format === 'jpeg' ? 95 : undefined,
        fullPage: false,
      });
      result = Buffer.from(screenshot);
    }

    return result;
  } finally {
    await browser.close();
  }
}

