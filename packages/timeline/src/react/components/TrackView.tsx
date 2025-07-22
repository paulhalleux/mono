import React, { memo, useMemo } from "react";
import { clsx } from "clsx";

import { useTimelineStore } from "../adapter.ts";

import styles from "./TrackView.module.css";

export type TrackViewProps = React.PropsWithChildren &
  React.ComponentPropsWithoutRef<"div">;

export const TrackView = memo(function TrackView({
  children,
  style,
  className,
  ...rest
}: TrackViewProps) {
  const viewportWidth = useTimelineStore(
    (state) => state.viewportState.viewportWidth,
  );

  const timelineWidth = useTimelineStore(
    (state) => state.viewportState.timelineWidth,
  );

  const timePositionOffsetPx = useTimelineStore(
    (state) => state.viewportState.timePositionOffsetPx,
  );

  return (
    <div
      style={useMemo(
        () => ({
          width: viewportWidth,
          ...style,
        }),
        [style, viewportWidth],
      )}
      className={clsx(styles["track-view"], className)}
      {...rest}
    >
      <div
        style={useMemo(
          () => ({
            transform: `translateX(${-timePositionOffsetPx}px)`,
            width: timelineWidth,
          }),
          [timePositionOffsetPx, timelineWidth],
        )}
        className={styles["translate-container"]}
      >
        {children}
      </div>
    </div>
  );
});
