import throttle from "lodash/throttle";

import { DrawRect, TimelineFeature, XYPosition } from "../types";
import { computeSpeedMultiplier } from "../utils/auto-scroll.ts";

export declare namespace ZoneSelection {
  export interface State {
    zoneSelection: {
      active: boolean;
      origin: XYPosition | undefined;
      end: XYPosition | undefined;
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
      const origin: XYPosition = {
        x: event.clientX - rect.left - (api.options.trackHeaderWidth ?? 0),
        y:
          event.clientY -
          rect.top -
          (api.options.rulerHeight ?? 0) +
          element.scrollTop,
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

        if (mousePos) {
          lastClient.x = mousePos.x;
          lastClient.y = mousePos.y;
        } else {
          mousePos = lastClient;
        }

        const rect = element.getBoundingClientRect();
        const end: XYPosition = {
          x: mousePos.x - rect.left - (api.options.trackHeaderWidth ?? 0),
          y:
            mousePos.y -
            rect.top -
            (api.options.rulerHeight ?? 0) +
            element.scrollTop,
        };

        const startX = Math.min(origin.x, end.x);
        const startY = Math.min(origin.y, end.y) - element.scrollTop;
        const width = Math.abs(end.x - origin.x);
        const height = Math.abs(end.y - origin.y);

        const selectedTracksIds = api._internal
          .getTracksInRange(
            element.scrollTop + startY,
            element.scrollTop + startY + height,
          )
          .map((track) => track.id);

        const startTime = api._internal.screenToTime(startX);
        const endTime = api._internal.screenToTime(startX + width);

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
            top: startY,
            left: startX,
            width,
            height,
          };
        });

        const speedMultiplier = computeSpeedMultiplier(element, mousePos.y);
        if (mousePos.y < element.getBoundingClientRect().top + 50) {
          api.startAutoScroll("up", speedMultiplier);
        } else if (mousePos.y > element.getBoundingClientRect().bottom - 50) {
          api.startAutoScroll("down", speedMultiplier);
        } else {
          api.stopAutoScroll();
        }
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
