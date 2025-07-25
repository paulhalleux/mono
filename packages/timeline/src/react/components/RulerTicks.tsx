import React from "react";

import { TimelineState } from "../../core/types.ts";
import { useTimelineStore } from "../adapter.ts";

import styles from "./RulerTicks.module.css";

export type RulerTicksProps = {
  children: (time: number) => React.ReactNode;
};

const ticksSelector = (state: TimelineState) => state.ticks;

export function RulerTicks({ children }: RulerTicksProps) {
  const ticks = useTimelineStore(ticksSelector);

  return ticks.map((tick) => {
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
  });
}
