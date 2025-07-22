import React, { memo } from "react";

import { useTimelineStore } from "../adapter.ts";

export type ViewportProps = React.PropsWithChildren<{
  ref: (instance: HTMLElement | null) => void;
}> &
  React.ComponentPropsWithoutRef<"div">;

export const Viewport = memo(function Viewport({
  children,
  ref,
  ...rest
}: ViewportProps) {
  const totalHeight = useTimelineStore(
    (state) => state.viewportState.virtualizedTracks.totalHeight,
  );

  return (
    <div
      ref={ref}
      style={{
        overflow: "auto",
      }}
      {...rest}
    >
      <div style={{ height: totalHeight }}>{children}</div>
    </div>
  );
});
