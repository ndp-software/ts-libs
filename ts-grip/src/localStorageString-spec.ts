import {beforeEach, describe, it as spec, mock} from "node:test";
import {localStorageStringGrip} from "./localStorageString";
import assert from "node:assert/strict";

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
