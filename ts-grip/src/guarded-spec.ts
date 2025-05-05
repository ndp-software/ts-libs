import {beforeEach, describe, it as spec} from "node:test";
import assert from "node:assert/strict";
import {AsyncGuard, guardedGrip, guardedGripAsync, guardedGripSync, SyncGuard} from "./guarded";
import {ValueGrip, valueGrip} from "./valueGrip";
import {ManualGrip} from "./manualGrip";
import {Grip} from "./grip";

describe('guardedGripSync', () => {

  let srcGrip
  let guarded

  describe('sync', () => {
    beforeEach(() => {
      srcGrip = valueGrip(0);
      guarded = valueGrip(1);
    });
    [
      [(() => false), 'srcGrip', 0, 2, 1],
      [(() => true), 'guarded', 1, 2, 2],
      [valueGrip(false), 'srcGrip', 0, 2, 1],
      [valueGrip(true), 'guarded', 1, 2, 2]
    ].forEach(([guardFn, source, expected, srcValueExpected, guardedValueExpected]:
               [Grip<boolean>, 0 | 1, 'srcGrip' | 'guarded', 0 | 1 | 2, 0 | 1 | 2]) => {

      spec(`guardedGripSync should use ${source} when guard ${guardFn}`, () => {
        const grip = guardedGripSync(srcGrip, guardFn, guarded);
        assert.equal(grip.value, expected);
      });

      spec(`guardedGripSync should set value on ${source} when guard ${guardFn}`, () => {
        const grip = guardedGripSync(srcGrip, guardFn, guarded);
        grip.set(2);
        assert.equal(srcGrip.value, srcValueExpected);
        assert.equal(guarded.value, guardedValueExpected);
        assert.equal(grip.value, 2)
      });

      spec(`guardedGrip should use ${source} when guard ${guardFn}`, () => {
        const grip = guardedGrip(srcGrip, guardFn, guarded);
        assert.equal(grip.value, expected);
      });

      spec(`guardedGrip should set value on ${source} when guard ${guardFn}`, () => {
        const grip = guardedGrip(srcGrip, guardFn, guarded);
        grip.set(2);
        assert.equal(srcGrip.value, srcValueExpected);
        assert.equal(guarded.value, guardedValueExpected);
        assert.equal(grip.value, 2)
      });

    });
  });

  describe('async', () => {
    beforeEach(() => {
      srcGrip = valueGrip(Promise.resolve(0));
      guarded = valueGrip(Promise.resolve(1));
    });

    [
      [false, 'srcGrip', 0, 2, 1],
      [true, 'guarded', 1, 2, 2],
    ].forEach(([guard, source, expected, srcValueExpected, guardedValueExpected]:
               [boolean, 0 | 1, 'srcGrip' | 'guarded', 0 | 1 | 2, 0 | 1 | 2]) => {

      spec(`guardedGripAsync should use ${source} when async guard function returns ${guard}`, async () => {
        const guardFn = () => Promise.resolve(guard);
        const grip = guardedGripAsync(srcGrip, guardFn, guarded);

        assert.equal(await grip.value, expected);
      });

      spec(`guardedGripAsync should set value on ${source} when async guard function returns ${guard}`, async () => {
        const guardFn = () => Promise.resolve(guard)
        const grip = guardedGripAsync(srcGrip, guardFn, guarded);

        await grip.set(Promise.resolve(2));

        assert.equal(await srcGrip.value, srcValueExpected);
        assert.equal(await guarded.value, guardedValueExpected);
        assert.equal(await grip.value, 2)
      });

      spec(`guardedGripAsync should use ${source} when async guard grips ${guard}`, async () => {
        const guardFn = valueGrip(guard);
        const grip = guardedGripAsync(srcGrip, guardFn, guarded);

        assert.equal(await grip.value, expected);
      });

      spec(`guardedGripAsync should set value on ${source} when async guard grips ${guard}`, async () => {
        const guardFn = valueGrip(guard);
        const grip = guardedGripAsync(srcGrip, guardFn, guarded);

        await grip.set(Promise.resolve(2));

        assert.equal(await srcGrip.value, srcValueExpected);
        assert.equal(await guarded.value, guardedValueExpected);
        assert.equal(await grip.value, 2)
      });

      spec(`guardedGripAsync should use ${source} when async guard grips promise of ${guard}`, async () => {
        const guardFn = valueGrip(Promise.resolve(guard));
        const grip = guardedGripAsync(srcGrip, guardFn, guarded);

        assert.equal(await grip.value, expected);
      });

      spec(`guardedGripAsync should set value on ${source} when async guard grips promise of ${guard}`, async () => {
        const guardFn = valueGrip(Promise.resolve(guard));
        const grip = guardedGripAsync(srcGrip, guardFn, guarded);

        await grip.set(Promise.resolve(2));

        assert.equal(await srcGrip.value, srcValueExpected);
        assert.equal(await guarded.value, guardedValueExpected);
        assert.equal(await grip.value, 2)
      });

      spec(`guardedGrip should use ${source} when async guard function returns ${guard}`, async () => {
        const guardFn = () => Promise.resolve(guard);
        const grip = guardedGrip(srcGrip, guardFn, guarded);

        assert.equal(await grip.value, expected);
      });

      spec(`guardedGrip should set value on ${source} when async guard function returns ${guard}`, async () => {
        const guardFn = () => Promise.resolve(guard)
        const grip = guardedGrip(srcGrip, guardFn, guarded);

        await grip.set(Promise.resolve(2));

        assert.equal(await srcGrip.value, srcValueExpected);
        assert.equal(await guarded.value, guardedValueExpected);
        assert.equal(await grip.value, 2)
      });

      spec(`guardedGrip should use ${source} when async guard grips ${guard}`, async () => {
        const guardFn = valueGrip(guard);
        const grip = guardedGrip(srcGrip, guardFn, guarded);

        assert.equal(await grip.value, expected);
      });

      spec(`guardedGrip should set value on ${source} when async guard grips ${guard}`, async () => {
        const guardFn = valueGrip(guard);
        const grip = guardedGrip(srcGrip, guardFn, guarded);

        await grip.set(Promise.resolve(2));

        assert.equal(await srcGrip.value, srcValueExpected);
        assert.equal(await guarded.value, guardedValueExpected);
        assert.equal(await grip.value, 2)
      });

      spec(`guardedGrip should use ${source} when async guard grips promise of ${guard}`, async () => {
        const guardFn = valueGrip(Promise.resolve(guard));
        const grip = guardedGrip(srcGrip, guardFn, guarded);

        assert.equal(await grip.value, expected);
      });

      spec(`guardedGrip should set value on ${source} when async guard grips promise of ${guard}`, async () => {
        const guardFn = valueGrip(Promise.resolve(guard));
        const grip = guardedGrip(srcGrip, guardFn, guarded);

        await grip.set(Promise.resolve(2));

        assert.equal(await srcGrip.value, srcValueExpected);
        assert.equal(await guarded.value, guardedValueExpected);
        assert.equal(await grip.value, 2)
      });

    })
  })

});

