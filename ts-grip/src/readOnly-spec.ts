import {describe, it as spec} from "node:test";
import {readOnlyGrip, valueGrip} from "./grip";
import assert from "node:assert/strict";

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
