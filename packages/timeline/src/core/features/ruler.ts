import { TimelineFeature } from "../types";
import { memoize } from "../utils/memoize.ts";
import { getTickIntervalTime } from "../utils/ruler.ts";

import { ViewportState } from "./core.ts";

const DEFAULT_MIN_TICK_INTERVAL_WIDTH = 160;

export declare namespace Ruler {
  export interface Options {
    rulerHeight?: number;
    minTickIntervalWidth?: number;
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
        const { minTickIntervalWidth = DEFAULT_MIN_TICK_INTERVAL_WIDTH } =
          api.options;

        const tickIntervalTime = getTickIntervalTime(
          viewport,
          minTickIntervalWidth,
        );

        const ticksCount =
          Math.ceil(viewport.viewportDuration / tickIntervalTime) + 1;

        const scrollDelta = Math.floor(
          viewport.chunkedPosition.offset / tickIntervalTime,
        );

        const tickWidth = api._internal.timeToWidth(tickIntervalTime);

        return {
          ticks: Array.from({ length: ticksCount }, (_, i) => {
            const time = i * tickIntervalTime + scrollDelta * tickIntervalTime;
            return {
              time: time,
              width: tickWidth,
              left: api._internal.timeToLeft(time),
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
