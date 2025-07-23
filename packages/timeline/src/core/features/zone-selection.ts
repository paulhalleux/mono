import throttle from "lodash/throttle";

import { DrawRect, TimelineFeature, XYPosition } from "../types";

export declare namespace ZoneSelection {
  export interface Options {}

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
  ZoneSelection.Options,
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
  createTimeline: (api) => {
    const onMouseDown = (event: MouseEvent, element: HTMLElement) => {
      if (event.button !== 0) return;
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
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
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

    const onMouseMove = throttle((event: MouseEvent, element: HTMLElement) => {
      const { active, origin } = api.store.getState().zoneSelection;
      if (!active || !origin) return;

      const rect = element.getBoundingClientRect();
      const end: XYPosition = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };

      const startX = Math.min(origin.x, end.x);
      const startY = Math.min(origin.y, end.y);
      const width = Math.abs(end.x - origin.x);
      const height = Math.abs(end.y - origin.y);

      api.setState((draft) => {
        draft.zoneSelection.end = end;
        draft.zoneSelection.drawRect = {
          top: startY - (api.options.rulerHeight ?? 0),
          left: startX - (api.options.trackHeaderWidth ?? 0),
          width,
          height,
        };
      });
    }, 1000 / 60);

    const onMouseUp = (event: MouseEvent, element: HTMLElement) => {
      if (event.button !== 0) return;

      element.ownerDocument.body.style.userSelect = "";

      api.setState((draft) => {
        draft.zoneSelection.active = false;
        draft.zoneSelection.origin = undefined;
        draft.zoneSelection.end = undefined;
        draft.zoneSelection.drawRect = undefined;
      });
    };

    const registerEventListeners = (element: HTMLElement) => {
      element.addEventListener(
        "mousedown",
        (event) => onMouseDown(event, element),
        {
          signal: api.abortSignal,
        },
      );

      element.ownerDocument.addEventListener(
        "mousemove",
        (event) => onMouseMove(event, element),
        {
          signal: api.abortSignal,
        },
      );

      element.ownerDocument.addEventListener(
        "mouseup",
        (event) => onMouseUp(event, element),
        {
          signal: api.abortSignal,
        },
      );
    };

    api.eventEmitter.on("element:mounted", ({ element }) => {
      registerEventListeners(element);
    });

    return {};
  },
};
