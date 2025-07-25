const DATA_TRANSFER_TYPE = "tl/data";

export type TimelineDragData = {
  itemType: string;
  data?: Record<string, any>;
};

export const createDragDataTransfer = (
  dataTransfer: DataTransfer,
  dragData: TimelineDragData,
) => {
  dataTransfer.setData(DATA_TRANSFER_TYPE, JSON.stringify(dragData));
  dataTransfer.setDragImage(new Image(), 0, 0);
};

export const getDragDataTransfer = (
  dataTransfer: DataTransfer,
): TimelineDragData | null => {
  const data = dataTransfer.getData(DATA_TRANSFER_TYPE);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error("Failed to parse drag data transfer", e);
    return null;
  }
};

export const isValidDataTransfer = (dataTransfer: DataTransfer): boolean => {
  return dataTransfer.types.includes(DATA_TRANSFER_TYPE);
};
