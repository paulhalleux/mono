import React, { useMemo } from "react";
import { clsx } from "clsx";

import { TimelineApi, TimelineState } from "../../core/types.ts";
import { useTimelineStore } from "../adapter.ts";

import styles from "./TrackHeader.module.css";

export type TrackHeaderProps = React.PropsWithChildren &
  React.ComponentPropsWithoutRef<"div">;

const trackHeaderWidthSelector = (_: TimelineState, api: TimelineApi) =>
  api.options.trackHeaderWidth;

export const TrackHeader = React.memo(function TrackHeader({
  children,
  style,
  className,
  ...rest
}: TrackHeaderProps) {
  const trackHeaderWidth = useTimelineStore(trackHeaderWidthSelector);

  return (
    <div
      style={useMemo(
        () => ({
          width: trackHeaderWidth,
          ...style,
        }),
        [style, trackHeaderWidth],
      )}
      className={clsx(styles["track-header"], className)}
      {...rest}
    >
      {children}
    </div>
  );
});
