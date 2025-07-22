import { TimelineFeature } from "../types";

export declare namespace ItemSelection {
  export interface Api {
    selectItem(itemId: string): void;
    unselectItem(itemId: string): void;
    toggleItemSelection(itemId: string): void;
    isItemSelected(itemId: string): boolean;
  }

  export interface ItemInstance {
    isSelected(): boolean;
    select(): void;
    unselect(): void;
    toggleSelection(): void;
  }

  export interface Options {
    defaultSelectedItems?: string[];
  }

  export interface State {
    selectedItems: Set<string>;
  }

  export interface Events {
    "item:selected": { itemId: string };
    "item:unselected": { itemId: string };
  }
}

export const ItemSelectionFeature: TimelineFeature<
  ItemSelection.Api,
  ItemSelection.Options,
  ItemSelection.State,
  {},
  ItemSelection.ItemInstance
> = {
  getInitialState(options) {
    return {
      selectedItems: new Set(options.defaultSelectedItems ?? []),
    };
  },
  createTimeline: (api) => {
    const isItemSelected = (itemId: string) => {
      const { selectedItems } = api.store.getState();
      return selectedItems.has(itemId);
    };

    const selectItem = (itemId: string) => {
      api.setState((draft) => {
        draft.selectedItems.clear();
        draft.selectedItems.add(itemId);
      });
      api.eventEmitter.emit("item:selected", { itemId });
    };

    const unselectItem = (itemId: string) => {
      api.setState((draft) => {
        draft.selectedItems.delete(itemId);
      });
      api.eventEmitter.emit("item:unselected", { itemId });
    };

    const toggleItemSelection = (itemId: string) => {
      if (isItemSelected(itemId)) {
        api.setState((draft) => {
          draft.selectedItems.delete(itemId);
          api.eventEmitter.emit("item:selected", { itemId });
        });
      } else {
        api.setState((draft) => {
          draft.selectedItems.add(itemId);
        });
        api.eventEmitter.emit("item:unselected", { itemId });
      }
    };

    return {
      selectItem,
      unselectItem,
      isItemSelected,
      toggleItemSelection,
    };
  },
  createItem(api, { id }) {
    return {
      isSelected: () => api.isItemSelected(id),
      select: () => api.selectItem(id),
      unselect: () => api.unselectItem(id),
      toggleSelection: () => api.toggleItemSelection(id),
    };
  },
};
