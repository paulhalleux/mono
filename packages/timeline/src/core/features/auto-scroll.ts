import { TimelineFeature } from "../types";

const DEFAULT_AUTO_SCROLL_INTERVAL = 1000 / 60; // 20 tick per second
const DEFAULT_AUTO_SCROLL_RATE = 10; // 1 pixel per tick

export declare namespace AutoScroll {
  export type Direction = "up" | "down" | "left" | "right";

  export interface Api {
    startAutoScroll: (direction: Direction, speedMultiplier?: number) => void;
    stopAutoScroll: (direction?: Direction) => void;
  }

  export interface Options {
    autoScrollInterval?: number;
    autoScrollRate?: number;
  }

  export interface State {
    autoScrollIntervalId: {
      [key in Direction]?: NodeJS.Timeout;
    };
    autoScrollSpeedMultiplier?: number;
  }
}

export const AutoScrollFeature: TimelineFeature<
  AutoScroll.Api,
  AutoScroll.Options,
  AutoScroll.State
> = {
  getInitialState() {
    return {
      autoScrollIntervalId: {},
      autoScrollSpeedMultiplier: 1,
    };
  },
  createTimeline: (api) => {
    const {
      autoScrollInterval = DEFAULT_AUTO_SCROLL_INTERVAL,
      autoScrollRate = DEFAULT_AUTO_SCROLL_RATE,
    } = api.options;

    const startAutoScroll = (
      direction: AutoScroll.Direction,
      speedMultiplier = 1,
    ) => {
      const { autoScrollIntervalId, element } = api.store.getState();
      if (!element) {
        return;
      }

      if (autoScrollIntervalId[direction]) {
        api.setState((draft) => {
          draft.autoScrollSpeedMultiplier = speedMultiplier;
        });
        return;
      }

      const intervalId = setInterval(() => {
        const { autoScrollSpeedMultiplier = 1 } = api.store.getState();
        const scrollTop = element.scrollTop;

        const additionalPx = autoScrollRate * autoScrollSpeedMultiplier;

        if (direction === "up" || direction === "down") {
          const newScrollTop =
            direction === "down"
              ? scrollTop + additionalPx
              : scrollTop - additionalPx;

          const boundedScrollTop = Math.max(
            0,
            Math.min(newScrollTop, element.scrollHeight),
          );

          element.scrollTo({
            top: boundedScrollTop,
          });
        } else if (direction === "left" || direction === "right") {
          const time = api._internal.widthToTime(
            direction === "right" ? additionalPx : -additionalPx,
          );
          api.bendBy(time);
        }
      }, autoScrollInterval);

      api.setState((draft) => {
        draft.autoScrollIntervalId[direction] = intervalId;
      });
    };

    const stopAutoScroll = (direction?: AutoScroll.Direction) => {
      const { autoScrollIntervalId } = api.store.getState();
      if (!direction) {
        Object.keys(autoScrollIntervalId).forEach((dir) => {
          const id = autoScrollIntervalId[dir as AutoScroll.Direction];
          if (id) {
            clearInterval(id);
          }
        });
        api.setState((draft) => {
          draft.autoScrollIntervalId = {};
          draft.autoScrollSpeedMultiplier = 1;
        });
        return;
      } else {
        const id = autoScrollIntervalId[direction];
        if (id) {
          clearInterval(id);
          api.setState((draft) => {
            delete draft.autoScrollIntervalId[direction];
            draft.autoScrollSpeedMultiplier = 1;
          });
        }
      }
    };

    return {
      startAutoScroll,
      stopAutoScroll,
    };
  },
};
