import React from "react";

import { useTimelineStore } from "../adapter.ts";

export type PositionedProps = React.ComponentProps<"div"> & {
  timeIn: number;
  duration?: number;
};

export const Positioned = React.memo(function Positioned({
  timeIn,
  duration = 0,
  style,
  ...rest
}: PositionedProps) {
  const left = useTimelineStore((_, api) => api.timeToLeft(timeIn));
  const width = useTimelineStore((_, api) => api.timeToWidth(duration));
  const itemStyle: React.CSSProperties = React.useMemo(() => {
    return {
      position: "absolute",
      height: "100%",
      left,
      width,
      ...style,
    };
  }, [left, width, style]);

  return (
    <div style={itemStyle} {...rest}>
      {rest.children}
    </div>
  );
});
