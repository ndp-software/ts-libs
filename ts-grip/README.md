# ts-grip

`ts-grip` is a TypeScript library that provides various utility functions and classes for managing and manipulating values with grips.

A grip is a utility object that provides a flexible and consistent interface for managing and manipulating values. Grips can be used to create observable variables, manage state with fallback values, handle cookies, interact with local storage, and more. They offer a unified approach to accessing and setting values, making it easier to implement complex state management and data handling patterns in TypeScript applications.

## Installation

To install the package, use npm:

```sh
npm install ts-grip
```

## Usage

### `valueGrip`

The `valueGrip` function creates a grip on a mutable variable, and is given an initial value.

```typescript
import { valueGrip } from 'ts-grip';

const grip = valueGrip(10);
console.log(grip.value); // Outputs: 10
grip.set(20);
console.log(grip.value); // Outputs: 20
```

### `cookieGrip`

Creates a grip on a browser cookie with a default value. The 
settings for the cookie are `;path=/;SameSite=Strict`

```typescript
import { cookieGrip } from 'ts-grip';

const cookie = cookieGrip('testCookie', 'default');
console.log(cookie.value); // Outputs: 'default'
cookie.set('newValue');
console.log(cookie.value); // Outputs: 'newValue'
```

### `transformGrip`

Transforms a grip by applying the provided functions. This
can be used for casting, coercion, serialization, among many uses.

```typescript
import { transformGrip, valueGrip } from 'ts-grip';

const grip = valueGrip(10);
const transformedGrip = transformGrip(grip, {
  in: (str: string) => parseInt(str, 10),
  out: (num: number) => num.toString()
});
console.log(grip.value) // Outputs: "10"
```

### `withFallbackGrip`

Combines two grips, using the value from the target grip if defined, 
otherwise falling back to the value from the fallback grip.

```typescript
import { withFallbackGrip, valueGrip } from 'ts-grip';

const targetGrip = valueGrip<number | undefined>(undefined);
const fallbackGrip = valueGrip(10);
const combinedGrip = withFallbackGrip(targetGrip, fallbackGrip);
```

### `manualGrip`

Creates a manual grip with custom getter and setter functions.

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

As a convenience, this is generally available on grips:

```typescript
const grip = valueGrip.readOnly
//...
```


### `cachingGrip`

The `cachingGrip` function creates a grip that caches the value of the subject grip. The cache is marked as stale whenever the value is set. The grip also has an `expire` method that can be called to mark the data as invalid.

```typescript
import { cachingGrip, valueGrip } from 'ts-grip';

// Create a value grip with an initial value
const originalGrip = valueGrip(10);

// Create a caching grip based on the original grip
const cachedGrip = cachingGrip(originalGrip);

// Access the value from the cached grip
console.log(cachedGrip.value); // Outputs: 10

// Set a new value using the cached grip
cachedGrip.set(20);
console.log(cachedGrip.value); // Outputs: 20

// Set a new value directly on the original grip
// ... this might happen by some external mechanism
originalGrip.set(30);
// ... which will still be the old cached value
console.log(cachedGrip.value); // Outputs: 20

// Expire the cache again to get the updated value from the original grip
cachedGrip.expire();
console.log(cachedGrip.value); // Outputs: 30
```



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

const grip = localStorageJSONGrip('key', { default: 'value' });
```

## License

This project is licensed under the MIT License.


## TODOs

- [ ] is an observable grip also observable. discuss.