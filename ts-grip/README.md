# ts-grip

`ts-grip` is a TypeScript library that provides utility functions and classes for managing and manipulating values with grips.

A grip is a utility object that provides a unified interface for managing and manipulating values. This library is inspired by the "lens" pattern. Whereas a lens is code that gives you access to a specific path, a grip is "bound" to the source of a specific value.  

Here's a simple example, managing a cookie:
```typescript
cookie = cookieGrip('testCookie', 'default')
console.log(cookie.value) // Outputs: 'default'
// ...
cookie.set('newValue') // saves the cookie
// ...
console.log(cookie.value) // Outputs: 'newValue'
```

It can be
- a primitive value, with path-by-reference semantics
- a simple abstraction away of where a value is stored, such as
  - a cookie, local storage, or some other storage
  - a remote value, that must be fetched or updated through an API

It's also easy to glom on features:
- grips provide a place to make "observable" variables 
- grips can be "read-only" or "write-only"
- manage state with fallback values
- transform values, such as JSON.stringify or parseInt

## Installation

It uses standard npmjs installation:

```sh
npm install ts-grip
```

## Basic Usage

### `valueGrip`

The `valueGrip` function creates a grip on a mutable variable, and is given an initial value. It's just like a variable, except it will be passed by reference, since it's an object.

```typescript
import { valueGrip } from 'ts-grip';

const grip = valueGrip(10);
console.log(grip.value); // Outputs: 10
grip.set(20);
console.log(grip.value); // Outputs: 20
```
That's somewhat boring, although pass-by-value is nice at times.
Sometimes you want to pass a value in to a function, and let the 
function modify it, not necessarily understanding where it came from.

Additionally, you can have additional features, like marking readOnly:
```typescript
const grip = valueGrip(10).readOnly
```

Or receive mutation notifications:

```typescript
import { valueGrip } from 'ts-grip'
const grip = valueGrip(10).observable
grip.addObserver((next, prev) => {
  console.log(`Value changed from ${prev} to ${next}`)
})
grip.set(20) // Outputs: Value changed from 10 to 20
```

### `manualGrip`

Creates a manual grip with custom getter and setter functions. Build your own!

```typescript
import { manualGrip } from 'ts-grip';

const grip = manualGrip(
  () => 10,
  (newValue) => newValue
);
```

### `objectPropGrip`

Creates a grip on a property of an object. This is,
in fact, a simple `Lens`.

```typescript
import { objectPropGrip } from 'ts-grip';

const lens = objectPropGrip('prop')
const obj = { prop: 10 };
const grip = objectPropGrip('prop')(obj);
```

### `propGrip`

Creates a grip on a property of a grip.

```typescript
import { propGrip, valueGrip } from 'ts-grip';

const grip = valueGrip({ prop: 10 });
const propGripInstance = propGrip(grip, 'prop');
```

### `observeableGrip`

Creates an observable version of the grip, with a new function `addObserver`.

```typescript
import { observeableGrip, valueGrip } from 'ts-grip';

const grip = valueGrip(10);
const observableGrip = observeableGrip(grip);
observableGrip.addObserver((next, prev) => {
  console.log(`Value changed from ${prev} to ${next}`);
});
```

This is more concisely available as primitive operation on all Grips:

```typescript
const grip = valueGrip(10).observable
grip.addObserver((next, prev) => {})
```

### `readOnlyGrip`

Creates a read-only version of the grip.

```typescript
import { readOnlyGrip, valueGrip } from 'ts-grip';

const grip = valueGrip(10);
const readOnly = readOnlyGrip(grip);
```

As a convenience, this is generally available:

```typescript
const grip = valueGrip.readOnly
//...
```


### `cachingGrip`

The `cachingGrip` function creates a grip that caches the value of the subject grip. The cache is marked as stale whenever the value is set. The grip also has an `expire` method that can be called to mark the data as invalid.

```typescript
import { cachingGrip, valueGrip } from 'ts-grip';

const originalGrip = valueGrip(10);

const cachedGrip = cachingGrip(originalGrip);

console.log(cachedGrip.value); // Outputs: 10

cachedGrip.set(20);
console.log(cachedGrip.value); // Outputs: 20

// ANTI-PATTERN
// Set a new value directly on the original grip
// ... this might happen by some external mechanism
originalGrip.set(30);
// ... which will still be the old cached value
console.log(cachedGrip.value); // Outputs: 20

// Expire the cache again to get the updated value from the original grip
cachedGrip.expire();
console.log(cachedGrip.value); // Outputs: 30
```



## Accessors

### `cookieGrip`

Creates a grip on a browser cookie with a default value. 

```typescript
import { cookieGrip } from 'ts-grip';

const cookie = cookieGrip('testCookie', 'default');
console.log(cookie.value); // Outputs: 'default'
cookie.set('newValue');
console.log(cookie.value); // Outputs: 'newValue'
```
The default settings for the cookie are `;path=/;SameSite=Strict`.
To change this, pass a third parameter.


### `localStorageStringGrip`

Exposes access and mutation of a string value in local storage.

```typescript
import { localStorageStringGrip } from 'ts-grip';

const grip = localStorageStringGrip('key', 'default');
console.log(grip.value); // Outputs: 'default'

grip.set('newValue');

console.log(grip.value); // Outputs: 'newValue'
window.localStorage.getItem('key') // 'newValue'
```

### `localStorageJSONGrip`

Exposes access and mutation of (JSON-)serializable value in local storage.

```typescript
import { localStorageJSONGrip } from 'ts-grip';

const grip = localStorageJSONGrip('user', { name: 'John', age: 30 });
console.log(grip.value); // Outputs: { name: 'John', age: 30 }

grip.set({ name: 'Jane', age: 25 });
console.log(grip.value); // Outputs: { name: 'Jane', age: 25 }
```



## Mutators

### `transformGrip`

Transforms a grip by applying the provided functions. This
can be used for casting, coercion, serialization, among many uses.

```typescript
import { transformGrip, valueGrip } from 'ts-grip';

const grip = valueGrip(42);
const transformedGrip = transformGrip(grip, {
  in: (str: string) => parseInt(str, 10),
  out: (num: number) => num.toString(),
});

console.log(transformedGrip.value); // Outputs: "42"
transformedGrip.set("100");
console.log(grip.value); // Outputs: 100
```

### `asAsync`

The `asAsync` function converts a synchronous grip into an asynchronous grip. This is useful when you need to work with grips that involve promises or asynchronous operations while maintaining compatibility with existing synchronous grips. The returned grip ensures that the value is always a Promise, and it updates the original grip when the promise resolves.

```typescript
import { valueGrip, asAsync } from 'ts-grip';

const grip = valueGrip(42);
const asyncGrip = asAsync(grip);

(async () => {
  console.log(await asyncGrip.value); // Outputs: 42

  asyncGrip.set(Promise.resolve(43));
  console.log(await asyncGrip.value); // Outputs: 43
  console.log(grip.value); // Outputs: 43
})();
```


## Aggregators
### `guardedGrip`

Creates a grip that is guarded by a function. If the
guard returns false, the second grip is ignored, and
if it's true, the guarded grip is used. It's basically
a switch, or if/else grip.

```typescript
import { guardedGrip, valueGrip } from 'ts-grip';

const srcGrip = valueGrip(10);
const guardedTrue = guardedGrip(srcGrip, () => true, valueGrip(20));
console.log(guardedTrue.value); // Outputs: 20
guardedTrue.set(30);
console.log(srcGrip.value); // Outputs: 30
console.log(guardedTrue.value); // Outputs: 30
```

```typescript
const valueGrp = valueGrip(20)
const guardedFalse = guardedGrip(srcGrip, () => false, valueGrp);
console.log(guardedFalse.value); // Outputs: 10
guardedFalse.set(40);
console.log(guardedGrip.value); // Outputs: 40
console.log(srcGrip.value); // Outputs: 40
console.log(valueGrp.value); // Outputs: 20 -- not touched
```

### `withFallbackGrip`

Combines two grips. Use a fallback grip when the primary grip has the 
value `undefined`. Optionally, pass a function that returns `boolean` 
value, where `true` means to use the fallback value.

```typescript
import { withFallbackGrip, valueGrip } from 'ts-grip';

const primaryGrip = valueGrip<number | undefined>(undefined);
const fallbackGrip = valueGrip(100);

const combinedGrip = withFallbackGrip(primaryGrip, fallbackGrip);

console.log(combinedGrip.value); // Outputs: 100
primaryGrip.set(50);
console.log(combinedGrip.value); // Outputs: 50
```


## License

This project is licensed under the MIT License.


## TODOs

- [ ] is an observable grip also observable. discuss.
- [ ] combine guarded and fallback grips
- [ ] document async behaviors
- [ ] sessionStorage
- [ ] demo of a cookie/localStorage grip
- [ ] caching grip has some sort of built-in expiration mechanism
