import { EventEmitter } from "events";

import { castDraft, enableMapSet } from "immer";
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

  const eventEmitter: StrictEventEmitter<EventEmitter, TimelineEvents> =
    new EventEmitter();

  const initialState: TimelineState = features.reduce(
    (state, feature) => ({
      ...state,
      ...(feature.getInitialState?.(options) ?? {}),
    }),
    {
      element: null,
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

    features.forEach((feature) => {
      feature.onMount?.(api, element, abortController.signal);
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
   * @param index The index of the track in the timeline.
   * @returns An array of dependencies for the track.
   */
  const getTrackDependencies = (track: TrackDef, index: number): any[] => {
    return features.reduce((deps, feature) => {
      return [
        ...deps,
        ...(feature.trackRecomputeDependencies?.(api, track, index) ?? []),
      ];
    }, [] as any[]);
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
   * @param index The index of the item in the timeline.
   * @returns An array of dependencies for the item.
   */
  const getItemDependencies = (item: ItemDef, index: number): any[] => {
    return features.reduce((deps, feature) => {
      return [
        ...deps,
        ...(feature.itemRecomputeDependencies?.(api, item, index) ?? []),
      ];
    }, [] as any[]);
  };

  /**
   * Gets the tracks defined in the timeline options.
   * It uses memoization to optimize performance by caching track instances.
   * @returns An array of track instances.
   */
  const getTracks = memoizeArrayItems<TimelineTrackInstance, []>({
    deps: (index) => {
      const { tracks = [] } = api.options;
      const trackDef = tracks[index];
      if (!trackDef) {
        return [];
      }
      return api._internal.getTrackDependencies(trackDef, index);
    },
    itemCountFn: () => options.tracks?.length ?? 0,
    itemFactory: (index, prev) => {
      const trackDef = options.tracks?.[index];
      if (!trackDef) {
        throw new Error(`Track definition at index ${index} is undefined`);
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
    } = api.store.getState();
    return getTracks().slice(
      virtualizedTracks.startIndex,
      virtualizedTracks.endIndex + 1,
    );
  };

  /**
   * Gets the track at a specific height.
   * @param height The height in pixels.
   * @returns The track instance at the specified height, or undefined if not found.
   */
  const getTrackAtHeight = (
    height: number,
  ): TimelineTrackInstance | undefined => {
    const tracks = getTracks();
    return tracks.find(
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
    const tracks = getTracks();
    return tracks.filter(
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
    const tracks = getTracks();
    return tracks.find((track) => track.id === id);
  };

  /**
   * Gets an item instance by its ID.
   * @param id The ID of the item.
   * @returns The item instance with the specified ID, or undefined if not found.
   */
  const getItemById = (id: string): ItemInstance | undefined => {
    const itemDef = api.options.items?.find((item) => item.id === id);
    if (!itemDef) {
      return undefined;
    }
    const track = getTrackById(itemDef.trackId);
    return track?.getItems().find((item) => item.id === id);
  };

  /**
   * Converts a width in pixels to a time in milliseconds based on the current viewport state.
   * @param width The width in pixels.
   * @returns The corresponding time in milliseconds.
   */
  const widthToTime = (width: number): number => {
    const {
      viewportState: { viewportWidth, viewportDuration },
    } = api.store.getState();
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
    } = api.store.getState();
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
    } = api.store.getState();
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
    } = api.store.getState();
    return (
      ScaleUtils.widthToTime(x, viewportWidth, viewportDuration) +
      chunkedPosition.offset +
      chunkedPosition.index * chunkedPosition.duration
    );
  };

  const internalApi: InternalTimelineApi = {
    store,
    options,
    setState,
    eventEmitter,
    _internal: {
      createTrack,
      createItem,
      getItemDependencies,
      getTrackDependencies,
      widthToTime,
      timeToWidth,
      timeToLeft,
      screenToTime,
    },
    mount,
    unmount,
    getTracks,
    getVisibleTracks,
    getTrackAtHeight,
    getTracksInRange,
    getTrackById,
    getItemById,
  };

  let api: TimelineApi = internalApi as TimelineApi;
  for (const feature of features) {
    api = Object.assign(api, feature.createTimeline?.(api, options) ?? {});
  }

  return api;
}
