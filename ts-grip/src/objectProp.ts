import {Grip} from "./grip";

/**
 * Creates a grip on a property of an object.
 *
 * @param prop - The property to create a grip on.
 * @returns A function that takes a target object and returns a
 * grip on the specified property.
 */
export function objectPropGrip<
  T,
  Target = T extends Grip<infer X> ? X : T,
  P extends keyof Target = keyof Target
>(prop: P): (target: Target) => Grip<Target[P]> {
  return (target: Target) => new ObjectPropGrip<Target, P>(prop, target);
}

/**
 * Creates a grip on a property of a grip.
 *
 * @param grip - The grip to create a property grip on.
 * @param property - The property to create a grip on.
 * @returns A new instance of `Grip` for the specified property.
 */
export function propGrip<
  L extends Grip<S>,
  P extends keyof S,
  S = L extends Grip<infer U> ? U : never,
  T = P extends keyof S ? S[P] : ElementType<S>
>(grip: L, property: P): Grip<T> {
  return Object.create(grip, {
    value: {
      get(): T {
        const subj = grip.value as any;
        return subj[property];
      }
    },
    set: {
      value(newValue: T) {
        const value = grip.value;

        if (Array.isArray(value)) {
          const newObject = [...value] as any;
          newObject[property] = newValue;
          grip.set(newObject);
        } else {
          const newObject = {...value, [property]: newValue};
          grip.set(newObject);
        }
        return newValue
      }
    }
  });
}

export class ObjectPropGrip<
  Target extends Record<P, V>,
  P extends keyof Target = keyof Target,
  V = Target[P]//Target extends Record<K, infer k> ? k : never
> extends Grip<V> {

  constructor(private readonly prop: P,
              private readonly target: Target) {
    super()
  }

  get value(): V {
    return this.target[this.prop]
  }

  set(val: V) {
    (this.target as { [k in P]: V })[this.prop] = val
    return val
  }
}

// Type utilities
type ObjectWithProperty<P extends PropertyKey, V> = {
  [K in P]: V;
};
type ElementType<T> = T extends (infer U)[] ? U : never;