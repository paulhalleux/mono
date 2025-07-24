/**
 * Computes the speed multiplier based on the mouse position relative to the element's top and bottom edges.
 * @param element
 * @param mouseY
 * @param mouseX
 */
export const computeSpeedMultiplier = (
  element: HTMLElement,
  mouseY: number,
  mouseX: number,
): number => {
  const { top, bottom, left, right } = element.getBoundingClientRect();
  const distances = [
    mouseY - top,
    bottom - mouseY,
    mouseX - left,
    right - mouseX,
  ];
  const minDistance = Math.min(...distances);
  return minDistance < 50 ? Math.max(1, (50 - minDistance) / 50) : 1;
};
