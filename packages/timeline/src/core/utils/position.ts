import { TimelineApi, TimelinePosition, XYPosition } from "../types.ts";

export const getTimelinePosition = (
  api: TimelineApi,
  client: XYPosition,
  element: HTMLElement,
): TimelinePosition => {
  const rect = element.getBoundingClientRect();
  const x = client.x - rect.left - (api.options.trackHeaderWidth ?? 0);
  const y =
    client.y - rect.top - (api.options.rulerHeight ?? 0) + element.scrollTop;

  return {
    x,
    y,
    time: Math.floor(api._internal.screenToTime(x)),
  };
};
