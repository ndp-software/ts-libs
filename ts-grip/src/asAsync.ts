import {Grip} from "./grip";

export function asAsync<T>(grip: Grip<T>): Grip<Promise<T>> {
  let lastSetter: Promise<T> | null = null
  return Object.create(grip, {
    value: {
      get() {
        // avoid race where setter has called but next executed yet
        return lastSetter
          ? lastSetter.then(() => grip.value)
          : Promise.resolve(grip.value);
      },
    },
    set: {
      value: (value: Promise<T>) => {
        lastSetter = value.then(v => grip.set(v))
        return lastSetter
      },
    },
  })
}