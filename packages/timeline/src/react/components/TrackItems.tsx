import React, { memo } from "react";

import { ItemInstance, TrackInstance } from "../../core/types.ts";
import { useTimelineStore } from "../adapter.ts";

import { TrackProvider } from "./Track.tsx";

export type TrackItemsProps = {
  children: (item: ItemInstance, track: TrackInstance) => React.ReactNode;
};

export const TrackItems = memo(function TrackView({
  children,
}: TrackItemsProps) {
  const track = React.use(TrackProvider);
  const items = useTimelineStore(() => track?.getVisibleItems() || []);

  if (!track) return null;

  return items.map((item) => (
    <React.Fragment key={item.id}>{children(item, track)}</React.Fragment>
  ));
});
