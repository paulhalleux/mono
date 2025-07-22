import React, { memo, useMemo } from "react";
import { clsx } from "clsx";

import { useTimelineStore } from "../adapter.ts";

import styles from "./TrackHeader.module.css";

export type TrackHeaderProps = React.PropsWithChildren &
  React.ComponentPropsWithoutRef<"div">;

export const TrackHeader = memo(function TrackHeader({
  children,
  style,
  className,
  ...rest
}: TrackHeaderProps) {
  const trackHeaderWidth = useTimelineStore(
    (_, api) => api.options.trackHeaderWidth,
  );

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
