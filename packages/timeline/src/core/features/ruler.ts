import { TimelineFeature } from "../types";
import { getTickIntervalTime } from "../utils/ruler.ts";
import { timeToWidth } from "../utils/scale.ts";

export declare namespace Ruler {
  export interface Options {
    rulerHeight?: number;
  }

  export interface State {
    tickIntervalTime: number;
    ticks: Array<{
      time: number;
      left: number;
      width: number;
    }>;
  }
}

export const RulerFeature: TimelineFeature<{}, Ruler.Options, Ruler.State> = {
  getInitialState() {
    return {
      tickIntervalTime: 0,
      tickWidth: 0,
      ticks: [],
    };
  },
  createTimeline: (api) => {
    api.eventEmitter.on("viewport:updated", (viewport) => {
      const tickIntervalTime = getTickIntervalTime(viewport, 100);
      api.setState((draft) => {
        draft.tickIntervalTime = tickIntervalTime;
        const ticksCount =
          Math.ceil(viewport.viewportDuration / tickIntervalTime) + 1;

        const scrollDelta = Math.floor(
          viewport.chunkedPosition.offset / tickIntervalTime,
        );

        const tickWidth = timeToWidth(
          tickIntervalTime,
          viewport.viewportWidth,
          viewport.viewportDuration,
        );

        draft.ticks = Array.from({ length: ticksCount }, (_, i) => {
          const time = i * tickIntervalTime + scrollDelta * tickIntervalTime;
          return {
            time: time,
            width: tickWidth,
            left: timeToWidth(
              time,
              viewport.viewportWidth,
              viewport.viewportDuration,
            ),
          };
        });
      });
    });
    return {};
  },
};
