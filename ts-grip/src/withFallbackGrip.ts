import {Grip} from "./grip";

/**
 * Combines two grips, using the value from the target grip if defined,
 * otherwise falling back to the value from the fallback grip.
 *
 * @param {L1} target - The primary grip to use.
 * @param {L2} fallback - The fallback grip to use if the target grip's value is undefined.
 * @returns {Grip<T1Req | T2>} A new grip that combines the target and fallback grips.
 */
export function withFallbackGrip<
  T1, T2,
  L1 extends Grip<T1>, L2 extends Grip<T2>, T1Req = ExcludeUndefined<T1>
>(target: L1, fallback: L2): Grip<T1Req | T2> {
  return Object.create(target, {
    value: {
      get() {
        const targetValue = target.value;
        return targetValue === undefined ? fallback.value : targetValue as T1Req | T2;
      }
    },
    set: {
      value(newValue: T1Req | T2) {
        fallback.set(newValue as T2);
        return target.set(newValue as T1);
      }
    }
  });
}

type ExcludeUndefined<T> = T extends undefined ? never : T;