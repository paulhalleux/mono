import * as React from "react";
import { memo } from "react";

type WaveformSvgProps = {
  waveform: number[];
  width?: number;
  height?: number;
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
  ({ waveform, width = 800, height = 200 }) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const cbRef = React.useRef<number>(null);

    React.useEffect(() => {
      if (cbRef.current) {
        cancelIdleCallback(cbRef.current);
      }

      cbRef.current = requestIdleCallback(() => {
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

        ctx.fillStyle = "rgba(255,255,255,0.27)";

        const barCount = displayWidth; // One bar per pixel
        const step = waveform.length / barCount;

        for (let i = 0; i < barCount; i++) {
          const sampleIndex = Math.floor(i * step);
          const value = waveform[sampleIndex] ?? 0;
          const barHeight = value * displayHeight;
          const x = i;
          const y = (displayHeight - barHeight) / 2;

          ctx.fillRect(x, y, 1, barHeight); // 1px wide bar
        }
      });
    }, [width, height, waveform]);

    return <canvas style={CANVAS_STYLE} ref={canvasRef} />;
  },
);
