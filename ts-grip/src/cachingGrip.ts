import {Grip, isObservableGrip} from "./grip";
import {ManualGrip, manualGrip} from "./manualGrip";

/**
 * Creates a grip that caches the value of the subject grip.
 * The cache is marked as stale whenever the value is set.
 * The grip also has an `expire` method, that may be called
 * to mark the data as invalid.
 *
 * @param subject - The grip whose value is to be cached.
 * @returns A new grip with caching capabilities.
 */
export function cachingGrip<T>(subject: Grip<T>) {

  let cache: T // T may be anything, even Promise
  let stale: boolean = true
  const grip = manualGrip<T>(
    () => {
      if (stale) {
        cache = subject.value
        stale = false
      }
      return cache
    },
    (newValue) => {
      stale = true
      return subject.set(newValue)
    },
  ) as ManualGrip<T> & { expire: () => void }
  grip.expire = () => stale = true

  // Well, if the subject is observable, we can
  // automatically clear the cache. Otherwise, we
  // rely on the user correctly using the cachingGrip itself.
  if (isObservableGrip(subject))
    subject.addObserver(grip.expire)

  return grip
}
