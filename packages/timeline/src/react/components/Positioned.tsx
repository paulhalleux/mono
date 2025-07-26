import React, { memo } from "react";

import { useTimelineStore } from "../adapter.ts";

export type PositionedProps = React.ComponentProps<"div"> & {
  timeIn: number;
  duration?: number;
};

export const Positioned = memo(function Positioned({
  timeIn,
  duration = 0,
  style,
  ...rest
}: PositionedProps) {
  const left = useTimelineStore((_, api) => api._internal.timeToLeft(timeIn));
  const width = useTimelineStore((_, api) =>
    api._internal.timeToWidth(duration),
  );

  const itemStyle: React.CSSProperties = React.useMemo(() => {
    return {
      position: "absolute",
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
