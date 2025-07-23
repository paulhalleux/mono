import React, { memo, useMemo } from "react";
import { clsx } from "clsx";

import { TrackInstance } from "../../core/types.ts";

import styles from "./Track.module.css";

export type TrackProps = React.PropsWithChildren<{
  track: TrackInstance;
}> &
  React.ComponentPropsWithoutRef<"div">;

export const TrackProvider = React.createContext<TrackInstance | null>(null);

export const Track = memo(function Track({
  children,
  track,
  style,
  className,
  ...rest
}: TrackProps) {
  return (
    <TrackProvider value={track}>
      <div
        style={useMemo(
          () => ({
            height: track.height,
            top: track.top,
            ...style,
          }),
          [style, track.height, track.top],
        )}
        className={clsx(styles.track, className)}
        {...rest}
        {...track.attributes}
      >
        {children}
      </div>
    </TrackProvider>
  );
});
