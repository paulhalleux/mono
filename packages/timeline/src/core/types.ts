import type { EventEmitter } from "events";
import StrictEventEmitter from "strict-event-emitter-types";

import type { Store, StoreBuilder, StoreUpdater } from "../types/store.ts";

import type { Core } from "./features/core.ts";
import { ItemSelection } from "./features/item-selection.ts";
import { Ruler } from "./features/ruler.ts";
import { ZoneSelection } from "./features/zone-selection.ts";

/**
 * Track definition.
 * This interface defines the structure of a track in the Timeline, including its ID and height.
 */
export interface TrackDef {
  id: string;
  height: number;
}

/**
 * Track instance.
 * This interface extends the TrackDef and provides additional properties and methods to the tracks.
 */
export interface TrackInstance extends TrackDef, Core.TrackInstance {}

/**
 * Item definition.
 * This interface defines the structure of an item in the Timeline, including its ID, start and end times, and associated track ID.
 */
export interface ItemDef {
  id: string;
  start: number;
  end: number;
  trackId: string;
}

/**
 * Item instance.
 * This interface extends the ItemDef and provides additional properties and methods to the items.
 */
export interface ItemInstance
  extends ItemDef,
    Core.ItemInstance,
    ItemSelection.ItemInstance {}

/**
 * Internal Timeline options.
 * This interface defines the options that are required for the internal workings of the Timeline module.
 */
export type InternalTimelineOptions = {
  createStore?: StoreBuilder<TimelineState>;
};

/**
 * Timeline module options.
 * This interface defines the options that can be passed to the Timeline module.
 */
export interface TimelineOptions
  extends InternalTimelineOptions,
    Core.Options,
    ItemSelection.Options,
    Ruler.Options,
    ZoneSelection.Options {}

/**
 * Timeline module state.
 * This interface defines the state of the Timeline module.
 */
export interface TimelineState
  extends Core.State,
    ItemSelection.State,
    Ruler.State,
    ZoneSelection.State {}

/**
 * Timeline events.
 * This interface defines the events that the Timeline module can emit.
 */
export interface TimelineEvents extends Core.Events, ItemSelection.Events {}

/**
 * Internal Timeline API.
 * This type defines the internal API required for the Timeline module to function.
 */
export type InternalTimelineApi = {
  options: TimelineOptions;
  store: Store<TimelineState>;
  setState: StoreUpdater<TimelineState>;
  abortSignal: AbortSignal;
  eventEmitter: StrictEventEmitter<EventEmitter, TimelineEvents>;
  destroy(): void;
  getVisibleTracks(): TrackInstance[];
  getTracks(): TrackInstance[];
  _internal: {
    createTrack(
      trackDef: TrackDef,
      previousTrack: TrackInstance | undefined,
    ): TrackInstance;
    createItem(itemDef: ItemDef): ItemInstance;
    getItemDependencies(item: ItemDef, index: number): any[];
    getTrackDependencies(track: TrackDef, index: number): any[];
    getTrackAtHeight(height: number): TrackInstance | undefined;
    getTracksInRange(topHeight: number, bottomHeight: number): TrackInstance[];
    widthToTime(width: number): number;
    timeToWidth(time: number): number;
    timeToLeft(time: number): number;
    screenToTime(x: number): number;
  };
};

/**
 * API for the Timeline module.
 * This interface defines the methods and properties that the Timeline module exposes.
 */
export interface TimelineApi
  extends InternalTimelineApi,
    Core.Api,
    ItemSelection.Api {}

/**
 * Timeline feature type.
 * This type defines the structure of a Timeline feature, including the method to create a timeline and optional initial state.
 */
export type TimelineFeature<
  Api,
  Options = {},
  State = {},
  TrackApi = {},
  ItemApi = {},
> = {
  getInitialState(options: Options): State;
  createTimeline?(api: InternalTimelineApi, options: Options): Api;
  createTrack?(
    api: InternalTimelineApi & Api,
    trackDef: TrackDef,
    prev: TrackInstance | undefined,
  ): TrackApi;
  createItem?(api: InternalTimelineApi & Api, itemDef: ItemDef): ItemApi;
  itemRecomputeDependencies?(
    api: InternalTimelineApi & Api,
    item: ItemDef,
    index: number,
  ): any[];
  trackRecomputeDependencies?(
    api: InternalTimelineApi & Api,
    track: TrackDef,
    index: number,
  ): any[];
};

export type XYPosition = {
  x: number;
  y: number;
};

export type DrawRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};
