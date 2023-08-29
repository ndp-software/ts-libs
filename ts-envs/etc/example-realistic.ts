import {configure} from "../env";

const envs = configure({
  hostname: {
    description: 'Hostname to be reflected in logs',
    required: false,
    default: 'www.example.com'
  },
  db_url: {
    description: 'A connection to the database, eg. sqlite3://localhost:3495',
    required: true,
  },
  port: {
    type: 'integer',
    description: 'Port to listen for HTTP requests',
    required: true
  },
  threads: {
    type: 'integer',
    description: 'Number of threads to launch',
    required: false,
    default: 8
  },
  cache_url: {
    type: 'string',
    description: 'Memcache connection, optional',
    required: false,
    default: ''
  },
  permissions: {
    type: 'string',
    description: 'JSON configs would be strings',
    required: true
  }
})

if (!envs.envsValid())
  process.exit(1)

// Entries come out as the right type!
const a1: string = envs.cache_url
const a2: string = envs.db_url
const a3: number = envs.port
const a4: string = envs.hostname
const a5: number = envs.threads

