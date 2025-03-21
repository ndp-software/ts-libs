import {Grip} from "./grip";
import {manualGrip} from "./manualGrip";

export function guardedGrip<T>(srcGrip: Grip<T>, guardFn: () => boolean, guarded: Grip<T>) {
  const grip = manualGrip(
    () => guardFn() ? guarded.value : srcGrip.value,
    (newValue) => {
      if (guardFn()) {
        srcGrip.set(newValue)
        return guarded.set(newValue)
      }
      return srcGrip.set(newValue)
    }
  )
  return grip
}