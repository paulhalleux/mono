import { TimelineFeature } from "../types";
import {
  getDragDataTransfer,
  isValidDataTransfer,
  TimelineDragData,
} from "../utils/dnd.ts";

export declare namespace TrackDrop {
  interface TrackDropState {
    trackId: string;
    draggedData: TimelineDragData;
  }

  export interface TrackInstance {
    isDropTarget: boolean;
  }
  export interface Options {}
  export interface State {
    trackDropState?: TrackDropState;
  }
  export interface Events {
    "track:dragenter": TrackDropState;
    "track:dragleave": TrackDropState;
    "track:drop": TimelineDragData;
  }
}

export const TrackDropFeature: TimelineFeature<
  {},
  TrackDrop.Options,
  TrackDrop.State,
  TrackDrop.TrackInstance
> = {
  getInitialState() {
    return {
      trackDropState: undefined,
    };
  },
  onMount(api, element, abortSignal) {
    element.addEventListener(
      "dragover",
      (event) => {
        const closestTrack = (event.target as HTMLElement).closest(
          "[data-track-id]",
        );
        if (!closestTrack || !(closestTrack instanceof HTMLElement)) return;
        const trackId = closestTrack.dataset.trackId;
        if (!trackId) return;

        const { trackDropState } = api.getState();
        if (trackDropState?.trackId === trackId) return;
        if (!event.dataTransfer || !isValidDataTransfer(event.dataTransfer)) {
          return;
        }

        const draggedData = getDragDataTransfer(event.dataTransfer);
        if (!draggedData) return;

        const state = {
          trackId,
          draggedData: draggedData,
        };

        api.store.setState({
          trackDropState: state,
        });

        api.eventEmitter.emit("track:dragenter", state);
      },
      { signal: abortSignal },
    );

    element.addEventListener(
      "dragleave",
      () => {
        const { trackDropState } = api.getState();
        if (!trackDropState) return;
        api.eventEmitter.emit("track:dragleave", trackDropState);
        api.store.setState({ trackDropState: undefined });
      },
      { signal: abortSignal },
    );

    element.addEventListener(
      "drop",
      () => {
        const { trackDropState } = api.getState();
        if (!trackDropState) return;

        api.store.setState({ trackDropState: undefined });

        api.eventEmitter.emit("track:drop", trackDropState.draggedData);
      },
      { signal: abortSignal },
    );
  },
  createTrack(api, trackDef) {
    const { trackDropState } = api.getState();
    return {
      isDropTarget: trackDropState?.trackId === trackDef.id,
    };
  },
  trackRecomputeDependencies(api, trackDef) {
    const { trackDropState } = api.getState();
    return [trackDropState?.trackId === trackDef.id];
  },
};
