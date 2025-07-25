import React, { memo } from "react";

import { ItemInstance } from "../../core/types.ts";

export type ItemProps = React.PropsWithChildren<{
  item: ItemInstance;
}> &
  React.ComponentProps<"div">;

export const Item = memo(function Item({
  children,
  item,
  style,
  onClick,
  ...rest
}: ItemProps) {
  const itemStyle: React.CSSProperties = React.useMemo(() => {
    return {
      position: "absolute",
      left: item.leftOffset,
      width: item.width,
      ...style,
    };
  }, [item.leftOffset, item.width, style]);

  return (
    <div
      style={itemStyle}
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
      {...rest}
      {...item.attributes}
    >
      {children}
    </div>
  );
});
