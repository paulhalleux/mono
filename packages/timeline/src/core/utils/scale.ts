export function timeToWidth(
  time: number,
  viewportWidth: number,
  viewportDuration: number,
) {
  if (viewportDuration === 0) {
    return 0;
  }
  return (time / viewportDuration) * viewportWidth;
}

export function widthToTime(
  width: number,
  viewportWidth: number,
  viewportDuration: number,
) {
  if (viewportWidth === 0) {
    return 0;
  }
  return (width / viewportWidth) * viewportDuration;
}

export function timeToLeft(
  time: number,
  viewportWidth: number,
  viewportDuration: number,
) {
  if (viewportDuration === 0) {
    return 0;
  }
  const pxCountFor1ms = viewportWidth / viewportDuration;
  return time * pxCountFor1ms;
}
