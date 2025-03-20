import {describe, it as spec} from "node:test";
import {guardedGrip, valueGrip} from "./grip";
import assert from "node:assert/strict";

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

