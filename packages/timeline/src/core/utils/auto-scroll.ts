/**
 * Computes the speed multiplier based on the mouse position relative to the element's top and bottom edges.
 * @param element
 * @param mouseY
 */
export const computeSpeedMultiplier = (
  element: HTMLElement,
  mouseY: number,
): number => {
  const rect = element.getBoundingClientRect();
  const distanceFromTop = mouseY - rect.top;
  const distanceFromBottom = rect.bottom - mouseY;

  if (distanceFromTop < 50) {
    return Math.max(1, (50 - distanceFromTop) / 50);
  } else if (distanceFromBottom < 50) {
    return Math.max(1, (50 - distanceFromBottom) / 50);
  }

  return 1;
};
