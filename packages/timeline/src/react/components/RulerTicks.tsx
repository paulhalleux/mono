import React, { useMemo } from "react";
import { clsx } from "clsx";

import { useTimelineStore } from "../adapter.ts";

import styles from "./RulerTicks.module.css";

export type RulerTicksProps = {
  children: (time: number) => React.ReactNode;
} & Omit<React.ComponentProps<"div">, "children">;

export function RulerTicks({
  children,
  className,
  style,
  ...rest
}: RulerTicksProps) {
  const viewport = useTimelineStore((state) => state.viewportState);
  const ticks = useTimelineStore((state) => state.ticks);
  return (
    <div
      className={clsx(styles["ruler-ticks"], className)}
      style={useMemo(
        () => ({
          width: viewport.viewportWidth,
          ...style,
        }),
        [style, viewport.viewportWidth],
      )}
      {...rest}
    >
      <div
        style={useMemo(
          () => ({
            transform: `translateX(${-viewport.timePositionOffsetPx}px)`,
            width: viewport.timelineWidth,
            height: "100%",
          }),
          [viewport.timePositionOffsetPx, viewport.timelineWidth],
        )}
      >
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
      </div>
    </div>
  );
}
