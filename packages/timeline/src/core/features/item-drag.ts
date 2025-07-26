import { TimelineFeature, TimelinePosition } from "../types";
import { createDragDataTransfer } from "../utils/dnd.ts";
import { extractItemAndTrackId } from "../utils/event.ts";
import { getTimelinePosition } from "../utils/position.ts";

export declare namespace ItemDrag {
  export interface ItemInstance {
    isDragging: boolean;
  }
  export interface Options {}
  export interface State {
    itemDragState?: {
      type: "move" | "resize";
      item: {
        id: string;
        index: number;
        trackId: string;
      };
      mouseOrigin: TimelinePosition;
      clientOffset: TimelinePosition;
      mousePosition: TimelinePosition;
    };
  }
  export interface Events {
    "item:dragstart": {
      itemId: string;
      trackId: string;
      mouseOrigin: TimelinePosition;
    };
    "item:dragend": {
      itemId: string;
      mousePosition: TimelinePosition;
      isDropped: boolean;
    };
  }
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

        api.setState((draft) => {
          draft.itemDragState = {
            type: isResize ? "resize" : "move",
            item: {
              id: item.id,
              index: item.index,
              trackId: item.trackId,
            },
            mouseOrigin: origin,
            mousePosition: origin,
            clientOffset: {
              time: timeOffset,
              x: api.timeToWidth(timeOffset),
              y: 0,
            },
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

        api.eventEmitter.emit("item:dragstart", {
          itemId,
          trackId,
          mouseOrigin: origin,
        });
      },
      {
        signal: abortSignal,
      },
    );

    const onDragEnd = (isDropped: boolean) => {
      const { itemDragState } = api.getState();
      if (!itemDragState) return;

      api.eventEmitter.emit("item:dragend", {
        itemId: itemDragState.item.id,
        mousePosition: itemDragState.mousePosition,
        isDropped,
      });

      api.setState((draft) => {
        draft.itemDragState = undefined;
      });
    };

    window.addEventListener("dragend", () => onDragEnd(false), {
      signal: abortSignal,
    });

    window.addEventListener("drop", () => onDragEnd(true), {
      signal: abortSignal,
    });

    window.addEventListener(
      "dragover",
      (event) => {
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

        api.setState((draft) => {
          if (!draft.itemDragState) return;
          draft.itemDragState.mousePosition = mousePosition;
        });
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
