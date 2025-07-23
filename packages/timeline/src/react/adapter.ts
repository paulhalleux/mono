import React, { useCallback } from "react";
import { useShallow } from "zustand/react/shallow";

import { createTimeline } from "../core/timeline.ts";
import { TimelineApi, TimelineOptions, TimelineState } from "../core/types.ts";

export const useTimeline = (options: TimelineOptions) => {
  const [timeline] = React.useState(() => createTimeline(options));

  const timelineRef = React.useCallback(
    (instance: HTMLElement | null) => {
      if (instance) {
        timeline.mount(instance);
        return () => {
          timeline.unmount();
        };
      }
    },
    [timeline],
  );

  return { timeline, timelineRef };
};

export const TimelineProvider = React.createContext<TimelineApi | null>(null);
export const useTimelineStore = <T>(
  selector: (state: TimelineState, api: TimelineApi) => T,
) => {
  const timeline = React.useContext(TimelineProvider);

  if (!timeline) {
    throw new Error("useTimelineStore must be used within a TimelineProvider");
  }

  return timeline.store(
    useShallow(
      useCallback((state) => selector(state, timeline), [selector, timeline]),
    ),
  );
};
export function useTimelineApi() {
  const timeline = React.useContext(TimelineProvider);

  if (!timeline) {
    throw new Error("useTimelineApi must be used within a TimelineProvider");
  }

  return timeline;
}
