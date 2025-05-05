import {localStorageStringGrip} from "./localStorageString";
import {transformGrip} from "./transformGrip";

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