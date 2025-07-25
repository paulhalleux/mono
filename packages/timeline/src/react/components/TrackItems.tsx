import React, { memo } from "react";

import { ItemInstance, TrackInstance } from "../../core/types.ts";
import { useTimelineStore } from "../adapter.ts";

import { TrackProvider } from "./Track.tsx";

export type TrackItemsProps = {
  children: (item: ItemInstance, track: TrackInstance) => React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<"div">, "children">;

export const TrackItems = memo(function TrackView({
  children,
  ...rest
}: TrackItemsProps) {
  const track = React.use(TrackProvider);
  const items = useTimelineStore(() => track?.getVisibleItems() || []);

  return (
    <div {...rest}>
      {track &&
        items.map((item) => (
          <React.Fragment key={item.id}>{children(item, track)}</React.Fragment>
        ))}
    </div>
  );
});
