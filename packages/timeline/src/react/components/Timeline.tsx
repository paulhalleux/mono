import React from "react";
import { clsx } from "clsx";

import { TimelineApi } from "../../core/types.ts";
import { TimelineProvider } from "../adapter.ts";

import { Item } from "./Item.tsx";
import { MovedItem } from "./MovedItem.tsx";
import { Overlay } from "./Overlay.tsx";
import { Positioned } from "./Positioned.tsx";
import { Ruler } from "./Ruler.tsx";
import { RulerHeader } from "./RulerHeader.tsx";
import { RulerTicks } from "./RulerTicks.tsx";
import { RulerView } from "./RulerView.tsx";
import { Track } from "./Track.tsx";
import { TrackHeader } from "./TrackHeader.tsx";
import { TrackItems } from "./TrackItems.tsx";
import { TrackOverlay } from "./TrackOverlay.tsx";
import { Tracks } from "./Tracks.tsx";
import { TrackView } from "./TrackView.tsx";
import { Viewport } from "./Viewport.tsx";

import styles from "./Timeline.module.css";

export type TimelineProps = React.PropsWithChildren<{
  timeline?: TimelineApi;
}> &
  React.ComponentProps<"div">;

export function Timeline({
  children,
  className,
  timeline,
  ...rest
}: TimelineProps) {
  const timelineContext = React.use(TimelineProvider);
  const tl = timelineContext || timeline;
  if (!tl) {
    throw new Error("Timeline context or timeline prop is required");
  }
  return (
    <div className={clsx(styles.timeline, className)} {...rest}>
      <TimelineProvider value={tl}>{children}</TimelineProvider>
    </div>
  );
}

Timeline.Tracks = Tracks;
Timeline.Track = Track;
Timeline.TrackView = TrackView;
Timeline.TrackHeader = TrackHeader;
Timeline.Viewport = Viewport;
Timeline.Item = Item;
Timeline.Ruler = Ruler;
Timeline.RulerHeader = RulerHeader;
Timeline.RulerTicks = RulerTicks;
Timeline.RulerView = RulerView;
Timeline.Overlay = Overlay;
Timeline.TrackOverlay = TrackOverlay;
Timeline.TrackItems = TrackItems;
Timeline.Positioned = Positioned;
Timeline.MovedItem = MovedItem;
