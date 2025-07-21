import { Store, StoreBuilder, StoreUpdater } from "@paulhalleux/store-utils";

import type { Core } from "./features/core.ts";

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
    Core.Options {}

/**
 * Timeline module state.
 * This interface defines the state of the Timeline module.
 */
export interface TimelineState extends Core.State {}

/**
 * Internal Timeline API.
 * This type defines the internal API required for the Timeline module to function.
 */
export type InternalTimelineApi = {
  store: Store<TimelineState>;
  setState: StoreUpdater<TimelineState>;
};

/**
 * API for the Timeline module.
 * This interface defines the methods and properties that the Timeline module exposes.
 */
export interface TimelineApi extends InternalTimelineApi, Core.Api {}

/**
 * Timeline feature type.
 * This type defines the structure of a Timeline feature, including the method to create a timeline and optional initial state.
 */
export type TimelineFeature<Api, Options = never, State = never> = {
  createTimeline(api: InternalTimelineApi, options: Options): Api;
  initialState: State;
};
