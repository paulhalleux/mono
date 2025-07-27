import React from "react";

import { useTimelineStore } from "../adapter.ts";

export const SnapLines = React.memo(function SnapLines() {
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
            left: snapIn,
            position: "absolute",
            height: "100%",
            width: 1,
            backgroundColor: "white",
          }}
        />
      )}
      {snapOut && !snapIn && (
        <div
          className="timeline-snap-line"
          style={{
            left: snapOut,
            position: "absolute",
            height: "100%",
            width: 1,
            backgroundColor: "white",
          }}
        />
      )}
    </>
  );
});
