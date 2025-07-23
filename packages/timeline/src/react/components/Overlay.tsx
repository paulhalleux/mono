import React, { memo } from "react";

import { TimelineApi, TimelineState } from "../../core/types.ts";
import { useTimelineStore } from "../adapter.ts";

export type OverlayProps = React.PropsWithChildren;

const trackHeaderWidthSelector = (_: TimelineState, api: TimelineApi) =>
  api.options.trackHeaderWidth;
const rulerHeightSelector = (_: TimelineState, api: TimelineApi) =>
  api.options.rulerHeight;

export const Overlay = memo(function Overlay({ children }: OverlayProps) {
  const trackHeaderWidth = useTimelineStore(trackHeaderWidthSelector);
  const rulerHeight = useTimelineStore(rulerHeightSelector);

  return (
    <div
      style={{
        position: "absolute",
        top: rulerHeight,
        left: trackHeaderWidth,
        width: "calc(100% - " + trackHeaderWidth + "px)",
        height: "calc(100% - " + rulerHeight + "px)",
        zIndex: 1000,
        overflow: "hidden",
        pointerEvents: "none", // Prevents interaction with the overlay
      }}
    >
      {children}
    </div>
  );
});
