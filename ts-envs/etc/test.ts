import {test, describe, mock} from 'node:test'
import assert from 'node:assert/strict'

import {checkEnvironmentalVariables, configure, dotEnvExample, helpText, readEnv} from '../env'


describe('configure', () => {

  test('makes environment variables enumerable', () => {
    const envs = configure({
      user: {
        required: true,
        description: 'a user string'
      },
      baby: {
        required: true,
        description: 'a baby string'
      },
      taco: {
        required: true,
        description: 'a taco string'
      }
    }, {validate: false})

    const result = [] as Array<string>
    for (const s in envs) result.push(s)

    assert.deepEqual(result, ['user', 'baby', 'taco'])
  })

})

describe('readEnv', () => {

  test('reads lowercase', () => {
    assert(process.env.USER)
    assert.equal(readEnv('user', {
      type: 'string',
      required: true,
      description: 'Unix acct name'
    }), process.env.USER)
  })

  test('reads uppercase', () => {
    assert.equal(readEnv('USER', {
      type: 'string',
      required: true,
      description: 'Unix acct name'
    }), process.env.USER)
  })

  test('reads integer', () => {
    process.env.AN_INT = '42'
    assert.equal(readEnv('AN_INT', {
      type: 'integer',
      required: true,
      description: ''
    }), 42)
  })

  test('throws if not an integer', () => {
    assert.throws(() => readEnv('USER', {
      required: true,
      type: 'integer',
      description: 'i am not a number'
    }))
  })

  test('reads integer that passes validation', () => {
    let count = 0
    const validFn = (i: number) => {
      count++
      return true
    }
    process.env.AN_INT = '42'
    assert.equal(readEnv('AN_INT', {
      type: 'integer',
      required: true,
      description: '',
      valid: validFn
    }), 42)
    assert.equal(count, 1)
  })

  test('throws if not an integer fails validation', () => {
    process.env.AN_INT = '42'
    assert.throws(() => readEnv('AN_INT', {
      required: true,
      type: 'integer',
      description: 'i am not a number',
      valid: (i: number) => i === 666
    }))
  })

  test('reads boolean (number values)', () => {
    process.env.T_BOOL = '1'
    process.env.F_BOOL = '0'
    assert.equal(readEnv('T_BOOL', {
      type: 'boolean',
      required: true,
      description: ''
    }), true)
    assert.equal(readEnv('F_BOOL', {
      type: 'boolean',
      required: true,
      description: ''
    }), false)
  })

  test('reads boolean (string values)', () => {
    process.env.T_BOOL = 'TRUE'
    process.env.F_BOOL = 'false'
    assert.equal(readEnv('T_BOOL', {
      type: 'boolean',
      required: true,
      description: ''
    }), true)
    assert.equal(readEnv('F_BOOL', {
      type: 'boolean',
      required: true,
      description: ''
    }), false)
  })

  test('throws if not a boolean', () => {
    process.env.A_BOOL = 'MAYBE'
    assert.throws(() => readEnv('A_BOOL', {
      required: true,
      type: 'boolean',
      description: 'not booleanish'
    }))
  })


  test('throws if missing required', () => {
    assert.throws(() => readEnv('_NO_SUCH_ENV_VARIABLE_', {
      required: true,
      description: ''
    }))
  })

  test('defaults if missing optional', () => {
    const defaultValue = 'match-me';

    assert.equal(readEnv('_NO_SUCH_ENV_VARIABLE_', {
      required: false,
      description: '',
      default: defaultValue
    }), defaultValue)
  })
})


describe('checkEnvironmentalVariables', () => {

  test('returns no errors for provided variables', () => {
    assert(process.env.USER) // precondition
    process.env.SOME_NUMBER = '42'
    const result = checkEnvironmentalVariables({
      user: {
        type: 'string',
        required: true,
        description: 'Unix acct name'
      },
      SOME_NUMBER: {
        type: 'integer',
        required: true,
        description: ''
      }
    })

    assert.deepEqual(result, [])
  })

  test('returns no errors if optional variable not provided', () => {
    const result = checkEnvironmentalVariables({
      _NO_SUCH_ENV_VARIABLE_: {
        required: false,
        description: '',
        default: 'yeah'
      }
    })

    assert.deepEqual(result, [])
  })


  test('returns error if missing required', () => {
    const result = checkEnvironmentalVariables({
      _NO_SUCH_ENV_VARIABLE_: {
        required: true,
        description: 'desc'
      }
    })

    assert.deepEqual(result, ['Missing environment variable "_NO_SUCH_ENV_VARIABLE_"\n' +
    'Description: desc'])
  })


  test('returns error if integer config is not an integer', () => {
    process.env.AN_INT = 'FOO'
    const result = checkEnvironmentalVariables({
      AN_INT: {
        required: true,
        type: 'integer',
        description: 'i am not a number'
      }
    })

    assert.deepEqual(result, [
      'Non-numeric environment variable "AN_INT" expected to be an integer.\n' +
      'It cannot be parsed using parseInt().\n' +
      'Description: i am not a number'])

  })

  test('returns error if boolean config is not boolean', () => {
    process.env.A_BOOL = 'FOO'
    const result = checkEnvironmentalVariables({
      A_BOOL: {
        required: true,
        type: 'boolean',
        description: 'i am not false'
      }
    })

    assert.deepEqual(result, [
      'Non-boolean environment variable "A_BOOL" expected to be an truthy or falsey, but got "FOO".\n' +
      'Truthy values are "TRUE" or "1". Falsey values are "FALSE" and "0".\n' +
      'Description: i am not false'])

  })

})


describe('helpText', () => {

  test('returns required variables', () => {
    const result = helpText({
      my_var: {
        description: 'a variable called "my var"',
        required: true
      }
    })
    assert.equal(result, 'E N V I R O N M E N T   V A R I A B L E S\n\n' +
      'Required environment variables:\n' +
      'MY_VAR   a variable called "my var"\n')
  })

  test('returns optional variables', () => {
    const result = helpText({
      my_var: {
        description: 'a variable called "my var"',
        required: false,
        default: 'horse'
      }
    })
    assert.equal(result, 'E N V I R O N M E N T   V A R I A B L E S\n\nOptional environment variables [default value]:' +
      '\nMY_VAR   a variable called "my var" ["horse"]\n')
  })
  test('returns both required and optional variables', () => {
    const result = helpText({
      my_req: {
        description: 'a variable called "MY_REQ"',
        required: true
      },
      my_opt: {
        description: 'a variable called "MY_OPT"',
        required: false,
        default: 'oh'
      }
    })
    assert.equal(result, 'E N V I R O N M E N T   V A R I A B L E S\n\nRequired environment variables:' +
      '\nMY_REQ   a variable called "MY_REQ"' +
      '\n\nOptional environment variables [default value]:' +
      '\nMY_OPT   a variable called "MY_OPT" ["oh"]\n')
  })

  test('keeps variables in the same order', () => {
    const result = helpText({
      j: {
        description: 'a variable called "j"',
        required: true
      },
      z: {
        description: 'a variable called "z"',
        required: true
      },
      a: {
        description: 'a variable called "a"',
        required: true
      },
    })
    const expected = 'E N V I R O N M E N T   V A R I A B L E S\n\nRequired environment variables:\n' +
      'J   a variable called "j"\n' +
      'Z   a variable called "z"\n' +
      'A   a variable called "a"\n';
    assert.equal(result, expected)
  })

  test('aligns descriptions of variables', () => {
    const result = helpText({
      aaaaaaaaaaaa: {
        description: 'a variable called "a"',
        required: true
      },
      z: {
        description: 'a variable called "z"',
        required: true
      }
    })
    assert.equal(result, 'E N V I R O N M E N T   V A R I A B L E S\n\nRequired environment variables:\n' +
      'AAAAAAAAAAAA   a variable called "a"\n' +
      'Z              a variable called "z"\n')
  })
})


describe('dotEnvExample', () => {

  test('no variables', () => {
    assert.match(dotEnvExample({}), /Example Environment Variables/)
    assert.match(dotEnvExample({}), /\.env/)
  })

  test('required variable', () => {
    const result = dotEnvExample({foo: {required: true, description: 'Some foo value'}});
    assert.match(result, /Example Environment Variables/)
    assert.match(result, /^FOO=/m)
    assert.match(result, /Some foo value/m)
  })

  test('optional variable', () => {
    const result = dotEnvExample({foo: {required: false, description: 'Some foo value', default: 'bar'}});
    assert.match(result, /Example Environment Variables/)
    assert.match(result, /^# FOO=/m)
    assert.match(result, /Some foo value/m)
    assert.match(result, /\(default "bar"\)$/m)
  })
})
