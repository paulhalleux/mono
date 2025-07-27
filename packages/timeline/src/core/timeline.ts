import { EventEmitter } from "events";

import {
  castDraft,
  current,
  enableMapSet,
  produce,
  WritableDraft,
} from "immer";
import merge from "lodash/merge";
import StrictEventEmitter from "strict-event-emitter-types";

import { createDefaultStore, createStoreUpdater } from "../utils/store.ts";

import { AutoScrollFeature } from "./features/auto-scroll.ts";
import { CoreTimelineFeature } from "./features/core.ts";
import { HorizontalScrollFeature } from "./features/horizontal-scroll.ts";
import { ItemDragFeature } from "./features/item-drag.ts";
import { ItemSelectionFeature } from "./features/item-selection.ts";
import { RulerFeature } from "./features/ruler.ts";
import { TrackDropFeature } from "./features/track-drop.ts";
import { TrackSelectionFeature } from "./features/track-selection.ts";
import { ZoneSelectionFeature } from "./features/zone-selection.ts";
import { memoizeArrayItems } from "./utils/memoize-array.ts";
import * as ScaleUtils from "./utils/scale.ts";
import {
  AddTrackOptions,
  ElementEvent,
  InternalTimelineApi,
  ItemDef,
  ItemInstance,
  TimelineApi,
  TimelineEvents,
  TimelineOptions,
  TimelineState,
  TrackDef,
  TrackInstance as TimelineTrackInstance,
  TrackInstance,
} from "./types.ts";

enableMapSet();

const BUILT_IN_FEATURES = [
  CoreTimelineFeature,
  ItemSelectionFeature,
  RulerFeature,
  ZoneSelectionFeature,
  AutoScrollFeature,
  HorizontalScrollFeature,
  TrackSelectionFeature,
  ItemDragFeature,
  TrackDropFeature,
];

export function createTimeline(options: TimelineOptions = {}): TimelineApi {
  const features = BUILT_IN_FEATURES;
  let elementEventListeners: Array<ElementEvent<any>> = [];

  const eventEmitter: StrictEventEmitter<EventEmitter, TimelineEvents> =
    new EventEmitter();

  const initialState: TimelineState = features.reduce(
    (state, feature) => ({
      ...state,
      ...(feature.getInitialState?.(options) ?? {}),
    }),
    {
      element: null,
      itemIdsByTrackId: getItemIdsByTrackId(options.initialItems ?? []),
      itemsById: getItemsById(options.initialItems ?? []),
      tracksById: getTracksById(options.initialTracks ?? []),
    } as TimelineState,
  );

  const store = options.createStore
    ? options.createStore(initialState)
    : createDefaultStore(initialState);
  const setState = createStoreUpdater(store);

  let abortController: AbortController = new AbortController();

  /**
   * Mounts the viewport to a given HTML element.
   * @param element The HTML element to mount the viewport to.
   */
  const mount = (element: HTMLElement) => {
    abortController = new AbortController();
    api.setState((draft) => {
      draft.element = castDraft(element);
    });

    api.eventEmitter.emit("element:mounted", {
      element,
      abortSignal: abortController.signal,
    });

    elementEventListeners = [];
    features.forEach((feature) => {
      feature.onMount?.(api, element, abortController.signal);
    });

    // add event listeners for the element
    elementEventListeners
      .toSorted((a, b) => (a.priority ?? 0) - (b.priority ?? 0))
      .forEach(({ event, listener }) => {
        element.addEventListener(event, listener, {
          signal: abortController.signal,
        });
      });
  };

  /**
   * Unmounts the viewport from the currently mounted HTML element.
   * It stops observing the element for size changes and clears the viewport state.
   */
  const unmount = () => {
    api.setState((draft) => {
      draft.element = null;
    });
    api.eventEmitter.emit("element:unmounted");
    abortController.abort();

    features.forEach((feature) => {
      feature.onUnmount?.(api);
    });
  };

  const addElementEventListener = <K extends keyof HTMLElementEventMap>(
    event: ElementEvent<K>,
  ) => {
    elementEventListeners.push(event);
  };

  /**
   * Creates a track instance based on the track definition and the features defined in the timeline.
   * @param trackDef The track definition.
   * @param previousTrack The previous track instance, if any.
   * @returns A track instance created from the track definition.
   */
  const createTrack = (
    trackDef: TrackDef,
    previousTrack: TrackInstance | undefined,
  ): TrackInstance => {
    return features.reduce((previousValue, currentValue) => {
      return merge(
        {},
        previousValue,
        currentValue.createTrack?.(api, trackDef, previousTrack) ?? {},
      );
    }, trackDef as TrackInstance);
  };

  /**
   * Gets the dependencies for a track based on the features defined in the timeline.
   * @param track The track definition.
   * @returns An array of dependencies for the track.
   */
  const getTrackDependencies = (track: TrackDef): any[] => {
    return features.reduce(
      (deps, feature) => {
        return [
          ...deps,
          ...(feature.trackRecomputeDependencies?.(api, track) ?? []),
        ];
      },
      // Track the track itself as a dependency
      [track, api.getState().itemIdsByTrackId.get(track.id)] as any[],
    );
  };

  /**
   * Creates an item instance based on the item definition and the features defined in the timeline.
   * @param itemDef The item definition.
   * @returns An item instance created from the item definition.
   */
  const createItem = (itemDef: ItemDef): ItemInstance => {
    return features.reduce((previousValue, currentValue) => {
      return merge(
        {},
        previousValue,
        currentValue.createItem?.(api, itemDef) ?? {},
      );
    }, itemDef as ItemInstance);
  };

  /**
   * Gets the dependencies for an item based on the features defined in the timeline.
   * @param item The item definition.
   * @returns An array of dependencies for the item.
   */
  const getItemDependencies = (item: ItemDef): any[] => {
    return features.reduce(
      (deps, feature) => {
        return [
          ...deps,
          ...(feature.itemRecomputeDependencies?.(api, item) ?? []),
        ];
      },
      // Track the item itself as a dependency
      [item] as any[],
    );
  };

  /**
   * Gets the tracks defined in the timeline options.
   * It uses memoization to optimize performance by caching track instances.
   * @returns An array of track instances.
   */
  const tracks = memoizeArrayItems<TimelineTrackInstance, []>({
    deps: (id) => {
      const { tracksById } = api.getState();
      const trackDef = tracksById.get(id);
      if (!trackDef) {
        return [];
      }
      return api._internal.getTrackDependencies(trackDef);
    },
    getIds: () => {
      const { tracksById } = api.getState();
      return Array.from(tracksById.entries())
        .toSorted(([, a], [, b]) => {
          return a.index - b.index;
        })
        .map(([id]) => id);
    },
    itemFactory: (id, prev) => {
      const { tracksById } = api.getState();
      const trackDef = tracksById.get(id);
      if (!trackDef) {
        throw new Error(`Track definition with id "${id}" not found.`);
      }
      return api._internal.createTrack(trackDef, prev);
    },
  });

  /**
   * Gets the currently visible tracks based on the viewport state.
   * It returns a slice of tracks that are currently in the viewport.
   * @returns An array of visible tracks.
   */
  const getVisibleTracks = () => {
    const {
      viewportState: { virtualizedTracks },
    } = api.getState();
    return tracks
      .getIds()
      .slice(virtualizedTracks.startIndex, virtualizedTracks.endIndex + 1);
  };

  /**
   * Gets the track at a specific height.
   * @param height The height in pixels.
   * @returns The track instance at the specified height, or undefined if not found.
   */
  const getTrackAtHeight = (
    height: number,
  ): TimelineTrackInstance | undefined => {
    const trackList = tracks.get();
    return trackList.find(
      (track) => track.top <= height && track.top + track.height > height,
    );
  };

  /**
   * Gets the tracks that are within a specified range of heights.
   * @param topHeight The top height in pixels.
   * @param bottomHeight The bottom height in pixels.
   * @returns An array of track instances within the specified height range.
   */
  const getTracksInRange = (
    topHeight: number,
    bottomHeight: number,
  ): TimelineTrackInstance[] => {
    const trackList = tracks.get();
    return trackList.filter(
      (track) =>
        track.top + track.height > topHeight && track.top < bottomHeight,
    );
  };

  /**
   * Gets a track instance by its ID.
   * @param id The ID of the track.
   * @returns The track instance with the specified ID, or undefined if not found.
   */
  const getTrackById = (id: string): TrackInstance | undefined => {
    return tracks.getById(id);
  };

  /**
   * Gets an item instance by its ID.
   * @param id The ID of the item.
   * @returns The item instance with the specified ID, or undefined if not found.
   */
  const getItemById = (id: string): ItemInstance | undefined => {
    const { itemsById } = api.getState();
    const itemDef = itemsById.get(id);
    if (!itemDef) {
      return undefined;
    }
    return getTrackById(itemDef.trackId)?.getItemById(id);
  };

  /**
   * Converts a width in pixels to a time in milliseconds based on the current viewport state.
   * @param width The width in pixels.
   * @returns The corresponding time in milliseconds.
   */
  const widthToTime = (width: number): number => {
    const {
      viewportState: { viewportWidth, viewportDuration },
    } = api.getState();
    return ScaleUtils.widthToTime(width, viewportWidth, viewportDuration);
  };

  /**
   * Converts a time in milliseconds to a width in pixels based on the current viewport state.
   * @param time The time in milliseconds.
   * @returns The corresponding width in pixels.
   */
  const timeToWidth = (time: number): number => {
    const {
      viewportState: { viewportWidth, viewportDuration },
    } = api.getState();
    return ScaleUtils.timeToWidth(time, viewportWidth, viewportDuration);
  };

  /**
   * Converts a time in milliseconds to a left position in pixels based on the current viewport state.
   * @param time The time in milliseconds.
   * @returns The corresponding left position in pixels.
   */
  const timeToLeft = (time: number): number => {
    const {
      viewportState: { viewportWidth, viewportDuration, chunkedPosition },
    } = api.getState();
    const scrollDuration = chunkedPosition.index * chunkedPosition.duration;
    return ScaleUtils.timeToLeft(
      time - scrollDuration,
      viewportWidth,
      viewportDuration,
    );
  };

  /**
   * Converts a screen x-coordinate to a time in milliseconds based on the current viewport state.
   * The screen x-coordinate is adjusted by the chunked position.
   * "x" is the distance from the end of the track header to the point in the timeline.
   * @param x The x-coordinate in pixels.
   * @returns The corresponding time in milliseconds.
   */
  const screenToTime = (x: number): number => {
    const {
      viewportState: { viewportWidth, viewportDuration, chunkedPosition },
    } = api.getState();
    return (
      ScaleUtils.widthToTime(x, viewportWidth, viewportDuration) +
      chunkedPosition.offset +
      chunkedPosition.index * chunkedPosition.duration
    );
  };

  /**
   * Updates a track in the timeline by applying the updater function to the existing track.
   * The updater function must return a track with the same ID as the original track.
   * @param trackId The ID of the track to update.
   * @param updater The function that updates the track.
   */
  const updateTrack = (
    trackId: string,
    updater: (track: WritableDraft<TrackDef>) => TrackDef | void,
  ): void => {
    const { tracksById } = api.getState();
    const track = tracksById.get(trackId);
    if (!track) {
      throw new Error(`Track with id "${trackId}" not found.`);
    }
    const updatedTrack = produce(track, updater);
    if (updatedTrack.id !== trackId) {
      throw new Error(
        `Track updater function must return a track with the same id "${trackId}".`,
      );
    }

    api.setState((draft) => {
      draft.tracksById.set(updatedTrack.id, updatedTrack);
    });

    api.options.onTrackChange?.(updatedTrack);
  };

  /**
   * Updates an item in the timeline by applying the updater function to the existing item.
   * The updater function must return an item with the same ID as the original item.
   * @param itemId The ID of the item to update.
   * @param updater The function that updates the item.
   */
  const updateItem = (
    itemId: string,
    updater: (item: WritableDraft<ItemDef>) => ItemDef | void,
  ): void => {
    const { itemsById } = api.getState();
    const item = itemsById.get(itemId);
    if (!item) {
      throw new Error(`Item with id "${itemId}" not found.`);
    }

    const updatedItem = produce(item, updater);
    if (updatedItem.id !== itemId) {
      throw new Error(
        `Item updater function must return an item with the same id "${itemId}".`,
      );
    }

    api.setState((draft) => {
      draft.itemsById.set(updatedItem.id, updatedItem);
      if (item.trackId !== updatedItem.trackId) {
        // If the track has changed, update the itemIdsByTrackId map
        const trackItemIds = draft.itemIdsByTrackId.get(item.trackId) || [];
        const updatedTrackItemIds = trackItemIds.filter((id) => id !== itemId);
        draft.itemIdsByTrackId.set(item.trackId, updatedTrackItemIds);

        const newTrackItemIds =
          draft.itemIdsByTrackId.get(updatedItem.trackId) || [];
        newTrackItemIds.push(updatedItem.id);
        draft.itemIdsByTrackId.set(updatedItem.trackId, newTrackItemIds);
      }
    });

    api.options.onItemChange?.(updatedItem);
  };

  /**
   * Removes a track and all associated items from the timeline.
   * @param trackId The ID of the track to remove.
   */
  const removeTrack = (trackId: string): void => {
    const { tracksById, itemIdsByTrackId } = api.getState();
    const track = tracksById.get(trackId);
    if (!track) {
      throw new Error(`Track with id "${trackId}" not found.`);
    }

    const itemIds = itemIdsByTrackId.get(trackId) || [];
    api.setState((draft) => {
      draft.tracksById.delete(trackId);
      // Update following tracks' indices (will also trigger re-compute of their instances)
      draft.tracksById.forEach((t) => {
        if (t.index > track.index) {
          t.index -= 1;
          api.options.onTrackChange?.(current(t));
        }
      });

      // Remove all items associated with the track
      for (const itemId of itemIds) {
        draft.itemsById.delete(itemId);
      }
      draft.itemIdsByTrackId.delete(trackId);
    });
  };

  /**
   * Removes an item from the timeline.
   * It also removes the item from its associated track.
   * @param itemId The ID of the item to remove.
   */
  const removeItem = (itemId: string): void => {
    const { itemsById, itemIdsByTrackId } = api.getState();
    const item = itemsById.get(itemId);
    if (!item) {
      throw new Error(`Item with id "${itemId}" not found.`);
    }

    // Remove the item from its track
    const trackItemIds = itemIdsByTrackId.get(item.trackId) || [];
    const updatedTrackItemIds = trackItemIds.filter((id) => id !== itemId);

    api.setState((draft) => {
      draft.itemsById.delete(itemId);
      draft.itemIdsByTrackId.set(item.trackId, updatedTrackItemIds);
    });
  };

  /**
   * Adds a new track to the timeline.
   * @param trackDef The track definition to add.
   * @param options Options for adding the track, such as conflict resolution.
   * @returns The newly created track instance.
   */
  const addTrack = (
    trackDef: TrackDef,
    options: AddTrackOptions = { onConflict: "before" },
  ) => {
    const { tracksById } = api.getState();
    if (tracksById.has(trackDef.id)) {
      throw new Error(`Track with id "${trackDef.id}" already exists.`);
    }
    api.setState((draft) => {
      draft.tracksById.set(trackDef.id, trackDef);
      if (
        Array.from(draft.tracksById.values()).some(
          (t) => t.index === trackDef.index,
        )
      ) {
        if (options.onConflict === "before") {
          draft.tracksById.forEach((track) => {
            if (track.index >= trackDef.index) {
              track.index += 1;
              api.options.onTrackChange?.(current(track));
            }
          });
        } else if (options.onConflict === "after") {
          trackDef.index += 1;
          draft.tracksById.forEach((track) => {
            if (track.index > trackDef.index) {
              track.index += 1;
              api.options.onTrackChange?.(current(track));
            }
          });
        }
      }
    });
  };

  const addItem = (itemDef: ItemDef) => {
    const { itemsById, itemIdsByTrackId } = api.getState();
    if (itemsById.has(itemDef.id)) {
      throw new Error(`Item with id "${itemDef.id}" already exists.`);
    }
    if (!itemIdsByTrackId.has(itemDef.trackId)) {
      throw new Error(
        `Track with id "${itemDef.trackId}" does not exist for item "${itemDef.id}".`,
      );
    }

    const trackItemIds = itemIdsByTrackId.get(itemDef.trackId) || [];
    const updatedTrackItemIds = [...trackItemIds, itemDef.id];
    api.setState((draft) => {
      draft.itemsById.set(itemDef.id, itemDef);
      draft.itemIdsByTrackId.set(itemDef.trackId, updatedTrackItemIds);
    });
  };

  const internalApi: InternalTimelineApi = {
    store,
    options,
    setState,
    getState: store.getState,
    eventEmitter,
    _internal: {
      createTrack,
      createItem,
      getItemDependencies,
      getTrackDependencies,
    },
    mount,
    unmount,
    addElementEventListener,
    widthToTime,
    timeToWidth,
    timeToLeft,
    screenToTime,
    getTracks: tracks.get,
    getVisibleTracks,
    getTrackAtHeight,
    getTracksInRange,
    getTrackById,
    getItemById,
    updateTrack,
    updateItem,
    removeTrack,
    removeItem,
    addTrack,
    addItem,
  };

  let api: TimelineApi = internalApi as TimelineApi;
  for (const feature of features) {
    api = Object.assign(api, feature.createTimeline?.(api, options) ?? {});
  }

  return api;
}

const getItemIdsByTrackId = (items: ItemDef[]): Map<string, string[]> => {
  const itemsByTrackId = new Map<string, string[]>();
  for (const item of items) {
    const trackItems = itemsByTrackId.get(item.trackId) || [];
    trackItems.push(item.id);
    itemsByTrackId.set(item.trackId, trackItems);
  }
  return itemsByTrackId;
};

const getItemsById = (items: ItemDef[]): Map<string, ItemDef> => {
  const itemsById = new Map<string, ItemDef>();
  for (const item of items) {
    itemsById.set(item.id, item);
  }
  return itemsById;
};

const getTracksById = (tracks: TrackDef[]): Map<string, TrackDef> => {
  const tracksById = new Map<string, TrackDef>();
  for (const track of tracks) {
    tracksById.set(track.id, track);
  }
  return tracksById;
};
