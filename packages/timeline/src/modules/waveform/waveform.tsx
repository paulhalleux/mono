import * as React from "react";
import { memo } from "react";

type WaveformSvgProps = {
  waveform: number[];
  width?: number;
  height?: number;
  barWidth?: number;
  barSpacing?: number;
};

const CANVAS_STYLE: React.CSSProperties = {
  position: "absolute",
  left: 0,
  top: 0,
  width: "100%",
  height: "100%",
  pointerEvents: "none",
};

export const Waveform: React.FC<WaveformSvgProps> = memo(
  ({ waveform, width = 800, height = 200, barWidth = 1, barSpacing = 0 }) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);

    React.useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas || waveform.length === 0) return;

      const dpr = window.devicePixelRatio || 1;
      const displayWidth = width;
      const displayHeight = height;
      canvas.width = displayWidth * dpr;
      canvas.height = displayHeight * dpr;
      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, displayWidth, displayHeight);

      ctx.fillStyle = "rgba(255,255,255,0.5)";

      const totalBarSpace = barWidth + barSpacing;
      const maxBars = Math.floor(displayWidth / totalBarSpace);
      let barsToDraw: number[] = [];

      if (waveform.length > maxBars) {
        // Too many samples: average them down
        const samplesPerBar = waveform.length / maxBars;
        for (let i = 0; i < maxBars; i++) {
          const start = Math.floor(i * samplesPerBar);
          const end = Math.floor((i + 1) * samplesPerBar);
          let sum = 0;
          let count = 0;
          for (let j = start; j < end; j++) {
            sum += waveform[j] ?? 0;
            count++;
          }
          barsToDraw.push(count > 0 ? sum / count : 0);
        }
      } else {
        // Fewer bars: use them and space/stretch accordingly
        barsToDraw = waveform;
      }

      const actualBarCount = barsToDraw.length;
      const totalWidthUsed = actualBarCount * totalBarSpace - barSpacing;
      const startX = (displayWidth - totalWidthUsed) / 2; // center bars

      for (let i = 0; i < actualBarCount; i++) {
        const value = barsToDraw[i];
        const barHeight = value * displayHeight;
        const x = startX + i * totalBarSpace;
        const y = (displayHeight - barHeight) / 2;

        ctx.fillRect(x, y, Math.max(1, barWidth), Math.max(1, barHeight));
      }
    }, [width, height, waveform, barWidth, barSpacing]);

    return <canvas style={CANVAS_STYLE} ref={canvasRef} />;
  },
);
