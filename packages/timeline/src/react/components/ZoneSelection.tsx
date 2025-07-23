import React, { memo, useMemo } from "react";
import { clsx } from "clsx";

import { TimelineState } from "../../core/types.ts";
import { useTimelineStore } from "../adapter.ts";

import styles from "./ZoneSelection.module.css";

export type ZoneSelectionProps = React.ComponentProps<"div">;

const zoneSelectionSelector = (state: TimelineState) => state.zoneSelection;

export const ZoneSelection = memo(function ZoneSelection({
  children,
  style,
  className,
  ...rest
}: ZoneSelectionProps) {
  const zoneSelection = useTimelineStore(zoneSelectionSelector);

  const zoneStyle = useMemo(
    () => ({
      ...zoneSelection.drawRect,
      ...style,
    }),
    [style, zoneSelection.drawRect],
  );

  if (
    !zoneSelection.active ||
    !zoneSelection.drawRect ||
    zoneSelection.drawRect.width < 2 ||
    zoneSelection.drawRect.height < 2
  ) {
    return null;
  }

  return (
    <div className={clsx(styles.zone, className)} style={zoneStyle} {...rest}>
      {children}
    </div>
  );
});
