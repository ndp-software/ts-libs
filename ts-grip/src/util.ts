/*
An `isPromise` detector that narrows the type of the promise return type,
when returning `true`.
 */
import {Grip} from "./grip";

export function isPromise<T = any>(obj: any):
  obj is T extends { then: (...args: unknown[]) => unknown } ? Promise<Awaited<T>> : never {
  return !!obj &&
    (typeof obj === 'object' || typeof obj === 'function') &&
    typeof obj.then === 'function';
}

export function isGrip<T>(value: unknown): value is Grip<T> {
  return value instanceof Grip<T>;
}

export function isFunction(obj: unknown): obj is Function {
  return typeof obj === 'function'
}