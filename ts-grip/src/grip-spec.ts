import assert from 'node:assert/strict'
import {describe, it as spec, mock, beforeEach } from 'node:test'

import {
  cachingGrip,
  cookieGrip,
  guardedGrip,
  localStorageStringGrip,
  localStorageJSONGrip,
  valueGrip,
  manualGrip,
  objectPropGrip,
  observeableGrip,
  propGrip,
  readOnlyGrip,
  transformGrip,
  withFallbackGrip
} from './grip'

describe('manualGrip', () => {
  spec('can apply arbitrary getters and setters', () => {
    let val = 7
    const grip = manualGrip(
      () => val,
      (v: number) => val = v
    )

    assert.equal(grip.value, 7)

    grip.set(8)

    assert.equal(grip.value, 8)
    assert.equal(val, 8)
  })

  spec('can provide a context object', () => {
    const grip = manualGrip(
      (context) => context.val,
      (v: number, context) => context.val = v,
      {val: 7}
    )
    assert.equal(grip.value, 7)

    grip.set(8)
    assert.equal(grip.value, 8)
  })


  spec('can apply async getters and setters', async () => {
    let val = 7
    const grip = manualGrip(
      () => Promise.resolve(val),
      (v: Promise<number>) => {
        return v.then(value => val = value)
      }
    )

    assert.equal(await grip.value, 7)

    await grip.set(Promise.resolve(8))

    assert.equal(await grip.value, 8)
    assert.equal(val, 8)
  })

  spec('can apply async getters and setters with context object', async () => {
    const grip = manualGrip(
      (context) => Promise.resolve(context.value),
      (v: Promise<number>, context) => {
        return v.then(value => context.value = value)
      },
      { value: 7 }
    )

    assert.equal(await grip.value, 7)

    await grip.set(Promise.resolve(8))

    assert.equal(await grip.value, 8)
  })

})


describe('cachingGrip', () => {

  spec('should cache the value after the first retrieval (sync)', () => {
    const grip = valueGrip(0);
    const caching = cachingGrip(grip);

    assert.equal(caching.value, 0);

    caching.set(2);
    assert.equal(caching.value, 2); // Should update and return new value
    assert.equal(grip.value, 2) // Should update target
  });

  spec('should cache the value after the first retrieval (async)', async () => {
    let value = 0;
    const grip = manualGrip(
      () => Promise.resolve(value),
      (v: Promise<number>) => {
        return v.then(val => value = val);
      }
    );
    const caching = cachingGrip(grip);

    assert.equal(await caching.value, 0);

    value = 1;
    assert.equal(await caching.value, 0); // Should still return cached value
    caching.expire()
    assert.equal(await caching.value, 1)

    await caching.set(Promise.resolve(2));
    assert.equal(await caching.value, 2); // Should update and return new value
    assert.equal(await grip.value, 2);
  });

  spec('should expire explicitly', () => {
    const grip = valueGrip(0);
    const caching = cachingGrip(grip);

    assert.equal(caching.value, 0);

    grip.set(1);
    assert.equal(caching.value, 0); // Should still return cached value

    caching.expire()
    assert.equal(caching.value, 1)
  })

});


describe('withFallbackGrip', () => {
  spec('uses a base value', () => {
    const b = valueGrip<string>('foo')
    const o = valueGrip('bar')
    const grip = withFallbackGrip(o, b)

    assert.equal(grip.value, 'bar')
  })
  spec('uses an override value', () => {
    const b = valueGrip<string>('foo')
    const o = valueGrip(undefined)
    const grip = withFallbackGrip(o, b)

    assert.equal(grip.value, 'foo')
  })
  spec('updates just the base', () => {
    const b = valueGrip<string>('foo')
    const o = valueGrip(undefined as unknown as string)
    const grip = withFallbackGrip(o.readOnly, b)

    grip.set('bar')

    assert.equal(b.value, 'bar')
    assert.equal(o.value, undefined)

    assert.equal(grip.value, 'bar')
  })
  spec('updates just the override', () => {
    const b = valueGrip<string>('foo')
    const o = valueGrip(undefined as unknown as string)
    const grip = withFallbackGrip(o, b.readOnly)

    grip.set('bar')

    assert.equal(grip.value, 'bar')
    assert.equal(b.value, 'foo')
    assert.equal(o.value, 'bar')
  })
  spec('updates both gripes', () => {
    const b = valueGrip<string>('foo')
    const o = valueGrip(undefined as unknown as string)
    const grip = withFallbackGrip(o, b)

    grip.set('bar')

    assert.equal(grip.value, 'bar')
    assert.equal(b.value, 'bar')
    assert.equal(o.value, 'bar')
  })
})


describe('inMemoryGrip', () => {
  spec('can store numbers', () => {
    assert.equal(valueGrip(1).value, 1)
    assert.equal(valueGrip(2).value, 2)
  })
  spec('can store objects', () => {
    assert.deepEqual(valueGrip({one: 1, two: [1, 2, 3], 3: 'tree'}).value, {one: 1, two: [1, 2, 3], 3: 'tree'})
  })
  spec('can change values', () => {
    const a = valueGrip('foo')
    assert.equal(a.value, 'foo')
    a.set('bar')
    assert.equal(a.value, 'bar')
    a.set('baz')
    assert.equal(a.value, 'baz')
  })
})

describe('observeableGrip', () => {
  spec('can observe a change', async () => {
    const myGrip = observeableGrip(valueGrip<string>('foo'))

    const onChangeSpy = mock.fn()

    myGrip.addObserver(onChangeSpy, {observeInitialValue: true})

    await new Promise(r => setTimeout(r, 5))

    assert.equal(onChangeSpy.mock.calls.length, 1)
    assert.equal(myGrip.value, 'foo')
  })

  spec('can observe initial value', () => {
    const myGrip = observeableGrip(valueGrip<string>('foo'))

    const onChangeSpy = mock.fn()

    myGrip.addObserver(onChangeSpy)
    myGrip.set('bar')

    assert.equal(onChangeSpy.mock.calls.length, 1)
    assert.equal(myGrip.value, 'bar')
  })
  spec('can remove an observer', () => {
    const myGrip = observeableGrip(valueGrip<string>('foo'))

    const onChangeSpy = mock.fn()

    const remover = myGrip.addObserver(onChangeSpy)
    remover()

    myGrip.set('bar')

    assert.equal(onChangeSpy.mock.calls.length, 0)
  })
  spec('can observe multiple changes', () => {
    const myGrip = observeableGrip(valueGrip<string>('foo'))

    const onChangeSpy = mock.fn()
    myGrip.addObserver(onChangeSpy)

    myGrip.set('bar')
    myGrip.set('baz')
    myGrip.set('buzz')

    assert.equal(onChangeSpy.mock.calls.length, 3)
  })
  spec('multiple observers', () => {
    const myGrip = observeableGrip(valueGrip<string>('foo'))

    const onChangeSpy1 = mock.fn()
    const onChangeSpy2 = mock.fn()

    myGrip.addObserver(onChangeSpy1)
    myGrip.addObserver(onChangeSpy2)

    myGrip.set('bar')

    assert.equal(onChangeSpy1.mock.calls.length, 1)
    assert.equal(onChangeSpy2.mock.calls.length, 1)
  })
})


describe('observable', () => {
  spec('can observe a change', async () => {
    const myGrip = valueGrip<string>('foo').observable

    const onChangeSpy = mock.fn()

    myGrip.addObserver(onChangeSpy, {observeInitialValue: true})

    await new Promise(r => setTimeout(r, 5))

    assert.equal(onChangeSpy.mock.calls.length, 1)
    assert.equal(myGrip.value, 'foo')
  })

  spec('can observe initial value', () => {
    const myGrip = valueGrip<string>('foo').observable

    const onChangeSpy = mock.fn()

    myGrip.addObserver(onChangeSpy)
    myGrip.set('bar')

    assert.equal(onChangeSpy.mock.calls.length, 1)
    assert.equal(myGrip.value, 'bar')
  })
  spec('can remove an observer', () => {
    const myGrip = valueGrip<string>('foo').observable

    const onChangeSpy = mock.fn()

    const remover = myGrip.addObserver(onChangeSpy)
    remover()

    myGrip.set('bar')

    assert.equal(onChangeSpy.mock.calls.length, 0)
  })
  spec('can observe multiple changes', () => {
    const myGrip = valueGrip<string>('foo').observable

    const onChangeSpy = mock.fn()
    myGrip.addObserver(onChangeSpy)

    myGrip.set('bar')
    myGrip.set('baz')
    myGrip.set('buzz')

    assert.equal(onChangeSpy.mock.calls.length, 3)
  })
  spec('multiple observers', () => {
    const myGrip = valueGrip<string>('foo').observable

    const onChangeSpy1 = mock.fn()
    const onChangeSpy2 = mock.fn()

    myGrip.addObserver(onChangeSpy1)
    myGrip.addObserver(onChangeSpy2)

    myGrip.set('bar')

    assert.equal(onChangeSpy1.mock.calls.length, 1)
    assert.equal(onChangeSpy2.mock.calls.length, 1)
  })
})

describe('transformGrip', () => {
  spec('can convert from String to Int', () => {
    const grip1 = valueGrip('a')
    const grip2 = transformGrip(grip1, {
      in: (v: number) => v.toString(16),
      out: (v: string) => parseInt(v, 16)
    })

    assert.equal(grip2.value, 10)
    assert.equal(grip1.value, 'a')
  })
  spec('can change outer grip', () => {
    const grip1 = valueGrip('a')
    const grip2 = transformGrip(grip1, {
      in: (v: number) => v.toString(16),
      out: (v: string) => parseInt(v, 16)
    })

    grip2.set(15)
    assert.equal(grip2.value, 15)
    assert.equal(grip1.value, 'f')

    grip2.set(1965)
    assert.equal(grip2.value, 1965)
    assert.equal(grip1.value, '7ad')
  })
  spec('can change inner grip', () => {
    const grip1 = valueGrip('a')
    const grip2 = transformGrip(grip1, {
      in: (v: number) => v.toString(16),
      out: (v: string) => parseInt(v, 16)
    })

    grip1.set('f')
    assert.equal(grip2.value, 15)
    assert.equal(grip1.value, 'f')

    grip1.set('7ad')
    assert.equal(grip2.value, 1965)
    assert.equal(grip1.value, '7ad')
  })
})


describe('readOnlyGrip', () => {
  spec('prevents modification to underlying grip', () => {
    const grip1 = valueGrip(7)
    const wrap = readOnlyGrip(grip1)

    assert.equal(wrap.value, 7)

    wrap.set(3)

    assert.equal(wrap.value, 7)
  })
})

describe('readOnly', () => {
  spec('prevents modification to underlying grip', () => {
    const grip1 = valueGrip(7)
    const wrap = grip1.readOnly

    assert.equal(wrap.value, 7)

    wrap.set(3)

    assert.equal(wrap.value, 7)
  })
})


describe('cookieGrip', () => {

  let mockDoc: Partial<Document>

  spec('should return the default value if no cookie is set', () => {
    const grip = cookieGrip('testCookie', 'defaultValue');
    grip.setDocument({
      cookie: ''
    });

    assert.equal(grip.value, 'defaultValue');
  });

  spec('should return the cookie value if it is set', () => {
    const grip = cookieGrip('testCookie', 'defaultValue');
    grip.setDocument({
      cookie: 'testCookie=cookieValue'
    });
    assert.equal(grip.value, 'cookieValue');
  });

  spec('should set the cookie value', () => {
    const grip = cookieGrip('testCookie', 'defaultValue');
    mockDoc = {
      cookie: ''
    }
    grip.setDocument(mockDoc);
    grip.set('newValue');
    assert(mockDoc.cookie!.includes('testCookie=newValue'));
  });

  spec('should update the cookie value', () => {

    const grip = cookieGrip('testCookie', 'defaultValue');
    mockDoc = {
      cookie: 'testCookie=oldValue'
    }
    grip.setDocument(mockDoc);
    grip.set('newValue');
    assert(mockDoc.cookie!.includes('testCookie=newValue'))
  });

  spec('should handle multiple cookies', () => {
    const grip1 = cookieGrip('cookie1', 'default1');
    const grip2 = cookieGrip('cookie2', 'default2');
    mockDoc = {
      cookie: 'cookie1=value1; cookie2=value2'
    }
    grip1.setDocument(mockDoc);
    grip2.setDocument(mockDoc);

    assert.equal(grip1.value, 'value1');
    assert.equal(grip2.value, 'value2');
  });
});


describe('objPropGrip', () => {
  spec('basic get and set', () => {

    const target = {
      foo: 1,
      bar: {
        buzz: [10, 11, 12]
      }
    }

    const fooGrip = objectPropGrip<{ foo: number }>('foo')
    assert.equal(fooGrip(target).value, 1)

    fooGrip(target).set(2)

    assert.equal(target.foo, 2)
  })

  spec('nesting', () => {

  })

  spec('works with arrays', () => {
    const ar = [10, 11, 12]

    const secondGrip = objectPropGrip<Array<number>>(1)

    const val = secondGrip(ar).value

    assert.equal(val, 11)
  })
})


describe('propGrip', () => {
  spec('gets the value of the specified property', () => {
    const obj = {a: 1, b: 2};
    const grip = valueGrip(obj);
    const propGripA = propGrip(grip, 'a');

    assert.equal(propGripA.value, 1);
  });

  spec('sets the value of the specified property', () => {
    const obj = {a: 1, b: 2};
    const grip = valueGrip(obj);
    const propGripA = propGrip(grip, 'a');

    propGripA.set(10);
    assert.equal(propGripA.value, 10);
    assert.equal(grip.value.a, 10);
  });

  spec('works on arrays', () => {
    const obj = ['a', 'b', 'c'];
    const agrip = valueGrip(obj);
    const grip = propGrip(agrip, 1);
    assert.equal(grip.value, 'b');

    grip.set('d');
    assert.equal(grip.value, 'd');
    assert.deepEqual(obj, ['a', 'b', 'c']) // immutable
    assert.notEqual(agrip.value, obj); // new reference
    assert.deepEqual(agrip.value, ['a', 'd', 'c']);
  });

  spec('should not affect other properties', () => {
    const obj = {a: 1, b: 2};
    const grip = valueGrip(obj);
    const propGripA = propGrip(grip, 'a');

    propGripA.set(10);
    assert.equal(grip.value.b, 2);
  });

  spec('should work with nested objects', () => {
    const obj = {a: {x: 1, y: 2}, b: 2};
    const grip = valueGrip(obj);
    const propGripA = propGrip(grip, 'a');
    const nestedPropGripX = propGrip(propGripA, 'x');

    nestedPropGripX.set(10);
    assert.equal(nestedPropGripX.value, 10);
    assert.equal(grip.value.a.x, 10);
  });
});


describe('guardedGrip', () => {
  spec('should use source grip value when guard function returns false', () => {
    const srcGrip = valueGrip(0);
    const guarded = valueGrip(1);
    const guardFn = () => false;
    const grip = guardedGrip(srcGrip, guardFn, guarded);

    assert.equal(grip.value, 0);
  });

  spec('should use guarded grip value when guard function returns true', () => {
    const srcGrip = valueGrip(0);
    const guarded = valueGrip(1);
    const guardFn = () => true;
    const grip = guardedGrip(srcGrip, guardFn, guarded);

    assert.equal(grip.value, 1);
  });

  spec('should set value on source grip when guard function returns false', () => {
    const srcGrip = valueGrip(0);
    const guarded = valueGrip(1);
    const guardFn = () => false;
    const grip = guardedGrip(srcGrip, guardFn, guarded);

    grip.set(2);
    assert.equal(srcGrip.value, 2);
    assert.equal(guarded.value, 1);
  });

  spec('should set value both grips when guard function returns true', () => {
    const srcGrip = valueGrip(0);
    const guarded = valueGrip(1);
    const guardFn = () => true;
    const grip = guardedGrip(srcGrip, guardFn, guarded);

    grip.set(2);
    assert.equal(srcGrip.value, 2);
    assert.equal(guarded.value, 2);
  });
  //
  // spec('should handle async guard function', async () => {
  //   const srcGrip = valueGrip(0);
  //   const guarded = valueGrip(1);
  //   const guardFn = async () => true;
  //   const grip = guardedGrip(srcGrip, guardFn, guarded);
  //
  //   assert.equal(await grip.value, 1);
  // });

  spec('should handle async getter and setter with guard on', async () => {
    const srcGrip = valueGrip(Promise.resolve(0));
    const guarded = valueGrip(Promise.resolve(1));
    const guardFn = () => true;

    const grip = guardedGrip(srcGrip, guardFn, guarded);

    assert.equal(await grip.value, 1);
    assert.equal(await srcGrip.value, 0);
    assert.equal(await guarded.value, 1);

    await grip.set(Promise.resolve(2))

    assert.equal(await grip.value, 2)
    assert.equal(await srcGrip.value, 2);
    assert.equal(await guarded.value, 2);
  });
  spec('should handle async getter and setter with guard off', async () => {

    const srcGrip = valueGrip(Promise.resolve(0));
    const guarded = valueGrip(Promise.resolve(1));
    const guardFn = () => false;

    const grip = guardedGrip(srcGrip, guardFn, guarded);

    assert.equal(await guarded.value, 1); // ignored
    assert.equal(await grip.value, 0)
    assert.equal(await srcGrip.value, 0);

    await grip.set(Promise.resolve(2))
    assert.equal(await grip.value, 2)
    assert.equal(await srcGrip.value, 2);
    assert.equal(await guarded.value, 1); // doesn't change
  });
});



describe('localStorageStringGrip', () => {
  let localStorage: Storage;

  beforeEach(() => {
    localStorage = {
      getItem: mock.fn(),
      setItem: mock.fn(),
      removeItem: mock.fn(),
      clear: mock.fn(),
      key: mock.fn(),
      length: 0
    } as unknown as Storage;
  });

  spec('should return the default value if no item is set in localStorage', () => {
    localStorage.getItem = () => null

    const key = 'testKey';
    const defaultValue = 'defaultValue';
    const grip = localStorageStringGrip(key, defaultValue, localStorage);

    assert.equal(grip.value, defaultValue);
  });

  spec('should return the value from localStorage if it is set', () => {
    const key = 'testKey';
    const defaultValue = 'defaultValue';
    const storedValue = 'storedValue';
    const grip = localStorageStringGrip(key, defaultValue, localStorage);

    localStorage.getItem = () => storedValue

    assert.equal(grip.value, storedValue);
  });

  spec('should set the value in localStorage', () => {
    const key = 'testKey';
    const defaultValue = 'defaultValue';
    const newValue = 'newValue';
    const grip = localStorageStringGrip(key, defaultValue, localStorage);

    grip.set(newValue);

    const m = localStorage.setItem as unknown as ReturnType<typeof mock.fn>;
    assert.equal(m.mock.callCount(), 1);
    assert.equal(m.mock.calls[0].arguments[0], key);
    assert.equal(m.mock.calls[0].arguments[1], newValue);
  });

  spec('should update the value in localStorage', () => {
    const key = 'testKey';
    const defaultValue = 'defaultValue';
    const newValue = 'newValue';
    const grip = localStorageStringGrip(key, defaultValue, localStorage);

    grip.set(newValue);

    const m = localStorage.setItem as unknown as ReturnType<typeof mock.fn>;
    assert.equal(m.mock.callCount(), 1);
    assert.equal(m.mock.calls[0].arguments[0], key);
    assert.equal(m.mock.calls[0].arguments[1], newValue);
  });

});

describe('localStorageJSONGrip', () => {
  let localStorage: Storage;

  beforeEach(() => {
    localStorage = {
      getItem: mock.fn(),
      setItem: mock.fn(),
      removeItem: mock.fn(),
      clear: mock.fn(),
      key: mock.fn(),
      length: 0
    } as unknown as Storage;
  });

  spec('should return the default value if no item is set in localStorage', () => {
    localStorage.getItem = () => null

    const key = 'testKey';
    const defaultValue = 'defaultValue';
    const grip = localStorageJSONGrip(key, defaultValue, localStorage);

    assert.equal(grip.value, defaultValue);
  });

  spec('should return the value from localStorage if it is set', () => {
    const key = 'testKey';
    const defaultValue = 'defaultValue';
    const storedValue = 'storedValue';
    const grip = localStorageJSONGrip(key, defaultValue, localStorage);

    localStorage.getItem = () => JSON.stringify(storedValue)

    assert.equal(grip.value, storedValue);
  });

  spec('should set the value in localStorage', () => {
    const key = 'testKey';
    const defaultValue = 'defaultValue';
    const newValue = 'newValue';
    const grip = localStorageJSONGrip(key, defaultValue, localStorage);

    grip.set(newValue);

    const m = localStorage.setItem as unknown as ReturnType<typeof mock.fn>;
    assert.equal(m.mock.callCount(), 1);
    assert.equal(m.mock.calls[0].arguments[0], key);
    assert.equal(m.mock.calls[0].arguments[1], JSON.stringify(newValue));
  });

  spec('should update the value in localStorage', () => {
    const key = 'testKey';
    const defaultValue = 'defaultValue';
    const newValue = 'newValue';
    const grip = localStorageJSONGrip(key, defaultValue, localStorage);

    grip.set(newValue);

    const m = localStorage.setItem as unknown as ReturnType<typeof mock.fn>;
    assert.equal(m.mock.callCount(), 1);
    assert.equal(m.mock.calls[0].arguments[0], key);
    assert.equal(m.mock.calls[0].arguments[1], JSON.stringify(newValue));
  });

  spec('should handle non-string values', () => {
    const key = 'testKey';
    const defaultValue = { foo: 'bar' };
    const newValue = { foo: 'baz' };
    const grip = localStorageJSONGrip(key, defaultValue, localStorage);

    localStorage.getItem = () => JSON.stringify(newValue)

    assert.deepEqual(grip.value, newValue);

    grip.set(newValue);

    const m = localStorage.setItem as unknown as ReturnType<typeof mock.fn>;
    assert.equal(m.mock.callCount(), 1);
    assert.equal(m.mock.calls[0].arguments[0], key);
    assert.equal(m.mock.calls[0].arguments[1], JSON.stringify(newValue));
  });
});