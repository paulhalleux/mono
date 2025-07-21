import { castDraft } from "immer";

import { TimelineFeature } from "../types";

export declare namespace Core {
  export interface Api {
    mount(HTMLElement: HTMLElement): void;
    unmount(): void;
  }

  export interface Options {}

  export interface State {
    element?: HTMLElement;
  }
}

export const CoreTimelineFeature: TimelineFeature<
  Core.Api,
  Core.Options,
  Core.State
> = {
  initialState: {},
  createTimeline: (api) => {
    return {
      mount: (element: HTMLElement) => {
        api.setState((draft) => {
          draft.element = castDraft(element);
        });
      },
      unmount: () => {
        api.setState((draft) => {
          draft.element = undefined;
        });
      },
    };
  },
};
