import type { TextBox } from '@/components/campaign/CampaignWizard';

/**
 * Composite a background image with text boxes into a PNG blob
 * at the format's native resolution.
 */
export async function compositeAsset(
  imageUrl: string,
  textBoxes: TextBox[],
  width: number,
  height: number,
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Draw background image
  const img = await loadImage(imageUrl);
  ctx.drawImage(img, 0, 0, width, height);

  // Draw each text box
  for (const tb of textBoxes) {
    const bx = (tb.x / 100) * width;
    const by = (tb.y / 100) * height;
    const bw = (tb.width / 100) * width;
    const bh = (tb.height / 100) * height;

    ctx.save();

    // Text shadow for readability
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 1;

    ctx.fillStyle = tb.color;
    ctx.font = `${tb.fontWeight} ${tb.fontSize}px ${tb.fontFamily}, sans-serif`;
    ctx.textAlign = tb.textAlign;
    ctx.textBaseline = 'top';

    // Compute x origin based on textAlign
    let textX = bx;
    if (tb.textAlign === 'center') textX = bx + bw / 2;
    else if (tb.textAlign === 'right') textX = bx + bw;

    // Word wrap
    const lines = wrapText(ctx, tb.text, bw);
    const lineHeight = tb.fontSize * 1.2;
    for (let i = 0; i < lines.length; i++) {
      const ly = by + i * lineHeight;
      if (ly + lineHeight > by + bh) break; // Don't overflow the box
      ctx.fillText(lines[i], textX, ly);
    }

    ctx.restore();
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas toBlob failed'));
    }, 'image/png');
  });
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.length > 0 ? lines : [''];
}
