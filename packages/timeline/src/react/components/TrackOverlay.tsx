import React, { useMemo } from "react";
import { clsx } from "clsx";

import { TimelineApi, TimelineState } from "../../core/types.ts";
import { useTimelineStore } from "../adapter.ts";

import styles from "./TrackOverlay.module.css";

export type TrackProps = React.ComponentProps<"div">;

const trackHeaderWidthSelector = (_: TimelineState, api: TimelineApi) =>
  api.options.trackHeaderWidth;
const viewportWidthSelector = (state: TimelineState) =>
  state.viewportState.viewportWidth;

export const TrackOverlay = React.memo(function TrackOverlay({
  children,
  style,
  className,
  ...rest
}: TrackProps) {
  const trackHeaderWidth = useTimelineStore(trackHeaderWidthSelector);
  const viewportWidth = useTimelineStore(viewportWidthSelector);
  return (
    <div
      className={clsx(styles.overlay, className)}
      style={useMemo(
        () => ({
          left: trackHeaderWidth,
          width: viewportWidth,
          ...style,
        }),
        [style, trackHeaderWidth, viewportWidth],
      )}
      {...rest}
    >
      {children}
    </div>
  );
});
