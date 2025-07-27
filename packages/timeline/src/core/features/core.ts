import { WritableDraft } from "immer";
import throttle from "lodash/throttle";

import {
  ItemDef,
  ItemInstance as TimelineItemInstance,
  TimelineFeature,
  TrackDef,
} from "../types";
import { ArrayCache, memoizeArrayItems } from "../utils/memoize-array.ts";
import { binarySearchIndex } from "../utils/search.ts";
import { virtualizeItems } from "../utils/virtualization.ts";

const DEFAULT_TRACK_HEADER_WIDTH = 0;
const DEFAULT_MIN_VISIBLE_DURATION = 1000 * 10; // 10 seconds
const DEFAULT_MAX_VISIBLE_DURATION = 1000 * 60 * 10; // 10 minutes
const DEFAULT_CHUNK_SIZE = 2; // 2x viewport width

type ChunkedPosition = {
  index: number; // Index of the chunk
  offset: number; // Offset within the chunk
  duration: number; // Duration of the chunk in milliseconds
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
    setZoomLevel(zoomLevel: number): void;
    setTimePosition(position: number): void;
    getTimePosition(): number;
  }

  export interface ItemInstance {
    leftOffset: number;
    width: number;
    duration: number;
    attributes: Record<string, any>;
    update(updater: (item: WritableDraft<ItemDef>) => ItemDef | void): void;
    remove(): void;
  }

  export interface TrackInstance {
    top: number;
    attributes: Record<string, any>;
    getItems(): TimelineItemInstance[];
    getItemById(id: string): TimelineItemInstance | undefined;
    getVisibleItems(): string[];
    update(updater: (track: WritableDraft<TrackDef>) => TrackDef | void): void;
    remove(): void;
  }

  export interface Options {
    trackHeaderWidth?: number;
    minVisibleDuration?: number;
    maxVisibleDuration?: number;
    viewportChunkSize?: number;
  }

  export interface State {
    trackItemCacheById: Map<string, ArrayCache<TimelineItemInstance>>;
    viewportState: ViewportState;
  }

  export interface Events {
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
  getInitialState() {
    return {
      trackItemCacheById: new Map(),
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
          duration: DEFAULT_MIN_VISIBLE_DURATION * DEFAULT_CHUNK_SIZE,
        },
      },
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

    api.eventEmitter.on("element:mounted", ({ element, abortSignal }) => {
      resizeObserver.observe(element);
      registerScrollListener(element, {
        signal: abortSignal,
        initialRun: true,
      });
    });

    api.eventEmitter.on("element:unmounted", () => {
      resizeObserver.disconnect();

      api.setState((draft) => {
        draft.viewportState.viewportWidth = 0;
        draft.viewportState.zoomLevel = 1;
      });
    });

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
        const viewportChunkSize =
          options.viewportChunkSize ?? DEFAULT_CHUNK_SIZE;

        draft.viewportState.zoomLevel = roundedZoomLevel;
        draft.viewportState.viewportDuration = Math.round(
          minVisibleDuration +
            (maxVisibleDuration - minVisibleDuration) * (1 - zoomLevel),
        );

        const chunkDuration =
          draft.viewportState.viewportDuration * viewportChunkSize;
        draft.viewportState.chunkedPosition = {
          index: Math.floor(prevTimeDuration / chunkDuration),
          offset: prevTimeDuration % chunkDuration,
          duration: chunkDuration,
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
        const viewportChunkSize =
          options.viewportChunkSize ?? DEFAULT_CHUNK_SIZE;
        const chunkDuration =
          draft.viewportState.viewportDuration * viewportChunkSize;
        draft.viewportState.chunkedPosition = {
          index: Math.floor(position / chunkDuration),
          offset: Math.floor(position % chunkDuration),
          duration: chunkDuration,
        };
      });

      recomputeViewport();
    };

    /**
     * Gets the current time position of the timeline.
     * @returns The current time position in milliseconds.
     */
    const getTimePosition = () => {
      const { chunkedPosition } = api.getState().viewportState;
      const pastChunkDuration =
        chunkedPosition.index * chunkedPosition.duration;
      return pastChunkDuration + chunkedPosition.offset;
    };

    /**
     * Recomputes the viewport state based on the current chunked position.
     * It calculates the time position offset in pixels and updates the viewport state.
     */
    const recomputeViewport = () => {
      const { viewportState } = api.getState();
      const { chunkedPosition } = viewportState;

      const timePositionOffsetPx = -api.timeToLeft(
        chunkedPosition.offset +
          chunkedPosition.index * chunkedPosition.duration,
      );

      api.setState((draft) => {
        draft.viewportState.timePositionOffsetPx = timePositionOffsetPx;
      });

      api.eventEmitter.emit("viewport:updated", viewportState);
    };

    const registerScrollListener = (
      element: HTMLElement,
      options: {
        signal: AbortSignal;
        initialRun?: boolean;
      },
    ) => {
      const handler = () => {
        const tracks = api.getTracks();

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
      setZoomLevel,
      setTimePosition,
      getTimePosition,
    };
  },
  createItem(api, itemDef) {
    return {
      leftOffset: api.timeToLeft(itemDef.start),
      width: api.timeToWidth(itemDef.end - itemDef.start),
      duration: itemDef.end - itemDef.start,
      attributes: {
        "data-item-id": itemDef.id,
      },
      update: (updater) => {
        api.updateItem(itemDef.id, updater);
      },
      remove: () => {
        api.removeItem(itemDef.id);
      },
    };
  },
  itemRecomputeDependencies(api) {
    const { viewportState } = api.getState();
    return [
      viewportState.viewportWidth,
      viewportState.viewportDuration,
      viewportState.chunkedPosition.index,
    ];
  },
  createTrack(api, { id }, previousTrack) {
    const { trackItemCacheById } = api.getState();
    const items =
      trackItemCacheById.get(id) ??
      memoizeArrayItems<TimelineItemInstance, [trackId: string]>({
        deps: (id) => {
          const { itemsById } = api.getState();
          const itemDef = itemsById.get(id);
          if (!itemDef) {
            return [];
          }
          return api._internal.getItemDependencies(itemDef);
        },
        itemFactory: (id) => {
          const { itemsById } = api.getState();
          const item = itemsById.get(id);
          if (!item) {
            throw new Error(`Item with id ${id} not found`);
          }
          return api._internal.createItem(item);
        },
        getIds: (trackId) => {
          const { itemIdsByTrackId } = api.getState();
          return Array.from(itemIdsByTrackId.get(trackId)?.values() ?? []);
        },
      });

    api.setState((draft) => {
      draft.trackItemCacheById.set(id, items);
    });

    return {
      top: (previousTrack?.top ?? 0) + (previousTrack?.height ?? 0),
      attributes: {
        "data-track-id": id,
      },
      getItems: () => {
        return items.get(id);
      },
      getItemById: (itemId: string) => {
        return items.getById(itemId, id);
      },
      getVisibleItems: () => {
        return virtualizeItems(
          items.get(id),
          api.getTimePosition(),
          api.getState().viewportState.viewportDuration,
        );
      },
      update: (updater) => {
        api.updateTrack(id, updater);
      },
      remove: () => {
        api.removeTrack(id);
      },
    };
  },
  onMount(api, element, abortSignal) {
    const updateState = throttle((event: WheelEvent) => {
      const { viewportState } = api.getState();
      const zoomChange = event.deltaY > 0 ? -0.05 : 0.05;
      const newZoomLevel = Math.max(
        0,
        Math.min(1, viewportState.zoomLevel + zoomChange),
      );

      api.setZoomLevel(newZoomLevel);
    }, 1000 / 60);

    element.addEventListener(
      "wheel",
      (event) => {
        if (!(event.deltaY && event.ctrlKey) || event.shiftKey) {
          return;
        }

        event.preventDefault();
        updateState(event);
      },
      {
        signal: abortSignal,
      },
    );
  },
};
