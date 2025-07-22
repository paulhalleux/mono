import { EventEmitter } from "events";

import { enableMapSet } from "immer";
import StrictEventEmitter from "strict-event-emitter-types";

import { createDefaultStore, createStoreUpdater } from "../utils/store.ts";

import { CoreTimelineFeature } from "./features/core.ts";
import { ItemSelectionFeature } from "./features/item-selection.ts";
import { RulerFeature } from "./features/ruler.ts";
import {
  InternalTimelineApi,
  ItemDef,
  ItemInstance,
  TimelineApi,
  TimelineEvents,
  TimelineOptions,
  TimelineState,
  TrackDef,
  TrackInstance,
} from "./types.ts";

enableMapSet();

const BUILT_IN_FEATURES = [
  CoreTimelineFeature,
  ItemSelectionFeature,
  RulerFeature,
];

export function createTimeline(options: TimelineOptions = {}): TimelineApi {
  const features = BUILT_IN_FEATURES;

  const abortController = new AbortController();
  const eventEmitter: StrictEventEmitter<EventEmitter, TimelineEvents> =
    new EventEmitter();

  const initialState: TimelineState = features.reduce(
    (state, feature) => ({
      ...state,
      ...feature.getInitialState(options),
    }),
    {} as TimelineState,
  );

  const store = options.createStore
    ? options.createStore(initialState)
    : createDefaultStore(initialState);
  const setState = createStoreUpdater(store);

  const createTrack = (
    trackDef: TrackDef,
    previousTrack: TrackInstance | undefined,
  ): TrackInstance => {
    const tlApi = { ...api, ...internalApi };
    return features.reduce((previousValue, currentValue) => {
      return {
        ...previousValue,
        ...(currentValue.createTrack?.(tlApi, trackDef, previousTrack) ?? {}),
      };
    }, trackDef as TrackInstance);
  };

  const createItem = (itemDef: ItemDef): ItemInstance => {
    const tlApi = { ...api, ...internalApi };
    return features.reduce((previousValue, currentValue) => {
      return {
        ...previousValue,
        ...(currentValue.createItem?.(tlApi, itemDef) ?? previousValue),
      };
    }, itemDef as ItemInstance);
  };

  const internalApi: InternalTimelineApi = {
    store,
    options,
    setState,
    eventEmitter,
    abortSignal: abortController.signal,
    destroy: () => {
      eventEmitter.removeAllListeners();
      abortController.abort();
    },
    _internal: {
      createTrack,
      createItem,
    },
  };

  const api = features.reduce(
    (api, feature) => ({
      ...api,
      ...(feature.createTimeline?.(internalApi, options) ?? {}),
    }),
    {} as TimelineApi,
  );

  return {
    ...api,
    ...internalApi,
  };
}
