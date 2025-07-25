import { TimelineFeature, TimelinePosition } from "../types";
import { createDragDataTransfer } from "../utils/dnd.ts";
import { getTimelinePosition } from "../utils/position.ts";

export declare namespace ItemDrag {
  export interface Api {}
  export interface ItemInstance {
    isDragging: boolean;
  }
  export interface Options {}
  export interface State {
    itemDragState?: {
      itemId: string;
      mouseOrigin: TimelinePosition;
      mousePosition: TimelinePosition;
      currentTrackId?: string;
    };
  }
  export interface Events {}
}

export const ItemDragFeature: TimelineFeature<
  ItemDrag.Api,
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
        const itemId = (event.target as HTMLElement).dataset.itemId;
        const trackId = (event.target as HTMLElement).dataset.parentTrackId;
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

        api.setState((draft) => {
          draft.itemDragState = {
            itemId,
            mouseOrigin: origin,
            mousePosition: origin,
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
      (event) => {
        const { itemDragState } = api.store.getState();
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
          draft.itemDragState.currentTrackId = api.getTrackAtHeight(
            mousePosition.y,
          )?.id;
        });
      },
      {
        signal: abortSignal,
      },
    );
  },
  createItem(api, itemDef) {
    const { itemDragState } = api.store.getState();
    return {
      isDragging: itemDragState?.itemId === itemDef.id,
      attributes: {
        draggable: true,
      },
    };
  },
  itemRecomputeDependencies(api, item) {
    const { itemDragState } = api.store.getState();
    return [itemDragState?.itemId === item.id];
  },
};
