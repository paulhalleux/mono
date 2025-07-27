import React, { useMemo } from "react";
import { clsx } from "clsx";

import { TimelineState } from "../../core/types.ts";
import { useTimelineStore } from "../adapter.ts";

import styles from "./Viewport.module.css";

export type ViewportProps = React.PropsWithChildren<{
  ref: (instance: HTMLElement | null) => void;
}> &
  React.ComponentPropsWithoutRef<"div">;

const totalHeightSelector = (state: TimelineState) =>
  state.viewportState.virtualizedTracks.totalHeight;

export const Viewport = React.memo(function Viewport({
  children,
  ref,
  className,
  ...rest
}: ViewportProps) {
  const totalHeight = useTimelineStore(totalHeightSelector);
  return (
    <div ref={ref} className={clsx(styles.viewport, className)} {...rest}>
      <div style={useMemo(() => ({ height: totalHeight }), [totalHeight])}>
        {children}
      </div>
    </div>
  );
});
