import React from "react";
import { clsx } from "clsx";

import { ItemInstance } from "../../core/types.ts";

import { Positioned } from "./Positioned.tsx";

import styles from "./Item.module.css";

export type ItemProps = React.PropsWithChildren<{
  item: ItemInstance;
}> &
  React.ComponentProps<"div">;

export const Item = React.memo(function Item({
  children,
  item,
  className,
  onClick,
  ...rest
}: ItemProps) {
  return (
    <Positioned
      timeIn={item.start}
      duration={item.duration}
      className={clsx(styles.item, className)}
      onClick={React.useCallback(
        (event: React.MouseEvent<HTMLDivElement>) => {
          if (event.ctrlKey) {
            item.toggleSelection();
          } else {
            item.select();
          }
          onClick?.(event);
        },
        [item, onClick],
      )}
      data-item-id={item.id}
      {...item.attributes}
      {...rest}
    >
      {children}
    </Positioned>
  );
});
