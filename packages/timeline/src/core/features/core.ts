import {
  ItemDef,
  ItemInstance as TimelineItemInstance,
  TimelineFeature,
  TrackDef,
  TrackInstance as TimelineTrackInstance,
} from "../types";
import { memoizeArrayItems } from "../utils/memoize-array.ts";
import { timeToWidth } from "../utils/scale.ts";
import { binarySearchIndex } from "../utils/search.ts";

const DEFAULT_TRACK_HEADER_WIDTH = 0;
const DEFAULT_MIN_VISIBLE_DURATION = 1000 * 10; // 10 seconds
const DEFAULT_MAX_VISIBLE_DURATION = 1000 * 60 * 10; // 10 minutes
const DEFAULT_CHUNK_SIZE = 640; // 640x viewport width

type ChunkedPosition = {
  index: number; // Index of the chunk
  offset: number; // Offset within the chunk
};

export type ViewportState = {
  viewportWidth: number;
  viewportDuration: number;
  timelineWidth: number;
  zoomLevel: number;
  timePositionOffsetPx: number;
  chunkedPosition: ChunkedPosition;
  virtualizedTracks: {
    startIndex: number;
    endIndex: number;
    totalHeight: number;
  };
};

export declare namespace Core {
  export interface Api {
    mount(element: HTMLElement): void;
    unmount(): void;
    setZoomLevel(zoomLevel: number): void;
    setTimePosition(position: number): void;
    getTimePosition(): number;
    getItemOffsetPx(timePosition: number): number;
    getItemWidthPx(duration: number): number;
    getTracks(): TimelineTrackInstance[];
  }

  export interface ItemInstance {
    leftOffset: number;
    width: number;
    duration: number;
    attributes: Record<string, any>;
  }

  export interface TrackInstance {
    top: number;
    getItems(): TimelineItemInstance[];
    attributes: Record<string, any>;
  }

  export interface Options {
    trackHeaderWidth?: number;
    minVisibleDuration?: number;
    maxVisibleDuration?: number;
    tracks?: TrackDef[];
    items?: ItemDef[];
  }

  export interface State {
    itemsByTrack: Record<string, ItemDef[]>;
    viewportState: ViewportState;
  }

  export interface Events {
    "element:mounted": { element: HTMLElement };
    "element:unmounted": void;
    "viewport:updated": ViewportState;
  }
}

export const CoreTimelineFeature: TimelineFeature<
  Core.Api,
  Core.Options,
  Core.State,
  Core.TrackInstance,
  Core.ItemInstance
> = {
  getInitialState(options) {
    return {
      viewportState: {
        viewportWidth: 0,
        viewportDuration: DEFAULT_MIN_VISIBLE_DURATION,
        timelineWidth: 0,
        zoomLevel: 1,
        timePositionOffsetPx: 0,
        virtualizedTracks: {
          startIndex: 0,
          endIndex: 0,
          totalHeight: 0,
        },
        chunkedPosition: {
          index: 0,
          offset: 0,
        },
      },
      itemsByTrack: (options.items ?? []).reduce<Record<string, ItemDef[]>>(
        (acc, item) => {
          if (!acc[item.trackId]) {
            acc[item.trackId] = [];
          }
          acc[item.trackId].push(item);
          return acc;
        },
        {},
      ),
    };
  },
  createTimeline: (api, options) => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        api.setState((draft) => {
          draft.viewportState.viewportWidth =
            width - (options.trackHeaderWidth ?? DEFAULT_TRACK_HEADER_WIDTH);
          draft.viewportState.timelineWidth =
            draft.viewportState.viewportWidth * DEFAULT_CHUNK_SIZE;
        });
        recomputeViewport();
      }
    });

    /**
     * Mounts the viewport to a given HTML element.
     * @param element The HTML element to mount the viewport to.
     */
    const mount = (element: HTMLElement) => {
      resizeObserver.observe(element);
      api.eventEmitter.emit("element:mounted", { element });
      registerScrollListener(element, {
        signal: api.abortSignal,
        initialRun: true,
      });
    };

    /**
     * Unmounts the viewport from the currently mounted HTML element.
     * It stops observing the element for size changes and clears the viewport state.
     */
    const unmount = () => {
      resizeObserver.disconnect();

      api.setState((draft) => {
        draft.viewportState.viewportWidth = 0;
        draft.viewportState.zoomLevel = 1;
      });

      api.eventEmitter.emit("element:unmounted");
    };

    /**
     * Sets the zoom level of the timeline.
     * @param zoomLevel The zoom level to set, between 0 and 1.
     */
    const setZoomLevel = (zoomLevel: number) => {
      api.setState((draft) => {
        const roundedZoomLevel = Math.round(zoomLevel * 1000) / 1000;
        const prevTimeDuration = getTimePosition();

        const minVisibleDuration =
          options.minVisibleDuration ?? DEFAULT_MIN_VISIBLE_DURATION;
        const maxVisibleDuration =
          options.maxVisibleDuration ?? DEFAULT_MAX_VISIBLE_DURATION;

        draft.viewportState.zoomLevel = roundedZoomLevel;
        draft.viewportState.viewportDuration = Math.round(
          minVisibleDuration +
            (maxVisibleDuration - minVisibleDuration) * (1 - zoomLevel),
        );

        const chunkDuration =
          draft.viewportState.viewportDuration * DEFAULT_CHUNK_SIZE;
        draft.viewportState.chunkedPosition = {
          index: Math.floor(prevTimeDuration / chunkDuration),
          offset: prevTimeDuration % chunkDuration,
        };
      });

      recomputeViewport();
    };

    /**
     * Sets the time position of the timeline.
     * @param position The time position to set in milliseconds.
     */
    const setTimePosition = (position: number) => {
      api.setState((draft) => {
        const chunkDuration =
          draft.viewportState.viewportDuration * DEFAULT_CHUNK_SIZE;
        draft.viewportState.chunkedPosition = {
          index: Math.floor(position / chunkDuration),
          offset: position % chunkDuration,
        };
      });

      recomputeViewport();
    };

    /**
     * Gets the current time position of the timeline.
     * @returns The current time position in milliseconds.
     */
    const getTimePosition = () => {
      const { chunkedPosition, viewportDuration } =
        api.store.getState().viewportState;
      const chunkDuration = viewportDuration * DEFAULT_CHUNK_SIZE;
      return chunkedPosition.index * chunkDuration + chunkedPosition.offset;
    };

    /**
     * Recomputes the viewport state based on the current chunked position.
     * It calculates the time position offset in pixels and updates the viewport state.
     */
    const recomputeViewport = () => {
      const { viewportState } = api.store.getState();
      const { viewportDuration, chunkedPosition } = viewportState;

      const chunkDuration = viewportDuration * DEFAULT_CHUNK_SIZE;
      const timePositionOffsetPx = getItemOffsetPx(
        chunkedPosition.index * chunkDuration + chunkedPosition.offset,
      );

      api.setState((draft) => {
        draft.viewportState.timePositionOffsetPx = timePositionOffsetPx;
      });

      api.eventEmitter.emit("viewport:updated", viewportState);
    };

    /**
     * Gets the pixel offset for a given time position.
     * @param timePosition The time position in milliseconds.
     * @returns The pixel offset for the given time position.
     */
    const getItemOffsetPx = (timePosition: number): number => {
      const { viewportWidth, viewportDuration } =
        api.store.getState().viewportState;

      const msInPx = viewportWidth / viewportDuration;
      return timePosition * msInPx;
    };

    /**
     * Gets the pixel width for a given duration.
     * @param duration The duration in milliseconds.
     * @returns The pixel width for the given duration.
     */
    const getItemWidthPx = (duration: number): number => {
      const { viewportState } = api.store.getState();
      const { viewportWidth, viewportDuration } = viewportState;
      return timeToWidth(duration, viewportWidth, viewportDuration);
    };

    const getTracksMemo = memoizeArrayItems<TimelineTrackInstance, []>({
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

    const getTracks = () => {
      const {
        viewportState: { virtualizedTracks },
      } = api.store.getState();
      return getTracksMemo().slice(
        virtualizedTracks.startIndex,
        virtualizedTracks.endIndex + 1,
      );
    };

    const registerScrollListener = (
      element: HTMLElement,
      options: {
        signal: AbortSignal;
        initialRun?: boolean;
      },
    ) => {
      const handler = () => {
        const tracks = getTracksMemo();

        const startIndex = Math.max(
          0,
          binarySearchIndex(
            tracks,
            (track) => track.top + track.height > element.scrollTop,
            true,
          ) - 4,
        );

        const endIndex = Math.min(
          binarySearchIndex(
            tracks,
            (track) => track.top < element.scrollTop + element.clientHeight,
            false,
          ) + 4,
          tracks.length - 1,
        );

        api.setState((draft) => {
          draft.viewportState.virtualizedTracks = {
            startIndex: startIndex >= 0 ? startIndex : 0,
            endIndex: endIndex >= 0 ? endIndex : tracks.length - 1,
            totalHeight:
              (tracks.at(-1)?.top ?? 0) + (tracks.at(-1)?.height ?? 0),
          };
        });
      };

      element.addEventListener("scroll", handler, { signal: options.signal });
      if (options.initialRun) {
        setTimeout(handler, 0);
      }
    };

    return {
      mount,
      unmount,
      setZoomLevel,
      setTimePosition,
      getTimePosition,
      getItemOffsetPx,
      getItemWidthPx,
      getTracks,
    };
  },
  createItem(api, itemDef) {
    return {
      leftOffset: api.getItemOffsetPx(itemDef.start),
      width: api.getItemWidthPx(itemDef.end - itemDef.start),
      duration: itemDef.end - itemDef.start,
      attributes: {
        "data-item-id": itemDef.id,
        "data-parent-track-id": itemDef.trackId,
      },
    };
  },
  itemRecomputeDependencies(api, item) {
    const { viewportState } = api.store.getState();
    return [item, viewportState.viewportWidth, viewportState.viewportDuration];
  },
  createTrack(api, { id }, previousTrack) {
    const getItems = memoizeArrayItems<TimelineItemInstance, [trackId: string]>(
      {
        deps: (index, [trackId]: [trackId: string]) => {
          const { itemsByTrack } = api.store.getState();
          const itemDef = itemsByTrack[trackId][index];
          return api._internal.getItemDependencies(itemDef, index);
        },
        itemFactory: (index, _, [trackId]) => {
          const item = api.store.getState().itemsByTrack[trackId][index];
          return api._internal.createItem(item);
        },
        itemCountFn: (trackId) => {
          const items = api.store.getState().itemsByTrack[trackId];
          return items ? items.length : 0;
        },
      },
    );

    return {
      top: (previousTrack?.top ?? 0) + (previousTrack?.height ?? 0),
      attributes: {
        "data-track-id": id,
      },
      getItems: () => {
        return virtualizeItems(
          getItems(id),
          api.getTimePosition(),
          api.store.getState().viewportState.viewportDuration,
        );
      },
    };
  },
  trackRecomputeDependencies(_, track) {
    return [track];
  },
};

function virtualizeItems(
  items: TimelineItemInstance[],
  timePosition: number,
  viewportDuration: number,
): TimelineItemInstance[] {
  if (items.length === 0) return [];

  const startIndex = binarySearchIndex(
    items,
    (item) => item.end > timePosition,
    true,
  );

  const endIndex = binarySearchIndex(
    items,
    (item) => item.start < timePosition + viewportDuration,
    false,
  );

  if (startIndex >= items.length || endIndex < 0) return [];

  return items.slice(startIndex, endIndex + 1);
}
