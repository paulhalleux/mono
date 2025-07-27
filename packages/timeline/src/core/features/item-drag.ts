import isEqual from "lodash/isequal";
import throttle from "lodash/throttle";

import { ItemInstance, TimelineFeature, TimelinePosition } from "../types";
import { createDragDataTransfer } from "../utils/dnd.ts";
import { extractItemAndTrackId } from "../utils/event.ts";
import { getTimelinePosition } from "../utils/position.ts";

export type MoveDragEvent = {
  type: "move";
  timeIn: number;
};

export type ResizeDragEvent = {
  type: "resize";
  timeIn: number;
  duration: number;
};

export type TimelineDragEvent = MoveDragEvent | ResizeDragEvent;

export declare namespace ItemDrag {
  export interface ItemInstance {
    isDragging: boolean;
  }
  export interface Options {}
  export interface State {
    itemDragState?: {
      event: TimelineDragEvent;
      item: {
        id: string;
        trackId: string;
      };
      mouseOrigin: TimelinePosition;
      clientOffset: TimelinePosition;
      mousePosition: TimelinePosition;
    };
  }
  export interface Events {}
}

export const ItemDragFeature: TimelineFeature<
  {},
  ItemDrag.Options,
  ItemDrag.State,
  {},
  ItemDrag.ItemInstance
> = {
  getInitialState() {
    return {
      itemDragState: undefined,
    };
  },
  onMount(api, element, abortSignal) {
    const getMoveEvent = (
      mousePosition: TimelinePosition,
      clientOffset: TimelinePosition,
    ): MoveDragEvent => ({
      type: "move",
      timeIn: Math.max(0, mousePosition.time - clientOffset.time),
    });

    const getResizeEvent = (
      item: ItemInstance,
      mousePosition: TimelinePosition,
      clientOffset: TimelinePosition,
    ): ResizeDragEvent => {
      const isResizeLeft = clientOffset.time < item.duration / 2;
      const timeIn = isResizeLeft
        ? Math.max(
            0,
            Math.min(mousePosition.time - clientOffset.time, item.end),
          )
        : item.start;
      const timeOut = isResizeLeft
        ? item.start + item.duration
        : Math.max(0, mousePosition.time - clientOffset.time + item.duration);

      return {
        type: "resize",
        timeIn,
        duration: Math.max(0, timeOut - timeIn),
      };
    };

    const getEventByType = (
      type: "move" | "resize",
      item: ItemInstance,
      mousePosition: TimelinePosition,
      clientOffset: TimelinePosition,
    ): TimelineDragEvent => {
      switch (type) {
        case "move":
          return getMoveEvent(mousePosition, clientOffset);
        case "resize":
          return getResizeEvent(item, mousePosition, clientOffset);
        default:
          throw new Error(`Unknown drag event type: ${type}`);
      }
    };

    element.addEventListener(
      "dragstart",
      (event) => {
        const { itemId, trackId } = extractItemAndTrackId(event);
        if (!itemId || !trackId) return;

        if (event.ctrlKey) {
          event.preventDefault();
          return;
        }

        const origin = getTimelinePosition(
          api,
          {
            x: event.clientX,
            y: event.clientY,
          },
          element,
        );

        const item = api.getItemById(itemId);
        if (!item) return;
        const timeOffset = Math.abs(item.start - origin.time);

        const isResize =
          event.target instanceof HTMLElement && !!event.target.dataset.resize;

        const clientOffset = {
          time: timeOffset,
          x: api.timeToWidth(timeOffset),
          y: 0,
        };

        api.setState((draft) => {
          draft.itemDragState = {
            event: getEventByType(
              isResize ? "resize" : "move",
              item,
              origin,
              clientOffset,
            ),
            item: {
              id: item.id,
              trackId: item.trackId,
            },
            mouseOrigin: origin,
            mousePosition: origin,
            clientOffset,
          };
        });

        if (!event.dataTransfer) return;

        createDragDataTransfer(event.dataTransfer, {
          itemType: "item",
          data: {
            itemId,
            trackId,
          },
        });
      },
      {
        signal: abortSignal,
      },
    );

    const onDragEnd = () => {
      const { itemDragState } = api.getState();
      if (!itemDragState) return;
      api.setState((draft) => {
        draft.itemDragState = undefined;
      });
    };

    window.addEventListener("dragend", onDragEnd, {
      signal: abortSignal,
    });

    window.addEventListener("drop", onDragEnd, {
      signal: abortSignal,
    });

    window.addEventListener(
      "dragover",
      throttle((event) => {
        const { itemDragState } = api.getState();
        if (!itemDragState) return;
        event.preventDefault();

        const mousePosition = getTimelinePosition(
          api,
          {
            x: event.clientX,
            y: event.clientY,
          },
          element,
        );

        const item = api.getItemById(itemDragState.item.id);
        if (!item) return;

        api.setState((draft) => {
          if (!draft.itemDragState) return;
          if (isEqual(mousePosition, draft.itemDragState.mousePosition)) return;
          draft.itemDragState.mousePosition = mousePosition;
          draft.itemDragState.event = getEventByType(
            draft.itemDragState.event.type,
            item,
            mousePosition,
            draft.itemDragState.clientOffset,
          );
        });
      }, 1000 / 30),
      {
        signal: abortSignal,
      },
    );
  },
  createItem(api, itemDef) {
    const { itemDragState } = api.getState();
    return {
      isDragging: itemDragState?.item.id === itemDef.id,
      attributes: {
        draggable: true,
      },
    };
  },
  itemRecomputeDependencies(api, item) {
    const { itemDragState } = api.getState();
    return [itemDragState?.item.id === item.id];
  },
};
