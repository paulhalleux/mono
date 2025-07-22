import React, { useMemo } from "react";
import { clsx } from "clsx";

import { useTimelineStore } from "../adapter.ts";

import styles from "./RulerHeader.module.css";

export type RulerHeaderProps = React.PropsWithChildren &
  React.ComponentProps<"div">;

export function RulerHeader({
  children,
  style,
  className,
  ...rest
}: RulerHeaderProps) {
  const trackHeaderWidth = useTimelineStore(
    (_, api) => api.options.trackHeaderWidth,
  );

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
}
