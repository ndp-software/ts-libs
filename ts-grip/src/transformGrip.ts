import {Grip} from "./grip";

/**
 * Transforms a grip by applying the provided casting functions.
 *
 * @template A - The type of the original grip's value.
 * @template B - The type of the transformed grip's value.
 * @param {L} grip - The original grip to be transformed.
 * @param {Object} casts - An object containing the casting functions.
 * @param {Function} casts.in - The function to cast from type B to type A.
 * @param {Function} casts.out - The function to cast from type A to type B.
 * @returns A new grip with the transformed value type.
 */
export function transformGrip<A, B, L extends Grip<A>>(
  grip: L,
  casts: { in: (b: B) => A; out: (a: A) => B }
): OmitGripMethods<L> & Grip<B> {
  return Object.create(grip, {
    value: {
      get() {
        return casts.out(grip.value);
      }
    },
    set: {
      value(newValue: B) {
        return grip.set(casts.in(newValue));
      }
    }
  });
}

type OmitGripMethods<T> = Omit<T, 'value' | 'set'>;