import React from "react";
import { clsx } from "clsx";

import styles from "./ResizeHandle.module.css";

export const ResizeHandle = React.memo(function ResizeHandle() {
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
