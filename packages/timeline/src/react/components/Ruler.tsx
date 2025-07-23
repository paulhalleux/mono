import React, { useMemo } from "react";
import { clsx } from "clsx";

import { TimelineApi, TimelineState } from "../../core/types.ts";
import { useTimelineStore } from "../adapter.ts";

import styles from "./Ruler.module.css";

export type RulerProps = React.PropsWithChildren & React.ComponentProps<"div">;

const rulerHeightSelector = (_: TimelineState, api: TimelineApi) =>
  api.options.rulerHeight;

export function Ruler({ children, style, className, ...rest }: RulerProps) {
  const rulerHeight = useTimelineStore(rulerHeightSelector);
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
