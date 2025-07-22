import React, { memo, useMemo } from "react";
import { clsx } from "clsx";

import { useTimelineStore } from "../adapter.ts";

import styles from "./Viewport.module.css";

export type ViewportProps = React.PropsWithChildren<{
  ref: (instance: HTMLElement | null) => void;
}> &
  React.ComponentPropsWithoutRef<"div">;

export const Viewport = memo(function Viewport({
  children,
  ref,
  className,
  ...rest
}: ViewportProps) {
  const totalHeight = useTimelineStore(
    (state) => state.viewportState.virtualizedTracks.totalHeight,
  );

  return (
    <div ref={ref} className={clsx(styles.viewport, className)} {...rest}>
      <div style={useMemo(() => ({ height: totalHeight }), [totalHeight])}>
        {children}
      </div>
    </div>
  );
});
