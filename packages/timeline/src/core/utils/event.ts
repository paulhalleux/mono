const undefinedState = {
  itemId: undefined,
  trackId: undefined,
};

export const extractItemAndTrackId = (event: Event) => {
  const { target: element } = event;
  if (!(element instanceof HTMLElement)) {
    return undefinedState;
  }

  const itemElement = element.closest("[data-item-id]");
  const trackElement = element.closest("[data-track-id]");

  if (
    !itemElement ||
    !trackElement ||
    !(itemElement instanceof HTMLElement) ||
    !(trackElement instanceof HTMLElement)
  ) {
    return undefinedState;
  }

  const itemId = itemElement.dataset.itemId;
  const trackId = trackElement.dataset.trackId;

  if (!itemId || !trackId) {
    return undefinedState;
  }

  return { itemId, trackId };
};
