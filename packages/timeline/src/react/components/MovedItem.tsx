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
  const track = React.use(TrackProvider);

  const itemDragState = useTimelineStore((state) => state.itemDragState);
  const trackDropState = useTimelineStore((state) => state.trackDropState);

  const item = useTimelineStore((_, api) => {
    if (!itemDragState || !track || itemDragState.type !== "move")
      return undefined;
    return api.getItemById(itemDragState.item.id);
  });

  if (!track || !item || !itemDragState || itemDragState.type !== "move") {
    return null;
  }

  const isCanDrop = canDrop(item, track);
  const isCanSwitchTrack = canSwitchTrack(item, track);

  if (
    !isCanDrop ||
    (!isCanSwitchTrack && track.id !== itemDragState.item.trackId) ||
    (isCanSwitchTrack && trackDropState?.trackId !== track.id)
  ) {
    return null;
  }

  return (
    <Timeline.Positioned
      className={clsx(styles["moved-item"], className)}
      timeIn={Math.max(
        0,
        itemDragState.mousePosition.time - itemDragState.clientOffset.time,
      )}
      duration={item.duration}
      {...rest}
    />
  );
});
