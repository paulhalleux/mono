import { memo } from "react";

import { useTimelineStore } from "../adapter.ts";

export const ZoneSelection = memo(function ZoneSelection() {
  const zoneSelection = useTimelineStore((state) => state.zoneSelection);

  if (
    !zoneSelection.active ||
    !zoneSelection.drawRect ||
    zoneSelection.drawRect.width < 2 ||
    zoneSelection.drawRect.height < 2
  ) {
    return null;
  }

  return (
    <div
      style={{
        pointerEvents: "none",
        backgroundColor: "rgba(255,255,255,0.3)",
        border: "1px solid #fff",
        position: "absolute",
        zIndex: 1000,
        ...zoneSelection.drawRect,
      }}
    />
  );
});
