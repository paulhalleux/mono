import throttle from "lodash/throttle";

import { TimelineFeature } from "../types";

export declare namespace HorizontalScroll {
  export interface Api {
    bendBy(time: number): void;
  }

  export interface Options {
    horizontalScrollSpeed?: number;
  }

  export interface Events {
    bend: { timePosition: number };
  }
}

export const HorizontalScrollFeature: TimelineFeature<
  {},
  HorizontalScroll.Options
> = {
  createTimeline(api) {
    return {
      bendBy: (time: number) => {
        const currentTimePosition = api.getTimePosition();
        const newTimePosition = Math.max(0, currentTimePosition + time);
        api.setTimePosition(newTimePosition);
        api.eventEmitter.emit("bend", {
          timePosition: newTimePosition,
        });
      },
    };
  },
  onMount(api, element, abortSignal) {
    const onWheel = throttle((event: WheelEvent) => {
      if (event.deltaY && !event.shiftKey) {
        return;
      }

      const { horizontalScrollSpeed = 1 } = api.options;
      let deltaX = event.deltaX;
      if (!deltaX && event.deltaY && event.shiftKey) {
        deltaX = event.deltaY / 10;
      }

      if (deltaX === 0) {
        return;
      }

      const scrollByTime =
        0.005 *
        horizontalScrollSpeed *
        api.getState().viewportState.viewportDuration;

      event.preventDefault();

      const newTimePosition = Math.max(
        0,
        api.getTimePosition() + deltaX * scrollByTime,
      );

      api.setTimePosition(newTimePosition);
      api.eventEmitter.emit("bend", {
        timePosition: newTimePosition,
      });
    }, 1000 / 45);

    element.addEventListener("wheel", onWheel, {
      passive: false,
      signal: abortSignal,
    });
  },
};
