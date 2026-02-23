'use client';

import { useCallback, useRef } from 'react';
import type { TextLayer } from '@/lib/shared';

interface AutoFitResult {
  fontSize: number;
  overflow: boolean;
  lineCount: number;
}

interface MeasureTextOptions {
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  maxWidth: number;
  lineHeight: number;
}

export function useAutoFitText() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Get or create measurement canvas
  const getCanvas = useCallback(() => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    return canvasRef.current;
  }, []);

  // Measure text dimensions
  const measureText = useCallback(
    (options: MeasureTextOptions) => {
      const canvas = getCanvas();
      const ctx = canvas.getContext('2d');
      if (!ctx) return { width: 0, height: 0, lines: [] };

      ctx.font = `${options.fontWeight} ${options.fontSize}px ${options.fontFamily}`;

      const words = options.text.split(' ');
      const lines: string[] = [];
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const metrics = ctx.measureText(testLine);

        if (metrics.width > options.maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }

      if (currentLine) {
        lines.push(currentLine);
      }

      const lineHeightPx = options.fontSize * options.lineHeight;
      const height = lines.length * lineHeightPx;

      return {
        width: Math.max(...lines.map((line) => ctx.measureText(line).width)),
        height,
        lines,
      };
    },
    [getCanvas]
  );

  // Calculate auto-fit font size
  const calculateAutoFit = useCallback(
    (layer: TextLayer): AutoFitResult => {
      const {
        content,
        fontFamily,
        fontWeight,
        fontSize: originalFontSize,
        lineHeight,
        size,
        autoFitConfig,
      } = layer;

      if (!layer.autoFit || !content) {
        return {
          fontSize: originalFontSize,
          overflow: false,
          lineCount: 1,
        };
      }

      const config = autoFitConfig ?? {
        minFontSize: 12,
        maxFontSize: 72,
        strategy: 'shrink' as const,
      };

      // Start with max font size and shrink
      let testFontSize = Math.min(originalFontSize, config.maxFontSize);
      let result: AutoFitResult = {
        fontSize: testFontSize,
        overflow: false,
        lineCount: 1,
      };

      while (testFontSize >= config.minFontSize) {
        const measured = measureText({
          text: content,
          fontFamily,
          fontSize: testFontSize,
          fontWeight,
          maxWidth: size.width,
          lineHeight,
        });

        if (measured.height <= size.height) {
          result = {
            fontSize: testFontSize,
            overflow: false,
            lineCount: measured.lines.length,
          };
          break;
        }

        testFontSize--;
      }

      // Check if still overflowing at min font size
      if (testFontSize < config.minFontSize) {
        const measured = measureText({
          text: content,
          fontFamily,
          fontSize: config.minFontSize,
          fontWeight,
          maxWidth: size.width,
          lineHeight,
        });

        result = {
          fontSize: config.minFontSize,
          overflow: measured.height > size.height,
          lineCount: measured.lines.length,
        };
      }

      return result;
    },
    [measureText]
  );

  return {
    measureText,
    calculateAutoFit,
  };
}
