import type { EventEmitter } from "events";
import { WritableDraft } from "immer";
import StrictEventEmitter from "strict-event-emitter-types";

import type { Store, StoreBuilder, StoreUpdater } from "../types/store.ts";

import { AutoScroll } from "./features/auto-scroll.ts";
import type { Core } from "./features/core.ts";
import { HorizontalScroll } from "./features/horizontal-scroll.ts";
import { ItemDrag } from "./features/item-drag.ts";
import { ItemSelection } from "./features/item-selection.ts";
import { Ruler } from "./features/ruler.ts";
import { TrackDrop } from "./features/track-drop.ts";
import { TrackSelection } from "./features/track-selection.ts";
import { ZoneSelection } from "./features/zone-selection.ts";

/**
 * Track definition.
 * This interface defines the structure of a track in the Timeline, including its ID and height.
 */
export interface TrackDef {
  index: number;
  id: string;
  height: number;
}

/**
 * Track instance.
 * This interface extends the TrackDef and provides additional properties and methods to the tracks.
 */
export interface TrackInstance
  extends TrackDef,
    TrackSelection.TrackInstance,
    Core.TrackInstance,
    TrackDrop.TrackInstance {}

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
    ItemSelection.ItemInstance,
    ItemDrag.ItemInstance {}

/**
 * Internal Timeline options.
 * This interface defines the options that are required for the internal workings of the Timeline module.
 */
export type InternalTimelineOptions = {
  createStore?: StoreBuilder<TimelineState>;
  initialTracks?: TrackDef[];
  initialItems?: ItemDef[];
  onTrackChange?: (track: TrackDef) => void;
  onItemChange?: (item: ItemDef) => void;
};

/**
 * Timeline module options.
 * This interface defines the options that can be passed to the Timeline module.
 */
export interface TimelineOptions
  extends InternalTimelineOptions,
    Core.Options,
    ItemSelection.Options,
    TrackSelection.Options,
    Ruler.Options,
    AutoScroll.Options,
    HorizontalScroll.Options,
    ItemDrag.Options,
    TrackDrop.Options {}

/**
 * Timeline module state.
 * This interface defines the state of the Timeline module.
 */
export interface TimelineState
  extends Core.State,
    ItemSelection.State,
    TrackSelection.State,
    Ruler.State,
    ZoneSelection.State,
    AutoScroll.State,
    ItemDrag.State,
    TrackDrop.State {
  element: HTMLElement | null;
  itemIdsByTrackId: Map<string, Set<string>>;
  itemsById: Map<string, ItemDef>;
  tracksById: Map<string, TrackDef>;
}

/**
 * Timeline events.
 * This interface defines the events that the Timeline module can emit.
 */
export interface TimelineEvents
  extends Core.Events,
    ItemSelection.Events,
    TrackSelection.Events,
    HorizontalScroll.Events,
    ItemDrag.Events,
    TrackDrop.Events {
  "element:mounted": { element: HTMLElement; abortSignal: AbortSignal };
  "element:unmounted": void;
}

export type AddTrackOptions = {
  onConflict?: "before" | "after";
};

export type ElementEvent<K extends keyof HTMLElementEventMap> = {
  event: K;
  listener: (event: HTMLElementEventMap[K]) => void;
  priority?: number;
};

/**
 * Internal Timeline API.
 * This type defines the internal API required for the Timeline module to function.
 */
export type InternalTimelineApi = {
  options: TimelineOptions;
  store: Store<TimelineState>;
  setState: StoreUpdater<TimelineState>;
  getState: () => TimelineState;
  eventEmitter: StrictEventEmitter<EventEmitter, TimelineEvents>;
  mount(element: HTMLElement): void;
  unmount(): void;
  addElementEventListener<K extends keyof HTMLElementEventMap>(
    event: ElementEvent<K>,
  ): void;
  widthToTime(width: number): number;
  timeToWidth(time: number): number;
  timeToLeft(time: number): number;
  screenToTime(x: number): number;
  getVisibleTracks(): string[];
  getTracks(): TrackInstance[];
  getTrackById(id: string): TrackInstance | undefined;
  getItemById(id: string): ItemInstance | undefined;
  getTrackAtHeight(height: number): TrackInstance | undefined;
  getTracksInRange(topHeight: number, bottomHeight: number): TrackInstance[];
  updateTrack(
    trackId: string,
    updater: (track: WritableDraft<TrackDef>) => TrackDef | void,
  ): void;
  updateItem(
    itemId: string,
    updater: (item: WritableDraft<ItemDef>) => ItemDef | void,
  ): void;
  addTrack(trackDef: TrackDef, options?: AddTrackOptions): void;
  addItem(itemDef: ItemDef): void;
  removeTrack(trackId: string): void;
  removeItem(itemId: string): void;
  _internal: {
    createTrack(
      trackDef: TrackDef,
      previousTrack: TrackInstance | undefined,
    ): TrackInstance;
    createItem(itemDef: ItemDef): ItemInstance;
    getItemDependencies(item: ItemDef): any[];
    getTrackDependencies(track: TrackDef): any[];
  };
};

/**
 * API for the Timeline module.
 * This interface defines the methods and properties that the Timeline module exposes.
 */
export interface TimelineApi
  extends InternalTimelineApi,
    Core.Api,
    ItemSelection.Api,
    TrackSelection.Api,
    AutoScroll.Api,
    HorizontalScroll.Api {}

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
  getInitialState?(options: Options): State;
  createTimeline?(api: TimelineApi, options: Options): Api;
  createTrack?(
    api: TimelineApi,
    trackDef: TrackDef,
    prev: TrackInstance | undefined,
  ): TrackApi;
  createItem?(api: TimelineApi, itemDef: ItemDef): ItemApi;
  itemRecomputeDependencies?(api: TimelineApi, item: ItemDef): any[];
  trackRecomputeDependencies?(api: TimelineApi, track: TrackDef): any[];
  onMount?(
    api: TimelineApi,
    element: HTMLElement,
    abortSignal: AbortSignal,
  ): void;
  onUnmount?(api: TimelineApi): void;
};

export type XYPosition = {
  x: number;
  y: number;
};

export type TimelinePosition = XYPosition & {
  time: number;
};

export type DrawRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};
