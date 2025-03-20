import {describe, it as spec} from "node:test";
import {cookieGrip} from "./grip";
import assert from "node:assert/strict";


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
