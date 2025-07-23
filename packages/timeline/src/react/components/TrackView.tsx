import React, { memo, useMemo } from "react";
import { clsx } from "clsx";

import {
  ItemInstance,
  TimelineState,
  TrackInstance,
} from "../../core/types.ts";
import { useTimelineStore } from "../adapter.ts";

import { TrackProvider } from "./Track.tsx";

import styles from "./TrackView.module.css";

export type TrackViewProps = {
  children: (item: ItemInstance, track: TrackInstance) => React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<"div">, "children">;

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

  const track = React.use(TrackProvider);
  const items = useTimelineStore(() => track?.getItems() || []);

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
            transform: `translateX(${timePositionOffsetPx}px)`,
            width: timelineWidth,
          }),
          [timePositionOffsetPx, timelineWidth],
        )}
        className={styles["translate-container"]}
      >
        {track &&
          items.map((item) => (
            <React.Fragment key={item.id}>
              {children(item, track)}
            </React.Fragment>
          ))}
      </div>
    </div>
  );
});
