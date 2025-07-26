import { TimelineFeature } from "../types";

export declare namespace TrackSelection {
  export interface Api {
    selectTrack(trackId: string): void;
    unselectTrack(trackId: string): void;
    toggleTrackSelection(trackId: string): void;
    isTrackSelected(trackId: string): boolean;
  }

  export interface TrackInstance {
    isSelected: boolean;
    select(): void;
    unselect(): void;
    toggleSelection(): void;
  }

  export interface Options {
    defaultSelectedTracks?: string[];
  }

  export interface State {
    selectedTracks: Set<string>;
  }

  export interface Events {
    "track:selected": { trackId: string };
    "track:unselected": { trackId: string };
  }
}

export const TrackSelectionFeature: TimelineFeature<
  TrackSelection.Api,
  TrackSelection.Options,
  TrackSelection.State,
  TrackSelection.TrackInstance
> = {
  getInitialState(options) {
    return {
      selectedTracks: new Set(options.defaultSelectedTracks ?? []),
    };
  },
  createTimeline: (api) => {
    const isTrackSelected = (trackId: string) => {
      const { selectedTracks } = api.getState();
      return selectedTracks.has(trackId);
    };

    const selectTrack = (trackId: string) => {
      api.setState((draft) => {
        draft.selectedTracks.clear();
        draft.selectedTracks.add(trackId);
      });
      api.eventEmitter.emit("track:selected", { trackId });
    };

    const unselectTrack = (trackId: string) => {
      api.setState((draft) => {
        draft.selectedTracks.delete(trackId);
      });
      api.eventEmitter.emit("track:unselected", { trackId });
    };

    const toggleTrackSelection = (trackId: string) => {
      if (isTrackSelected(trackId)) {
        api.setState((draft) => {
          draft.selectedTracks.delete(trackId);
          api.eventEmitter.emit("track:selected", { trackId });
        });
      } else {
        api.setState((draft) => {
          draft.selectedTracks.add(trackId);
        });
        api.eventEmitter.emit("track:unselected", { trackId });
      }
    };

    return {
      selectTrack,
      unselectTrack,
      isTrackSelected,
      toggleTrackSelection,
    };
  },
  createTrack(api, { id }) {
    return {
      isSelected: api.isTrackSelected(id),
      select: () => api.selectTrack(id),
      unselect: () => api.unselectTrack(id),
      toggleSelection: () => api.toggleTrackSelection(id),
    };
  },
  trackRecomputeDependencies(api, item) {
    return [api.isTrackSelected(item.id)];
  },
};
