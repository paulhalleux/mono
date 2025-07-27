import React, { useCallback } from "react";
import { clsx } from "clsx";

import { ItemDef, TrackDef } from "./core/types.ts";
import { Waveform } from "./modules/waveform/waveform.ts";
import { Waveform as WaveformComponent } from "./modules/waveform/waveform.tsx";
import {
  TimelineProvider,
  useTimeline,
  useTimelineApi,
  useTimelineStore,
} from "./react/adapter.ts";
import { ResizeHandle } from "./react/components/ResizeHandle.tsx";
import { Timeline } from "./react/components/Timeline.tsx";
import { RenderItem } from "./react/components/TrackItems.tsx";
import { ZoneSelection } from "./react/components/ZoneSelection.tsx";

const rulerHeight = 32;
const trackHeaderWidth = 320;
const tracks: TrackDef[] = Array.from({ length: 1 }).map((_, i) => ({
  index: i,
  id: `track-${i}`,
  height: 32,
}));

const items: ItemDef[] = tracks.flatMap((track) =>
  Array.from({ length: 10 })
    .map((_, i) => ({
      id: `${track.id}-item-${i}`,
      start: i * 57983,
      end: (i + 1) * 57983,
      trackId: track.id,
    }))
    .filter(() => Math.random() > 0.5),
);

export function Docs() {
  const [waveform, setWaveform] = React.useState<number[]>([]);

  const { timeline, timelineRef } = useTimeline({
    trackHeaderWidth,
    initialTracks: tracks,
    initialItems: items,
    rulerHeight,
    minTickIntervalWidth: 150,
    minVisibleDuration: 5000,
    maxVisibleDuration: 1000 * 60 * 10,
  });

  const renderTrackItem = useCallback<RenderItem>(
    (item, track) => (
      <Timeline.Item
        item={item}
        className={clsx("docs-timeline-item", {
          ["selected"]: item.isSelected,
          ["dragging"]: item.isDragging,
        })}
      >
        <ResizeHandle />
        {item.id}
        {waveform.length > 0 && (
          <WaveformComponent
            waveform={waveform}
            width={item.width}
            height={track.height}
          />
        )}
      </Timeline.Item>
    ),
    [waveform],
  );

  const renderTick = useCallback(
    (time: number) => (
      <div className="docs-tick">
        {millsToTime(time)}
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className={clsx("docs-subtick", {
              "docs-tick-line--small": i > 0,
            })}
            style={{
              left: `${(i + 1) * 10}%`,
            }}
          />
        ))}
      </div>
    ),
    [],
  );

  return (
    <TimelineProvider value={timeline}>
      <div className="docs-container">
        <div className="docs-box">
          <Controls waveform={waveform} setWaveform={setWaveform} />
        </div>
        <Timeline className="docs-box">
          <Timeline.Overlay>
            <ZoneSelection className="docs-zone-selection" />
          </Timeline.Overlay>
          <Timeline.Viewport ref={timelineRef}>
            <Timeline.Ruler className="docs-ruler">
              <Timeline.RulerHeader className="docs-ruler-header">
                Header
              </Timeline.RulerHeader>
              <Timeline.RulerView>
                <Timeline.RulerTicks>{renderTick}</Timeline.RulerTicks>
              </Timeline.RulerView>
            </Timeline.Ruler>
            <Timeline.Tracks>
              {(track) => (
                <Timeline.Track track={track} className="docs-track">
                  <Timeline.TrackHeader className="docs-track-header">
                    {track.id}
                  </Timeline.TrackHeader>
                  <Timeline.TrackView>
                    <Timeline.MovedItem className="docs-timeline-item" />
                    <Timeline.ResizedItem className="docs-timeline-item" />
                    <Timeline.TrackItems>{renderTrackItem}</Timeline.TrackItems>
                  </Timeline.TrackView>
                </Timeline.Track>
              )}
            </Timeline.Tracks>
          </Timeline.Viewport>
        </Timeline>
      </div>
    </TimelineProvider>
  );
}

const Controls = ({
  setWaveform,
}: {
  waveform: number[];
  setWaveform: (waveform: number[]) => void;
}) => {
  const timeline = useTimelineApi();
  const timePosition = useTimelineStore((_, api) => api.getTimePosition());
  const viewport = useTimelineStore((st) => st.viewportState);
  const trackDropState = useTimelineStore((st) => st.trackDropState);

  return (
    <>
      <pre>{JSON.stringify(trackDropState, null, 2)}</pre>
      <input
        type="range"
        min="0"
        max="1"
        step="0.001"
        value={viewport.zoomLevel}
        onChange={(e) => timeline.setZoomLevel(Number(e.target.value))}
      />
      <input
        type="range"
        min="0"
        max={1000 * 60 * 60}
        step="1"
        value={timePosition}
        onChange={(e) => timeline.setTimePosition(Number(e.target.value))}
      />
      <input
        type="file"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setWaveform(await Waveform.generate(await file.arrayBuffer()));
        }}
      />
    </>
  );
};

const millsToTime = (ms: number) => {
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((ms % (60 * 1000)) / 1000);
  const milliseconds = ms % 1000;

  const units = ["d", "h", "m", "s", "ms"];
  const values = [days, hours, minutes, seconds, milliseconds];

  return (
    values
      .map((value, index) => (value > 0 ? `${value}${units[index]}` : ""))
      .filter(Boolean)
      .join(" ") || ""
  );
};
