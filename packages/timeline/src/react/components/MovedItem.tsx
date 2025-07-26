import React from "react";
import { clsx } from "clsx";

import { useTimelineStore } from "../adapter.ts";

import { Timeline } from "./Timeline.tsx";
import { TrackProvider } from "./Track.tsx";

import styles from "./MovedItem.module.css";

export type MovedItemProps = React.ComponentProps<"div">;

export const MovedItem = React.memo(function MovedItem({
  className,
  ...rest
}: MovedItemProps) {
  const track = React.use(TrackProvider);

  const itemDragState = useTimelineStore((state) => state.itemDragState);
  const itemDuration = useTimelineStore((_, api) => {
    if (!itemDragState || !track) return undefined;
    return api.getItemByIndex(
      itemDragState.item.trackId,
      itemDragState.item.index,
    )?.duration;
  });

  if (
    !track ||
    itemDuration === undefined ||
    !itemDragState ||
    itemDragState.currentTrackId !== track.id
  ) {
    return null;
  }

  return (
    <Timeline.Positioned
      className={clsx(styles["moved-item"], className)}
      timeIn={
        itemDragState.mousePosition.time - itemDragState.clientOffset.time
      }
      duration={itemDuration}
      {...rest}
    />
  );
});
