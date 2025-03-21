import {transformGrip} from "./transformGrip";
import {manualGrip} from "./manualGrip";

/**
 * Exposes access and mutation of (JSON-)serializable value
 * in local storage.
 * @param key string used as key in local storage
 * @param defaultValue
 * @param localStorage implementation of localStorage API used
 * for unit tests only. Defaults to `window.localStorage`.
 */
export function localStorageStringGrip<T>(key: string,
                                          defaultValue: string,
                                          localStorage?: Storage) {
  if (!localStorage && typeof window != 'undefined')
    localStorage = window.localStorage
  return manualGrip<string>(
    () => {
      const val = localStorage!.getItem(key);
      return val === null ? defaultValue : val;
    },
    (value) => {
      localStorage!.setItem(key, value)
      return value
    }
  )
}

export function localStorageJSONGrip<T>(key: string,
                                        defaultValue: T,
                                        localStorage?: Storage) {
  if (!localStorage && typeof window != 'undefined')
    localStorage = window.localStorage

  const lsGrip = localStorageStringGrip(key, JSON.stringify(defaultValue), localStorage)

  return transformGrip(lsGrip, {
    in: (v: T) => JSON.stringify(v),
    out: (s: string) => JSON.parse(s) as T
  })
}