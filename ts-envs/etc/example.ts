import {configure} from "../env";

const envs = configure({
  hostname: {
    description: 'by default, environment variables are strings',
    required: false,
    default: 'jj'
  },
  db_url: {
    // type: 'string', // the default
    description: 'required variables cannot have a default value',
    required: true,
    // default: 'sqlite3://localhost:3495'
    // required variables have no default values
  },
  port: {
    type: 'integer',
    description: 'required integer, must be >= 1000',
    required: true,
    valid: (i) => i >= 1000
  },
  threads: {
    type: 'integer',
    description: 'optional integer, has a default',
    required: false,
    default: 8
  },
  cache_url: {
    type: 'string',
    description: 'type of string can be specified explicitly',
    required: false,
    default: 'memcached://localhost:1234',
    valid: (s: string) => s.startsWith('memcached')
  },
  permissions: {
    type: 'string',
    description: 'JSON configs would be strings',
    required: true
  },
  verbose: {
    type: 'boolean',
    description: 'set to see more details during the run',
    required: true
  }
})

// Entries come out as the right type!
const a1: string  = envs.cache_url
const a2: string  = envs.db_url
const a3: number  = envs.port
const a4: string  = envs.hostname
const a5: number  = envs.threads
const a6: boolean = envs.verbose

