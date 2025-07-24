import { TimelineFeature } from "../types";

const DEFAULT_AUTO_SCROLL_INTERVAL = 1000 / 60; // 20 tick per second
const DEFAULT_AUTO_SCROLL_RATE = 10; // 1 pixel per tick

export declare namespace AutoScroll {
  export interface Api {
    startAutoScroll: (
      direction: "up" | "down",
      speedMultiplier?: number,
    ) => void;
    stopAutoScroll: () => void;
  }

  export interface Options {
    autoScrollInterval?: number;
    autoScrollRate?: number;
  }

  export interface State {
    autoScrollIntervalId?: NodeJS.Timeout;
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
      autoScrollIntervalId: undefined,
      autoScrollSpeedMultiplier: 1,
    };
  },
  createTimeline: (api) => {
    const {
      autoScrollInterval = DEFAULT_AUTO_SCROLL_INTERVAL,
      autoScrollRate = DEFAULT_AUTO_SCROLL_RATE,
    } = api.options;

    const startAutoScroll = (direction: "up" | "down", speedMultiplier = 1) => {
      const { autoScrollIntervalId, element } = api.store.getState();
      if (!element) {
        return;
      }

      if (autoScrollIntervalId) {
        api.setState((draft) => {
          draft.autoScrollSpeedMultiplier = speedMultiplier;
        });
        return;
      }

      const intervalId = setInterval(() => {
        const { autoScrollSpeedMultiplier = 1 } = api.store.getState();
        const scrollTop = element.scrollTop;
        const newScrollTop =
          direction === "down"
            ? scrollTop + autoScrollRate * autoScrollSpeedMultiplier
            : scrollTop - autoScrollRate * autoScrollSpeedMultiplier;

        const boundedScrollTop = Math.max(
          0,
          Math.min(newScrollTop, element.scrollHeight),
        );

        element.scrollTo({
          top: boundedScrollTop,
        });
      }, autoScrollInterval);

      api.setState((draft) => {
        draft.autoScrollIntervalId = intervalId;
      });
    };

    const stopAutoScroll = () => {
      const { autoScrollIntervalId } = api.store.getState();
      if (autoScrollIntervalId) {
        clearInterval(autoScrollIntervalId);
        api.setState((draft) => {
          draft.autoScrollIntervalId = undefined;
          draft.autoScrollSpeedMultiplier = 1;
        });
      }
    };

    return {
      startAutoScroll,
      stopAutoScroll,
    };
  },
};
