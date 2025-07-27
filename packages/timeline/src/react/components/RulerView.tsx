import React, { useMemo } from "react";
import { clsx } from "clsx";

import { TimelineState } from "../../core/types.ts";
import { useTimelineStore } from "../adapter.ts";

import styles from "./RulerView.module.css";

export type RulerViewProps = React.ComponentProps<"div">;

const viewportWidthSelector = (state: TimelineState) =>
  state.viewportState.viewportWidth;
const timelineWidthSelector = (state: TimelineState) =>
  state.viewportState.timelineWidth;
const timePositionOffsetPxSelector = (state: TimelineState) =>
  state.viewportState.timePositionOffsetPx;

export const RulerView = React.memo(function RulerView({
  children,
  className,
  style,
  ...rest
}: RulerViewProps) {
  const viewportWidth = useTimelineStore(viewportWidthSelector);
  const timelineWidth = useTimelineStore(timelineWidthSelector);
  const timePositionOffsetPx = useTimelineStore(timePositionOffsetPxSelector);

  return (
    <div
      className={clsx(styles["ruler-ticks"], className)}
      style={useMemo(
        () => ({
          width: viewportWidth,
          ...style,
        }),
        [style, viewportWidth],
      )}
      {...rest}
    >
      <div
        style={useMemo(
          () => ({
            transform: `translateX(${timePositionOffsetPx}px)`,
            width: timelineWidth,
            height: "100%",
          }),
          [timePositionOffsetPx, timelineWidth],
        )}
      >
        {children}
      </div>
    </div>
  );
});
