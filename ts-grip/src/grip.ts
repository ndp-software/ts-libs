
/*
The Grip class is an abstract class that represents a grip,
which is used to access and modify some data. It's a limited
"facade", with just `get` and `set` capabilities, similar to
a Lens.

It's inspired from the Lens design pattern. The "lens" design pattern is used to abstract away the process of
accessing and modifying nested data structures in a functional
and immutable way. It provides a way to focus on a specific
part of a data structure, allowing you to view and update
that part without directly manipulating the entire structure.

This "Grip" differs mainly in that it's more of a wrapper
around a specific "thing", and abstracting away the
access to its contents, rather than being a "lens", or
"view into" some type of thing.

You likely will not use the Grip class itself, but rather the
few constructor functions: inMemoryGrid, cookieGrip, manualGrid,
etc.

There are a couple modifiers, `readOnly` and `observable`.
These  are currently contained within the class, but may be
removed at some later point (@see the evolution of RxJS).

@see [traditional lens](https://github.com/hatashiro/lens.ts)
@see [traditional lens](https://github.com/atomicobject/lenses)

Methods:
get value(): T: Abstract getter method to retrieve the value.
set(newValue: T): void: Abstract setter method to set a new value.
get readOnly(): Returns a read-only version of the grip.
get observable(): Returns an observable version of the grip.
*/
export abstract class Grip<T> {
  abstract get value(): T;

  abstract set(newValue: T): T;

  /**
   * Returns a new grip whose `set` method does nothing.
   */
  get readOnly(): Grip<T> {
    return readOnlyGrip(this)
  }

  /**
   * Returns an observable version of the grip, with a new
   * function `addObserver`.
   *
   * `addObserver` accepts two parameters:
   *  - a function that is called whenever the `set` function
   *    is called on the grip.
   *  - `options`, with values:
   *    - `observeInitialValue` - whether to call the observer
   *      when it initially added. Defaults to `false`.
   */
  get observable() {
    return observeableGrip(this)
  }
}

export function observeableGrip<T, L extends Grip<T>>(grip: L):
  L & { addObserver: (handler: Observer<T>, options?: ObserverOptions) => () => void } {
  const observers: Array<Observer<T>> = [];

  return Object.create(grip, {
    set: {
      value: (newValue: T) => {
        const oldValue = grip.value;
        grip.set(newValue);
        observers.forEach(observer => observer(newValue, oldValue));
        return newValue
      }
    },
    addObserver: {
      value: (handler: Observer<T>, {observeInitialValue}: ObserverOptions = {observeInitialValue: false}): () => void => {
        observers.push(handler);
        if (observeInitialValue) setTimeout(() => handler(grip.value, undefined), 0);
        return () => {
          const index = observers.indexOf(handler);
          if (index > -1) {
            observers.splice(index, 1);
          }
        };
      }
    }
  });
}


interface ObservableGrip<T> extends Grip<T> {
  addObserver: (handler: (next: T, prev: T | undefined) => void, options?: { observeInitialValue: boolean }) => () => void;
}

export function isObservableGrip<T>(grip: Grip<T>): grip is ObservableGrip<T> {
  return (grip as ObservableGrip<T>).addObserver !== undefined;
}

export function readOnlyGrip<T, L extends Grip<T>>(grip: L): L {
  return Object.create(grip, {
    set: {
      value: (value: T) => {
        // Do nothing to prevent modification
        return value
      }
    }
  });
}

type Observer<T> = (next: T, prev: T | undefined) => void;
type ObserverOptions = { observeInitialValue: boolean };