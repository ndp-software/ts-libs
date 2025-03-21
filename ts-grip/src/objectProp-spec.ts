import {describe, it as spec} from "node:test";
import assert from "node:assert/strict";
import {valueGrip} from "./valueGrip";
import {objectPropGrip, propGrip} from "./objectProp";

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
