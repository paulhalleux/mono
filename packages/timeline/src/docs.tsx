import { useCallback, useState } from "react";

import { createTimeline } from "./core/timeline.ts";
import { TimelineOptions } from "./core/types.ts";

const useTimeline = (options: TimelineOptions) => {
  const [timeline] = useState(() => createTimeline(options));

  const timelineRef = useCallback(
    (instance: HTMLElement | null) => {
      if (instance) {
        timeline.mount(instance);
        return () => {
          timeline.unmount();
        };
      }
    },
    [timeline],
  );

  return { timeline, timelineRef };
};

export function Docs() {
  const { timeline, timelineRef } = useTimeline({});

  const timePosition = timeline.store(() => timeline.getTimePosition());
  const viewport = timeline.store((st) => {
    return st.viewportState;
  });

  const getItemOffsetPx = timeline.store(() => timeline.getItemOffsetPx);
  const getItemWidthPx = timeline.store(() => timeline.getItemWidthPx);

  return (
    <div
      style={{
        background: "#1e1e1e",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100%",
        overflow: "hidden",
        gap: "10px",
        padding: "10px",
        color: "#ffffff",
      }}
    >
      <div
        style={{
          background: "#2e2e2e",
          height: "50%",
          borderRadius: "5px",
        }}
      >
        <pre>{JSON.stringify(viewport, null, 2)}</pre>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={viewport.zoomLevel}
          onChange={(e) => timeline.setZoomLevel(Number(e.target.value))}
        />
        <input
          type="range"
          min="0"
          max={1000 * 60 * 10}
          step="1"
          value={timePosition}
          onChange={(e) => timeline.setTimePosition(Number(e.target.value))}
        />
      </div>
      <div
        style={{
          background: "#2e2e2e",
          borderRadius: "5px",
          height: "50%",
          overflow: "hidden",
        }}
        ref={timelineRef}
      >
        <div
          style={{
            width: viewport.timelineWidth,
            height: "100%",
            transform: `translateX(-${viewport.timePositionOffsetPx}px)`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: getItemOffsetPx(0),
              width: getItemWidthPx(1000 * 60 * 5),
              height: "25px",
              backgroundColor: "#ff5722",
            }}
          >
            Item 1
          </div>
          <div
            style={{
              position: "absolute",
              left: getItemOffsetPx(1000 * 60 * 10),
              width: getItemWidthPx(1000 * 60 * 5),
              height: "25px",
              backgroundColor: "#2196f3",
            }}
          >
            Item 2
          </div>
        </div>
      </div>
    </div>
  );
}
