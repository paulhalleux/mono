import { TimelineFeature } from "../types";

export declare namespace ItemDrag {
  export interface Api {}
  export interface ItemInstance {
    isDragging: boolean;
  }
  export interface Options {}
  export interface State {
    itemDragState?: {
      itemId: string;
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

        api.setState((draft) => {
          draft.itemDragState = { itemId };
        });

        if (!event.dataTransfer) return;

        event.dataTransfer.setData("text/plain", itemId);
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setDragImage(new Image(), 0, 0);
      },
      {
        signal: abortSignal,
      },
    );

    element.addEventListener(
      "dragend",
      () => {
        api.setState((draft) => {
          draft.itemDragState = undefined;
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
