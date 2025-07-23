import React, { useMemo } from "react";
import { clsx } from "clsx";

import { TimelineState } from "../../core/types.ts";
import { useTimelineStore } from "../adapter.ts";

import styles from "./RulerTicks.module.css";

export type RulerTicksProps = {
  children: (time: number) => React.ReactNode;
} & Omit<React.ComponentProps<"div">, "children">;

const viewportWidthSelector = (state: TimelineState) =>
  state.viewportState.viewportWidth;
const timelineWidthSelector = (state: TimelineState) =>
  state.viewportState.timelineWidth;
const timePositionOffsetPxSelector = (state: TimelineState) =>
  state.viewportState.timePositionOffsetPx;
const ticksSelector = (state: TimelineState) => state.ticks;

export function RulerTicks({
  children,
  className,
  style,
  ...rest
}: RulerTicksProps) {
  const viewportWidth = useTimelineStore(viewportWidthSelector);
  const timelineWidth = useTimelineStore(timelineWidthSelector);
  const timePositionOffsetPx = useTimelineStore(timePositionOffsetPxSelector);
  const ticks = useTimelineStore(ticksSelector);

  const ticksElements = useMemo(() => {
    return (
      <>
        {ticks.map((tick) => {
          return (
            <div
              key={tick.time}
              className={styles.tick}
              style={{
                width: tick.width,
                left: tick.left,
              }}
            >
              {children(tick.time)}
            </div>
          );
        })}
      </>
    );
  }, [ticks, children]);

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
        {ticksElements}
      </div>
    </div>
  );
}
