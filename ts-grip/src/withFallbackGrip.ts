import {Grip} from "./grip";

/**
 * Combines two grips, using the value from the primaryGrip grip if defined,
 * otherwise falling back to the value from the fallbackGrip grip.
 *
 * @param {G1} primaryGrip - The primary grip to use.
 * @param {G2} fallbackGrip - The fallbackGrip grip to use if the primaryGrip grip's value is undefined.
 * @param {(value: T1) => boolean} [useFallback] - A function that determines whether to use the fallback grip.
 *            Defaults to a function that returns true if the value is undefined.
 * @returns {Grip<T1Req | T2>} A new grip that combines the primaryGrip and fallbackGrip grips.
 */
export function withFallbackGrip<
  T1 extends T2, T2,
  G1 extends Grip<T1>, G2 extends Grip<T2>, T1Req = ExcludeUndefined<T1>
>(primaryGrip: G1,
  fallbackGrip: G2,
  useFallback: (value: T1) => boolean = (v) => (typeof v === 'undefined')): Grip<T1Req | T2> {
  return Object.create(primaryGrip, {
    value: {
      get() {
        const primaryValue = primaryGrip.value;
        return useFallback(primaryValue)
          ? fallbackGrip.value
          : primaryValue as T1Req | T2;
      }
    },
    set: {
      value(newValue: T1Req | T2) {
        fallbackGrip.set(newValue as T2);
        return primaryGrip.set(newValue as T1);
      }
    }
  });
}

type ExcludeUndefined<T> = T extends undefined ? never : T;