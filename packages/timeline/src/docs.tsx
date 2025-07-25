import React, { useCallback } from "react";
import { clsx } from "clsx";
import { useShallow } from "zustand/react/shallow";

import {
  ItemDef,
  ItemInstance,
  TrackDef,
  TrackInstance,
} from "./core/types.ts";
import { Waveform } from "./modules/waveform.ts";
import {
  TimelineProvider,
  useTimeline,
  useTimelineApi,
  useTimelineStore,
} from "./react/adapter.ts";
import { Timeline } from "./react/components/Timeline.tsx";
import { ZoneSelection } from "./react/components/ZoneSelection.tsx";
import { Waveform as WaveformComponent } from "./waveform.tsx";

const rulerHeight = 32;
const trackHeaderWidth = 320;
const tracks: TrackDef[] = Array.from({ length: 50 }).map((_, i) => ({
  id: `track-${i}`,
  height: 32,
}));

const items: ItemDef[] = tracks.flatMap((track) =>
  Array.from({ length: 200 })
    .map((_, i) => ({
      id: `${track.id}-item-${i}`,
      start: i * 1000 * 15,
      end: (i + 1) * 1000 * 15,
      trackId: track.id,
    }))
    .filter(() => Math.random() > 0.5),
);

export function Docs() {
  const [waveform, setWaveform] = React.useState<number[]>([]);
  const { timeline, timelineRef } = useTimeline({
    trackHeaderWidth,
    tracks,
    items,
    rulerHeight,
    minVisibleDuration: 5000,
  });

  const trackInstances = timeline.store(
    useShallow(() => timeline.getVisibleTracks()),
  );

  const renderTrackItem = useCallback(
    (item: ItemInstance, track: TrackInstance) => (
      <Timeline.Item
        key={item.id}
        item={item}
        className={clsx("docs-timeline-item", {
          ["selected"]: item.isSelected,
        })}
      >
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
              <Timeline.RulerTicks>{renderTick}</Timeline.RulerTicks>
            </Timeline.Ruler>
            <Timeline.Tracks>
              {trackInstances.map((track) => (
                <Timeline.Track
                  key={track.id}
                  track={track}
                  className="docs-track"
                >
                  <Timeline.TrackHeader className="docs-track-header">
                    {track.top}
                  </Timeline.TrackHeader>
                  <Timeline.TrackView>{renderTrackItem}</Timeline.TrackView>
                </Timeline.Track>
              ))}
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

  return (
    <>
      <pre>{JSON.stringify(viewport, null, 2)}</pre>
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

  const units = ["d", "h", "m", "s"];
  const values = [days, hours, minutes, seconds];

  return (
    values
      .map((value, index) => (value > 0 ? `${value}${units[index]}` : ""))
      .filter(Boolean)
      .join(" ") || ""
  );
};
