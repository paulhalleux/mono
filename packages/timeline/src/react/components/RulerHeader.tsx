import React, { useMemo } from "react";
import { clsx } from "clsx";

import { TimelineApi } from "../../core/types.ts";
import { useTimelineStore } from "../adapter.ts";

import styles from "./RulerHeader.module.css";

export type RulerHeaderProps = React.PropsWithChildren &
  React.ComponentProps<"div">;

const trackHeaderWidthSelector = (_: any, api: TimelineApi) =>
  api.options.trackHeaderWidth;

export const RulerHeader = React.memo(function RulerHeader({
  children,
  style,
  className,
  ...rest
}: RulerHeaderProps) {
  const trackHeaderWidth = useTimelineStore(trackHeaderWidthSelector);

  return (
    <div
      style={useMemo(
        () => ({ width: trackHeaderWidth, ...style }),
        [trackHeaderWidth, style],
      )}
      className={clsx(styles["ruler-header"], className)}
      {...rest}
    >
      <div>
        <div></div>
      </div>
      {children}
    </div>
  );
});
