import React from "react";
import { clsx } from "clsx";

import { ItemInstance, TrackInstance } from "../../core/types.ts";
import { useTimelineStore } from "../adapter.ts";

import { Timeline } from "./Timeline.tsx";
import { TrackProvider } from "./Track.tsx";

import styles from "./MovedItem.module.css";

export type MovedItemProps = React.ComponentProps<"div"> & {
  canSwitchTrack?: (item: ItemInstance, track: TrackInstance) => boolean;
  canDrop?: (item: ItemInstance, track: TrackInstance) => boolean;
};

export const MovedItem = React.memo(function MovedItem({
  className,
  canSwitchTrack = () => true,
  canDrop = () => true,
  ...rest
}: MovedItemProps) {
  const trackId = React.use(TrackProvider);

  const track = useTimelineStore((_, api) => api.getTrackById(trackId));
  const dragEvent = useTimelineStore((state) => state.itemDragState?.event);
  const dragItem = useTimelineStore((state) => state.itemDragState?.item);
  const trackDropState = useTimelineStore((state) => state.trackDropState);

  const item = useTimelineStore((_, api) => {
    if (!dragEvent || !track || !dragItem || dragEvent.type !== "move")
      return undefined;
    return api.getItemById(dragItem.id);
  });

  if (!track || !item || !dragEvent || dragEvent.type !== "move") {
    return null;
  }

  const isCanDrop = canDrop(item, track);
  const isCanSwitchTrack = canSwitchTrack(item, track);

  if (
    !isCanDrop ||
    (!isCanSwitchTrack && track.id !== dragItem?.trackId) ||
    (isCanSwitchTrack && trackDropState?.trackId !== track.id)
  ) {
    return null;
  }

  return (
    <Timeline.Positioned
      className={clsx(styles["moved-item"], className)}
      timeIn={dragEvent.timeIn}
      duration={item.duration}
      {...rest}
    />
  );
});
