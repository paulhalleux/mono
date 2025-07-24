import throttle from "lodash/throttle";

import { TimelineFeature } from "../types";

export declare namespace HorizontalScroll {
  export interface Options {
    horizontalScrollSpeed?: number;
  }
}

export const HorizontalScrollFeature: TimelineFeature<
  {},
  HorizontalScroll.Options
> = {
  onMount(api, element, abortSignal) {
    const onWheel = throttle((event: WheelEvent) => {
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
        api.store.getState().viewportState.viewportDuration;

      event.preventDefault();
      api.setTimePosition(
        Math.max(0, api.getTimePosition() + deltaX * scrollByTime),
      );
    }, 1000 / 45);

    element.addEventListener("wheel", onWheel, {
      passive: false,
      signal: abortSignal,
    });
  },
};
