import { ActionMetadata, Updater } from "./types.ts";

/**
 * Attaches metadata to an updater function.
 * This is useful for tracking additional information about the action being performed.
 *
 * @param updater - The updater function to which metadata will be attached.
 * @param metadata - The metadata to attach to the updater.
 * @returns A new updater function with the attached metadata.
 */
export const attachMetadata = <TState>(
  updater: Updater<TState>,
  metadata: ActionMetadata,
): Updater<TState> => {
  return Object.assign(updater, { metadata });
};
