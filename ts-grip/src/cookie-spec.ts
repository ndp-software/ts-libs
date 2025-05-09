import {describe, it as spec} from "node:test";
import assert from "node:assert/strict";
import {cookieGrip} from "./cookie";
import {Grip, GripTypeOf, observeableGrip} from "./grip";


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

  spec('should set the cookie settings', () => {
    const grip = cookieGrip('testCookie', 'defaultValue', ';path=/dev;SameSite=Lenient');
    mockDoc = {
      cookie: ''
    }
    grip.setDocument(mockDoc);
    grip.set('newValue');
    assert(mockDoc.cookie!.includes('SameSite=Lenient'));
    assert(mockDoc.cookie!.includes('path=/dev'));
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

  spec('infers type of Grip for observableGrip function', () => {
    type MyType = 'foo' | 'bar' | 'baz'
    const grip = cookieGrip('mode', 'baz' as MyType)
    grip.setDocument({
      cookie: 'testCookie=oldValue'
    })
    const obs = observeableGrip(grip)
    obs.addObserver(updateBodyClass, {observeInitialValue: true})

    function updateBodyClass(next: MyType, prev: MyType | undefined) {
    }
  })

  spec('infers type of Grip from .observer', () => {
    type MyType = 'foo' | 'bar' | 'baz'
    const grip = cookieGrip('mode', 'baz' as MyType)
    grip.setDocument({
      cookie: 'testCookie=oldValue'
    })
    const obs = grip.observable
    obs.addObserver(updateBodyClass, {observeInitialValue: true})

    function updateBodyClass(next: MyType, prev: MyType | undefined) {
    }
  })

});
