import {
  createDefaultStore,
  createStoreUpdater,
} from "@paulhalleux/store-utils";

import { CoreTimelineFeature } from "./features/core.ts";
import {
  InternalTimelineApi,
  TimelineApi,
  TimelineOptions,
  TimelineState,
} from "./types.ts";

const BUILT_IN_FEATURES = [CoreTimelineFeature];

export function createTimeline(options: TimelineOptions = {}): TimelineApi {
  const features = BUILT_IN_FEATURES;

  const initialState: TimelineState = features.reduce(
    (state, feature) => ({
      ...state,
      ...feature.initialState,
    }),
    {},
  );

  const store = options.createStore
    ? options.createStore(initialState)
    : createDefaultStore(initialState);
  const setState = createStoreUpdater(store);

  const internalApi: InternalTimelineApi = {
    store,
    setState,
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
