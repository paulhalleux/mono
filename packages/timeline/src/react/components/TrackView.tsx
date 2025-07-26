import React, { memo, useMemo } from "react";
import { clsx } from "clsx";

import { TimelineState } from "../../core/types.ts";
import { useTimelineStore } from "../adapter.ts";

import styles from "./TrackView.module.css";

export type TrackViewProps = React.ComponentProps<"div">;

const viewportWidthSelector = (state: TimelineState) =>
  state.viewportState.viewportWidth;
const timelineWidthSelector = (state: TimelineState) =>
  state.viewportState.timelineWidth;
const timePositionOffsetPxSelector = (state: TimelineState) =>
  state.viewportState.timePositionOffsetPx;

export const TrackView = memo(function TrackView({
  children,
  style,
  className,
  ...rest
}: TrackViewProps) {
  const viewportWidth = useTimelineStore(viewportWidthSelector);
  const timelineWidth = useTimelineStore(timelineWidthSelector);
  const timePositionOffsetPx = useTimelineStore(timePositionOffsetPxSelector);
  return (
    <div
      className={clsx(styles["track-view"], className)}
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
        className={styles["translate-container"]}
        style={useMemo(
          () => ({
            transform: `translateX(${timePositionOffsetPx}px)`,
            width: timelineWidth,
          }),
          [timePositionOffsetPx, timelineWidth],
        )}
      >
        {children}
      </div>
    </div>
  );
});
