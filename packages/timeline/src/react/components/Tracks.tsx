import React, { memo } from "react";
import { clsx } from "clsx";

import styles from "./Tracks.module.css";

export type TracksProps = React.PropsWithChildren & React.ComponentProps<"div">;

export const Tracks = memo(function Tracks({
  children,
  className,
  ...rest
}: TracksProps) {
  return (
    <div className={clsx(styles.tracks, className)} {...rest}>
      {children}
    </div>
  );
});
