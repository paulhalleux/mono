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

export type Snap = {
  in?: number;
  out?: number;
};

export declare namespace ItemDrag {
  export interface ItemInstance {
    isDragging: boolean;
  }
  export interface Options {
    onItemMove?: (itemId: string, event: MoveDragEvent) => void;
    onItemResize?: (itemId: string, event: ResizeDragEvent) => void;
  }
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
      snap?: Snap;
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
      item: ItemInstance,
      mousePosition: TimelinePosition,
      clientOffset: TimelinePosition,
      snap?: Snap,
    ): MoveDragEvent => ({
      type: "move",
      timeIn: snap
        ? snap.in
          ? snap.in
          : snap.out
            ? snap.out - item.duration
            : Math.max(0, mousePosition.time - clientOffset.time)
        : Math.max(0, mousePosition.time - clientOffset.time),
    });

    const getResizeEvent = (
      item: ItemInstance,
      mousePosition: TimelinePosition,
      clientOffset: TimelinePosition,
      snap?: Snap,
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

      if (isResizeLeft && snap?.in) {
        return {
          type: "resize",
          timeIn: snap.in,
          duration: Math.max(0, timeOut - snap.in),
        };
      } else if (snap?.out) {
        return {
          type: "resize",
          timeIn: timeIn,
          duration: Math.max(0, snap.out - timeIn),
        };
      }

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
      snap?: Snap,
    ): TimelineDragEvent => {
      switch (type) {
        case "move":
          return getMoveEvent(item, mousePosition, clientOffset, snap);
        case "resize":
          return getResizeEvent(item, mousePosition, clientOffset, snap);
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

    window.addEventListener(
      "drop",
      (ev) => {
        const { onItemMove, onItemResize } = api.options;
        const { itemDragState, trackDropState } = api.getState();
        if (!itemDragState) return;
        ev.preventDefault();

        switch (itemDragState.event.type) {
          case "move": {
            api.updateItem(itemDragState.item.id, (item) => {
              const duration = item.end - item.start;
              item.start = itemDragState.event.timeIn;
              item.end = itemDragState.event.timeIn + duration;
              item.trackId = trackDropState?.trackId || item.trackId;
            });

            onItemMove?.(itemDragState.item.id, itemDragState.event);
            break;
          }
          case "resize": {
            api.updateItem(itemDragState.item.id, (item) => {
              if (itemDragState.event.type !== "resize") return;
              item.start = itemDragState.event.timeIn;
              item.end =
                itemDragState.event.timeIn + itemDragState.event.duration;
            });

            onItemResize?.(itemDragState.item.id, itemDragState.event);
            break;
          }
          default:
            break;
        }

        onDragEnd();
      },
      {
        signal: abortSignal,
      },
    );

    const onDragOver = throttle((event) => {
      const { itemDragState, ticks, tickIntervalTime } = api.getState();
      if (!itemDragState) return;

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

      const isResizeRight =
        itemDragState.event.type === "resize" &&
        itemDragState.clientOffset.time >= item.duration / 2;

      const timeIn = isResizeRight
        ? item.start
        : itemDragState.mousePosition.time - itemDragState.clientOffset.time;
      const timeOut =
        itemDragState.mousePosition.time +
        (item.duration - itemDragState.clientOffset.time);

      const threshold = api.widthToTime(10);

      const adaptedTicks = ticks.map((tick) => ({
        ...tick,
        time: tick.time + tickIntervalTime,
      }));

      const snapIn = !isResizeRight
        ? adaptedTicks.find((tick) => Math.abs(tick.time - timeIn) <= threshold)
            ?.time
        : undefined;

      const snapOut = adaptedTicks.find(
        (tick) => Math.abs(tick.time - timeOut) <= threshold,
      )?.time;

      const snap = {
        in: snapIn,
        out: snapOut,
      };

      api.setState((draft) => {
        if (!draft.itemDragState) return;
        if (isEqual(mousePosition, draft.itemDragState.mousePosition)) return;
        draft.itemDragState.mousePosition = mousePosition;
        draft.itemDragState.event = getEventByType(
          draft.itemDragState.event.type,
          item,
          mousePosition,
          draft.itemDragState.clientOffset,
          snap,
        );
        draft.itemDragState.snap = snap;
      });
    }, 1000 / 30);

    window.addEventListener(
      "dragover",
      (event) => {
        const { itemDragState } = api.getState();
        if (!itemDragState) return;
        event.preventDefault();

        onDragOver(event);
      },
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
