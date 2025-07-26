import { memo } from "react";
import { clsx } from "clsx";

import styles from "./ResizeHandle.module.css";

export const ResizeHandle = memo(() => {
  return (
    <>
      <div
        data-resize="left"
        draggable="true"
        className={clsx(styles["resize-handle"], styles.left)}
      />
      <div
        data-resize="right"
        draggable="true"
        className={clsx(styles["resize-handle"], styles.right)}
      />
    </>
  );
});
