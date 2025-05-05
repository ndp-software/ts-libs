import {Grip} from "./grip";
import {manualGrip} from "./manualGrip";
import {isFunction, isGrip, isPromise} from "./util";


function isSyncGuard(obj: any): obj is SyncGuard {
  return (isGrip(obj) && typeof obj.value === 'boolean')
    || (isFunction(obj) && !isPromise(obj()))
}

export function guardedGrip<T extends unknown,
  GT extends Grip<unknown> = (Grip<T> | Grip<Promise<T>>)>(
  srcGrip: GT,
  guard: AsyncGuard | SyncGuard,
  guarded: GT
) {
  if (isSyncGuard(guard)
    && !isPromise(srcGrip.value)
    && !isPromise(guarded.value))
    return guardedGripSync(srcGrip, guard, guarded)
  else
    return guardedGripAsync(srcGrip, guard, guarded)
}

export type SyncGuard = (() => boolean) | Grip<boolean>

// Synchronous version
export function guardedGripSync<T>(
  srcGrip: Grip<T>,
  guard: SyncGuard,
  guarded: Grip<T>
) {
  const resolveGuard =
    () => typeof guard === 'function' ? guard() : guard.value;


  return manualGrip(
    () => (resolveGuard() ? guarded.value : srcGrip.value),
    (newValue) => {
      if (resolveGuard()) {
        srcGrip.set(newValue);
        return guarded.set(newValue);
      }
      return srcGrip.set(newValue);
    }
  );
}

export type AsyncGuard = (() => boolean | Promise<boolean>) | Grip<boolean | Promise<boolean>>

// Asynchronous version
export function guardedGripAsync<T>(
  srcGrip: Grip<T|Promise<T>>,
  guard: AsyncGuard,
  guarded: Grip<T|Promise<T>>
) {
  const resolveGuard =
    () => typeof guard === 'function' ? guard() : guard.value;

  return manualGrip(
    async () => {
      const isGuarded = resolveGuard();
      return (await isGuarded ? guarded.value : srcGrip.value);
    },
    async (newValue) => {
      const isGuarded = await resolveGuard();
      if (isGuarded) {
        await srcGrip.set(newValue);
        return guarded.set(newValue);
      }
      return srcGrip.set(newValue);
    }
  );
}

