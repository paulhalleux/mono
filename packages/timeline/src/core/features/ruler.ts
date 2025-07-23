import { TimelineFeature } from "../types";
import { memoize } from "../utils/memoize.ts";
import { getTickIntervalTime } from "../utils/ruler.ts";
import { timeToWidth } from "../utils/scale.ts";

import { ViewportState } from "./core.ts";

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
    const getTicks = memoize({
      factory: (viewport: ViewportState) => {
        const tickIntervalTime = getTickIntervalTime(viewport, 100);
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

        return {
          ticks: Array.from({ length: ticksCount }, (_, i) => {
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
          }),
          tickIntervalTime,
        };
      },
      deps: (viewport) => {
        return [
          viewport.viewportWidth,
          viewport.viewportDuration,
          viewport.chunkedPosition.offset,
        ];
      },
    });

    api.eventEmitter.on("viewport:updated", (viewport) => {
      api.setState((draft) => {
        const { ticks, tickIntervalTime } = getTicks(viewport);
        draft.ticks = ticks;
        draft.tickIntervalTime = tickIntervalTime;
      });
    });

    return {};
  },
};
