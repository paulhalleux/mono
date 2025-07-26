import React, { memo } from "react";
import { clsx } from "clsx";

import { TrackInstance } from "../../core/types.ts";
import { useTimelineStore } from "../adapter.ts";

import styles from "./Tracks.module.css";

export type TracksProps = {
  children: (track: TrackInstance) => React.ReactNode;
} & Omit<React.ComponentProps<"div">, "children">;

export const Tracks = memo(function Tracks({
  children,
  className,
  ...rest
}: TracksProps) {
  const trackInstances = useTimelineStore((_, api) => api.getVisibleTracks());
  return (
    <div className={clsx(styles.tracks, className)} {...rest}>
      {trackInstances.map((track) => (
        <TrackConsumer key={track} trackId={track}>
          {children}
        </TrackConsumer>
      ))}
    </div>
  );
});

const TrackConsumer = memo(function TrackConsumer({
  trackId,
  children,
}: {
  children: (track: TrackInstance) => React.ReactNode;
  trackId: string;
}) {
  const track = useTimelineStore((_, api) => api.getTrackById(trackId));
  if (!track) return null;
  return children(track);
});
