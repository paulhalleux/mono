import { TimelineFeature } from "../types";

const DEFAULT_TRACK_HEADER_WIDTH = 0;
const DEFAULT_MIN_VISIBLE_DURATION = 1000 * 10; // 10 seconds
const DEFAULT_MAX_VISIBLE_DURATION = 1000 * 60 * 10; // 10 minutes
const DEFAULT_CHUNK_SIZE = 640; // 640x viewport width

type ChunkedPosition = {
  index: number; // Index of the chunk
  offset: number; // Offset within the chunk
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
  }

  export interface Options {
    trackHeaderWidth?: number;
    minVisibleDuration?: number;
    maxVisibleDuration?: number;
  }

  export interface State {
    viewportState: {
      viewportWidth: number;
      viewportDuration: number;
      timelineWidth: number;
      zoomLevel: number;
      timePositionOffsetPx: number;
      chunkedPosition: ChunkedPosition;
    };
  }

  export interface Events {
    "element:mounted": { element: HTMLElement };
    "element:unmounted": void;
  }
}

export const CoreTimelineFeature: TimelineFeature<
  Core.Api,
  Core.Options,
  Core.State
> = {
  getInitialState() {
    return {
      viewportState: {
        viewportWidth: 0,
        viewportDuration: DEFAULT_MIN_VISIBLE_DURATION,
        timelineWidth: 0,
        zoomLevel: 1,
        timePositionOffsetPx: 0,
        chunkedPosition: {
          index: 0,
          offset: 0,
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

    /**
     * Mounts the viewport to a given HTML element.
     * @param element The HTML element to mount the viewport to.
     */
    const mount = (element: HTMLElement) => {
      resizeObserver.observe(element);
      api.eventEmitter.emit("element:mounted", { element });
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

    const getTimePosition = () => {
      const { chunkedPosition, viewportDuration } =
        api.store.getState().viewportState;
      const chunkDuration = viewportDuration * DEFAULT_CHUNK_SIZE;
      return chunkedPosition.index * chunkDuration + chunkedPosition.offset;
    };

    const recomputeViewport = () => {
      const { viewportState } = api.store.getState();
      const { viewportDuration, chunkedPosition } = viewportState;

      const chunkDuration = viewportDuration * DEFAULT_CHUNK_SIZE;
      const timePositionOffsetPx = getItemOffsetPx(
        chunkedPosition.index * chunkDuration + chunkedPosition.offset,
      );

      api.setState((draft) => {
        draft.viewportState.timePositionOffsetPx =
          Math.floor(timePositionOffsetPx);
      });
    };

    const getItemOffsetPx = (timePosition: number): number => {
      const { viewportWidth, viewportDuration } =
        api.store.getState().viewportState;

      const msInPx = viewportWidth / viewportDuration;
      return timePosition * msInPx;
    };

    const getItemWidthPx = (duration: number): number => {
      const { viewportState } = api.store.getState();
      const { viewportWidth, viewportDuration } = viewportState;

      const ratio = duration / viewportDuration;
      return Math.round(viewportWidth * ratio);
    };

    return {
      mount,
      unmount,
      setZoomLevel,
      setTimePosition,
      getTimePosition,
      getItemOffsetPx,
      getItemWidthPx,
    };
  },
};
