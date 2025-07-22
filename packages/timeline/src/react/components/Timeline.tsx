import React from "react";

import { TimelineApi } from "../../core/types.ts";
import { TimelineProvider } from "../adapter.ts";

import { Item } from "./Item.tsx";
import { Ruler } from "./Ruler.tsx";
import { RulerHeader } from "./RulerHeader.tsx";
import { RulerTicks } from "./RulerTicks.tsx";
import { Track } from "./Track.tsx";
import { TrackHeader } from "./TrackHeader.tsx";
import { Tracks } from "./Tracks.tsx";
import { TrackView } from "./TrackView.tsx";
import { Viewport } from "./Viewport.tsx";

export type TimelineProps = React.PropsWithChildren<{
  timeline: TimelineApi;
}>;

export function Timeline({ timeline, children }: TimelineProps) {
  return <TimelineProvider value={timeline}>{children}</TimelineProvider>;
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
