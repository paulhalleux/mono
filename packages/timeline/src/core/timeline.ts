import { EventEmitter } from "events";

import StrictEventEmitter from "strict-event-emitter-types";

import { createDefaultStore, createStoreUpdater } from "../utils/store.ts";

import { CoreTimelineFeature } from "./features/core.ts";
import {
  InternalTimelineApi,
  TimelineApi,
  TimelineEvents,
  TimelineOptions,
  TimelineState,
} from "./types.ts";

const BUILT_IN_FEATURES = [CoreTimelineFeature];

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

  const internalApi: InternalTimelineApi = {
    store,
    setState,
    eventEmitter,
    abortSignal: abortController.signal,
    destroy: () => {
      eventEmitter.removeAllListeners();
      abortController.abort();
    },
  };

  const api = features.reduce(
    (api, feature) => ({
      ...api,
      ...feature.createTimeline(internalApi, options),
    }),
    {} as TimelineApi,
  );

  return {
    ...api,
    ...internalApi,
  };
}
