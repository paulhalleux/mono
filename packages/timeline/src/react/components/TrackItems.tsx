import React, { memo } from "react";

import { ItemInstance, TrackInstance } from "../../core/types.ts";
import { useTimelineStore } from "../adapter.ts";

import { TrackProvider } from "./Track.tsx";

export type TrackItemsProps = {
  children: (item: ItemInstance, track: TrackInstance) => React.ReactNode;
};

export const TrackItems = memo(function TrackItems({
  children,
}: TrackItemsProps) {
  const track = React.use(TrackProvider);
  const items = useTimelineStore(() => track?.getVisibleItems() || []);

  if (!track) return null;

  return items.map((item) => (
    <ItemConsumer key={item} itemId={item}>
      {children}
    </ItemConsumer>
  ));
});

const ItemConsumer = memo(function ItemConsumer({
  itemId,
  children,
}: TrackItemsProps & { itemId: string }) {
  const track = React.use(TrackProvider);
  const item = useTimelineStore(() => track?.getItemById(itemId));
  if (!track || !item) return null;
  return children(item, track);
});
