import throttle from "lodash/throttle";

import { DrawRect, TimelineFeature, XYPosition } from "../types";
import { computeSpeedMultiplier } from "../utils/auto-scroll.ts";

import { AutoScroll } from "./auto-scroll.ts";

export declare namespace ZoneSelection {
  export interface ZoneSelectionPoint extends XYPosition {
    time: number;
  }

  export interface State {
    zoneSelection: {
      active: boolean;
      origin: ZoneSelectionPoint | undefined;
      end: ZoneSelectionPoint | undefined;
      drawRect: DrawRect | undefined;
    };
  }
}

export const ZoneSelectionFeature: TimelineFeature<
  {},
  {},
  ZoneSelection.State
> = {
  getInitialState() {
    return {
      zoneSelection: {
        active: false,
        origin: undefined,
        end: undefined,
        drawRect: undefined,
      },
    };
  },
  onMount: (api, element, signal) => {
    const onMouseDown = (event: MouseEvent, element: HTMLElement) => {
      if (event.button !== 0 || event.target === element) return;
      if (
        event.target instanceof HTMLElement &&
        event.target.dataset.itemId &&
        !event.ctrlKey
      ) {
        return;
      }

      element.ownerDocument.body.style.userSelect = "none";
      const rect = element.getBoundingClientRect();

      const x = event.clientX - rect.left - (api.options.trackHeaderWidth ?? 0);
      const y =
        event.clientY -
        rect.top -
        (api.options.rulerHeight ?? 0) +
        element.scrollTop;

      const origin: ZoneSelection.ZoneSelectionPoint = {
        x,
        y,
        time: api._internal.screenToTime(x),
      };

      api.setState((draft) => {
        draft.zoneSelection = {
          active: true,
          origin,
          end: origin,
          drawRect: {
            top: origin.y,
            left: origin.x,
            width: 0,
            height: 0,
          },
        };
      });
    };

    const lastClient = { x: 0, y: 0 };
    const onMouseMove = throttle(
      (mousePos: XYPosition | undefined, element: HTMLElement) => {
        const { active, origin } = api.store.getState().zoneSelection;
        if (!active || !origin) return;
        const { chunkedPosition } = api.store.getState().viewportState;

        if (mousePos) {
          lastClient.x = mousePos.x;
          lastClient.y = mousePos.y;
        } else {
          mousePos = lastClient;
        }

        const rect = element.getBoundingClientRect();

        const x = mousePos.x - rect.left - (api.options.trackHeaderWidth ?? 0);
        const y =
          mousePos.y -
          rect.top -
          (api.options.rulerHeight ?? 0) +
          element.scrollTop;

        const end: ZoneSelection.ZoneSelectionPoint = {
          x,
          y,
          time: api._internal.screenToTime(x),
        };

        const left = api._internal.timeToLeft(
          Math.min(origin.time, end.time) - chunkedPosition.offset,
        );
        const right = api._internal.timeToLeft(
          Math.max(origin.time, end.time) - chunkedPosition.offset,
        );
        const width = Math.abs(right - left);

        const top = Math.min(origin.y, end.y) - element.scrollTop;
        const height = Math.abs(end.y - origin.y);

        const selectedTracksIds = api._internal
          .getTracksInRange(
            element.scrollTop + top,
            element.scrollTop + top + height,
          )
          .map((track) => track.id);

        const startTime = Math.min(origin.time, end.time);
        const endTime = Math.max(origin.time, end.time);

        const items = api.options.items?.filter((item) => {
          return (
            selectedTracksIds.includes(item.trackId) &&
            item.start < endTime &&
            item.end > startTime
          );
        });

        api.setState((draft) => {
          draft.selectedItems.clear();
          items?.forEach((item) => {
            draft.selectedItems.add(item.id);
          });

          draft.zoneSelection.end = end;
          draft.zoneSelection.drawRect = {
            top,
            left,
            width,
            height,
          };
        });

        const speedMultiplier = computeSpeedMultiplier(
          element,
          mousePos.y,
          mousePos.x,
        );

        const directions = {
          left:
            mousePos.x < rect.left + (api.options.trackHeaderWidth ?? 0) + 50,
          right: mousePos.x > rect.right - 50,
          up: mousePos.y < rect.top + 50,
          down: mousePos.y > rect.bottom - 50,
        } as const;

        Object.entries(directions).forEach(([direction, shouldScroll]) => {
          if (shouldScroll) {
            api.startAutoScroll(
              direction as AutoScroll.Direction,
              speedMultiplier,
            );
          } else {
            api.stopAutoScroll(direction as AutoScroll.Direction);
          }
        });
      },
      1000 / 60,
    );

    const onMouseUp = (element: HTMLElement) => {
      api.stopAutoScroll();

      element.ownerDocument.body.style.userSelect = "";

      api.setState((draft) => {
        draft.zoneSelection.active = false;
        draft.zoneSelection.origin = undefined;
        draft.zoneSelection.end = undefined;
        draft.zoneSelection.drawRect = undefined;
      });
    };

    element.addEventListener(
      "mousedown",
      (event) => onMouseDown(event, element),
      { signal },
    );

    element.addEventListener(
      "scroll",
      (ev) => {
        const { zoneSelection } = api.store.getState();
        if (zoneSelection.active) {
          onMouseMove(undefined, element);
          ev.stopPropagation();
        }
      },
      { signal },
    );

    const onBend = () => {
      const { zoneSelection } = api.store.getState();
      if (zoneSelection.active) {
        onMouseMove(undefined, element);
      }
    };

    api.eventEmitter.on("bend", onBend);
    signal.addEventListener("abort", () => {
      api.eventEmitter.off("bend", onBend);
    });

    window.addEventListener(
      "mousemove",
      (event) =>
        onMouseMove(
          {
            x: event.clientX,
            y: event.clientY,
          },
          element,
        ),
      { signal },
    );

    window.addEventListener(
      "mouseup",
      (event) => {
        if (event.button !== 0) return;
        onMouseUp(element);
      },
      {
        signal,
      },
    );

    window.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "Escape") {
          onMouseUp(element);
        }
      },
      { signal },
    );
  },
};
