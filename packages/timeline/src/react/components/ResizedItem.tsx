import React from "react";
import { clsx } from "clsx";

import { useTimelineStore } from "../adapter.ts";

import { Timeline } from "./Timeline.tsx";
import { TrackProvider } from "./Track.tsx";

import styles from "./ResizedItem.module.css";

export type ResizedItemProps = React.ComponentProps<"div">;

export const ResizedItem = React.memo(function ResizedItem({
  className,
  ...rest
}: ResizedItemProps) {
  const trackId = React.use(TrackProvider);

  const track = useTimelineStore((_, api) => api.getTrackById(trackId));
  const dragEvent = useTimelineStore((state) => state.itemDragState?.event);
  const dragItem = useTimelineStore((state) => state.itemDragState?.item);

  const item = useTimelineStore((_, api) => {
    if (!dragEvent || !track || !dragItem || dragEvent.type !== "resize")
      return undefined;
    return api.getItemById(dragItem.id);
  });

  if (
    !track ||
    !item ||
    !dragEvent ||
    track.id !== dragItem?.trackId ||
    dragEvent.type !== "resize"
  ) {
    return null;
  }

  return (
    <Timeline.Positioned
      className={clsx(styles["resized-item"], className)}
      timeIn={dragEvent.timeIn}
      duration={dragEvent.duration}
      {...rest}
    />
  );
});
