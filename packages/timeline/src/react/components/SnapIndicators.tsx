import React from "react";

import { useTimelineStore } from "../adapter.ts";

export const SnapIndicators = React.memo(function SnapIndicators() {
  const snapIn = useTimelineStore((state, api) => {
    if (!state.itemDragState?.snap?.in) return undefined;
    return (
      api.timeToLeft(state.itemDragState.snap.in) -
      api.timeToLeft(api.getTimePosition())
    );
  });

  const snapOut = useTimelineStore((state, api) => {
    if (!state.itemDragState?.snap?.out) return undefined;
    return (
      api.timeToLeft(state.itemDragState.snap.out) -
      api.timeToLeft(api.getTimePosition())
    );
  });

  return (
    <>
      {snapIn && (
        <div
          className="timeline-snap-line"
          style={{
            left: snapIn - 7,
            position: "absolute",
            bottom: 0,
            zIndex: 10,
            width: 0,
            height: 0,
            borderLeft: "7px solid transparent",
            borderRight: "7px solid transparent",
            borderTop: "9px solid white",
            borderRadius: "3px",
          }}
        />
      )}
      {snapOut && !snapIn && (
        <div
          className="timeline-snap-line"
          style={{
            left: snapOut - 7,
            position: "absolute",
            bottom: 0,
            zIndex: 10,
            width: 0,
            height: 0,
            borderLeft: "7px solid transparent",
            borderRight: "7px solid transparent",
            borderTop: "9px solid white",
            borderRadius: "3px",
          }}
        />
      )}
    </>
  );
});
