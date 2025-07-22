import React, { useMemo } from "react";
import { clsx } from "clsx";

import { useTimelineStore } from "../adapter.ts";

import styles from "./Ruler.module.css";

export type RulerProps = React.PropsWithChildren & React.ComponentProps<"div">;

export function Ruler({ children, style, className, ...rest }: RulerProps) {
  const rulerHeight = useTimelineStore((_, api) => api.options.rulerHeight);
  return (
    <div
      style={useMemo(
        () => ({ height: rulerHeight, ...style }),
        [rulerHeight, style],
      )}
      className={clsx(styles["ruler-container"], className)}
      {...rest}
    >
      {children}
    </div>
  );
}
