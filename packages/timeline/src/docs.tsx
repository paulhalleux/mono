import React from "react";
import { clsx } from "clsx";

import { ItemDef, TrackDef } from "./core/types.ts";
import { Waveform } from "./modules/waveform.ts";
import {
  useTimeline,
  useTimelineApi,
  useTimelineStore,
} from "./react/adapter.ts";
import { Timeline } from "./react/components/Timeline.tsx";
import { Waveform as WaveformComponent } from "./waveform.tsx";

const trackHeaderWidth = 200;
const tracks: TrackDef[] = Array.from({ length: 50 }).map((_, i) => ({
  id: `track-${i}`,
  height: 28,
}));

const items: ItemDef[] = tracks.flatMap((track) =>
  Array.from({ length: 200 }).map((_, i) => ({
    id: `${track.id}-item-${i}`,
    start: i * 1000 * 15,
    end: (i + 1) * 1000 * 15,
    trackId: track.id,
  })),
);

export function Docs() {
  const [waveform, setWaveform] = React.useState<number[]>([]);
  const { timeline, timelineRef } = useTimeline({
    trackHeaderWidth,
    tracks,
    items,
  });

  return (
    <div className="docs-container">
      <Timeline timeline={timeline}>
        <div className="docs-box">
          <Controls waveform={waveform} setWaveform={setWaveform} />
        </div>
        <Timeline.Viewport ref={timelineRef} className="docs-box">
          {/*<header*/}
          {/*  style={{*/}
          {/*    background: "#353535",*/}
          {/*    color: "#ffffff",*/}
          {/*    height: "32px",*/}
          {/*    borderBottom: "1px solid #222222",*/}
          {/*  }}*/}
          {/*></header>*/}
          <Timeline.Tracks>
            {timeline.getTracks().map((track) => (
              <Timeline.Track
                key={track.id}
                track={track}
                className="docs-track"
              >
                <Timeline.TrackHeader className="docs-track-header">
                  {track.top}
                </Timeline.TrackHeader>
                <Timeline.TrackView>
                  {track.getItems().map((item) => {
                    return (
                      <Timeline.Item
                        key={item.id}
                        item={item}
                        className={clsx("docs-timeline-item", {
                          ["selected"]: item.isSelected(),
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
                    );
                  })}
                </Timeline.TrackView>
              </Timeline.Track>
            ))}
          </Timeline.Tracks>
        </Timeline.Viewport>
      </Timeline>
    </div>
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
