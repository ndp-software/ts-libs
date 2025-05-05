/*
The ValueGrip class extends Grip and provides an in-memory implementation of a grip.
It's a lot like a plain old variable, with a few more features (observability, readonly).
Be careful of passing by value semantics.
 */
import {Grip} from "./grip";

export class ValueGrip<T> extends Grip<T> {

  private _val: T

  constructor(initialValue: T) {
    super()
    this._val = initialValue
  }

  set(newValue: T) {
    this._val = newValue
    return newValue
  }

  get value() {
    return this._val
  }

  toString() {
    return `ValueGrip(${this._val})`
  }

}

/**
 * The `valueGrip` function creates a grip on a mutable variable, and is
 * given initial value.
 *
 * @param initialValue - The initial value to be stored in the grip.
 * @returns A new instance of `Grip` with the provided initial value.
 */
export function valueGrip<T>(initialValue: T): Grip<T> {
  return new ValueGrip(initialValue);
}