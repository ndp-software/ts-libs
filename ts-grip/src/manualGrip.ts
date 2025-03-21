import {Grip} from "./grip";

/**
 * Creates a manual grip with custom getter and setter functions.
 *
 * @param context - Optional context to be passed to the getter and setter functions.
 * @returns A new instance of a `Grip`.
 */
// Sync
export function manualGrip<T>(getter: () => T, setter: (value: T) => T): Grip<T>;
// Asyncs
export function manualGrip<T>(getter: () => Promise<T>, setter: (value: Promise<T>) => Promise<T>): Grip<T>;
// Same, with "context"
export function manualGrip<T>(
  getter: () => T,
  setter: (value: T) => T,
): Grip<T> {
  return new ManualGrip<T>(getter, setter);
}

type Getter<T,C> = C extends undefined ? () => T : (context: C) => T

export class ManualGrip<T> extends Grip<T> {
  constructor(
    private readonly getter: () => T,
    private readonly setter: (value: T) => T
  ) {
    super();
  }

  get value(): T {
    return this.getter();
  }

  set(newValue: T): T {
    return this.setter(newValue);
  }
}