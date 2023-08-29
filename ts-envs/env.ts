type EnvMetaDescription = {
  description: string,
}
type EnvMetaDefaultStringBase = EnvMetaDescription
type EnvMetaStringBase = {
  type: 'string',
  valid?: (s: string) => boolean
} & EnvMetaDescription
type EnvMetaIntegerBase = {
  type: 'integer',
  valid?: (s: number) => boolean
} & EnvMetaDescription
type EnvMetaBooleanBase = {
  type: 'boolean',
  valid?: (b: boolean) => boolean
} & EnvMetaDescription

type EnvMetadataBaseNoDefault = EnvMetaStringBase | EnvMetaIntegerBase | EnvMetaBooleanBase
type EnvMetadataBase = EnvMetaDefaultStringBase | EnvMetadataBaseNoDefault

type EnvType<T extends EnvMetadataBase> =
  T extends { type: unknown }
    ? T['type'] extends 'integer'
      ? number
      : T['type'] extends 'boolean'
        ? boolean
        : string
    : string

type RequiredMetadata<Metadata extends EnvMetadataBase> = Metadata & {
  required: true,
  default?: never
}

type OptionalMetadata<Metadata extends EnvMetadataBase> = Metadata & {
  required: false,
  default: EnvType<Metadata>
}

// I apologize, as this is getting pretty ham-fisted here.
type EnvMetadata =
  RequiredMetadata<EnvMetaIntegerBase> |
  RequiredMetadata<EnvMetaBooleanBase> |
  RequiredMetadata<EnvMetaDefaultStringBase> |
  RequiredMetadata<EnvMetaStringBase> |
  OptionalMetadata<EnvMetaIntegerBase> |
  OptionalMetadata<EnvMetaBooleanBase> |
  OptionalMetadata<EnvMetaStringBase> |
  OptionalMetadata<EnvMetaDefaultStringBase>

type EnvsConfiguration = Record<string, EnvMetadata>

type EnvsAccessor<T extends EnvsConfiguration> =
  {
    [P in keyof T]: EnvType<T[P]>
  } & {
  envsValid: () => boolean,
  helpText: string,
  dotEnvExample: string,
  errors: Array<string>
}

const BooleanValues = {
  '0': false,
  'FALSE': false,
  'false': false,
  '1': true,
  'TRUE': true,
  'true': true,
} as Record<string, boolean>;

export function configure<T extends EnvsConfiguration>(
  configuration: T,
  options: { validate: boolean } = {validate: true}
): EnvsAccessor<T> {
  const envsAccessor: Record<string, unknown> = {}

  const envsValid = () => {
    return checkEnvironmentalVariables(configuration).length === 0
  }

  Object.defineProperties(envsAccessor, {
    helpText: {
      get: () => helpText(configuration),
      enumerable: false
    },
    dotEnvExample: {
      get: () => dotEnvExample(configuration),
      enumerable: false
    },
    errors: {
      get: () => checkEnvironmentalVariables(configuration),
      enumerable: false
    },
    envsValid: {
      value: envsValid,
      enumerable: false
    }
  })

  // Build an object whose properties are lazily evaluated
  Object.keys(configuration).forEach(k => {
    Object.defineProperty(envsAccessor, k, {
      get() {
        return readEnv(k, configuration[k])
      },
      enumerable: true
    })
  })

  if (options.validate && !envsValid()) {
    const errors = checkEnvironmentalVariables(configuration)
    console.error('Environmental variable errors!')
    for (const e of errors)
      console.error(`${e}\n`)
    console.log('')
    console.log(helpText(configuration))
    process.exit(1)
  }

  return envsAccessor as EnvsAccessor<T>
}

export function helpText(configuration: EnvsConfiguration) {

  const requiredCount = Object.values(configuration).filter(e => e.required).length
  const optionalCount = Object.values(configuration).filter(e => !e.required).length
  const maxLength =
    Math.max(...Object.keys(configuration).map(jsKey2envName).map(s => s.length))

  let output = 'E N V I R O N M E N T   V A R I A B L E S\n\n'

  if (requiredCount > 0)
    output += 'Required environment variables:\n'
  for (const k in configuration) {
    if (!configuration[k].required) continue
    output += `${rpad(jsKey2envName(k), maxLength)}   ${configuration[k].description}\n`
  }

  if (requiredCount > 0 && optionalCount > 0)
    output += '\n'
  if (optionalCount > 0)
    output += 'Optional environment variables [default value]:\n'
  for (const k in configuration) {
    if (configuration[k].required) continue
    output += `${rpad(jsKey2envName(k), maxLength)}   ${configuration[k].description} ["${configuration[k].default}"]\n`
  }

  return output
}

export function dotEnvExample(configuration: EnvsConfiguration) {
  const keys = Object.keys(configuration).sort()
  let output = '# Example Environment Variables\n' +
    '# Copy into a file named `.env` and change values accordingly.'
  for (const k of keys) {
    const config = configuration[k];
    output += "\n"
    if (!config.required) output += '# '
    output += `${jsKey2envName(k)}=""   # ${config.description}`
    if (!config.required) output += `(default "${config.default}")`
  }
  return output
}


export function checkEnvironmentalVariables(configuration: EnvsConfiguration) {

  const errors = [] as Array<string>

  Object.keys(configuration).forEach(k => {
    try {
      readEnv(k, configuration[k])
    } catch (e: unknown) {
      errors.push((e as Error).message)
    }
  })

  return errors
}

export function readEnv<T extends EnvMetadata>(jsKey: string, meta: T): EnvType<T> {

  const name = jsKey2envName(jsKey);

  const rawValue = process.env[name]

  const missing = rawValue === '' || rawValue === undefined;

  if (missing)
    if (!meta.required)
      return meta.default as EnvType<T>
    else
      throw Error(`Missing environment variable "${name}"\nDescription: ${meta.description}`)

  const typ = (meta as EnvMetadataBaseNoDefault).type;

  switch (typ) {
    case 'integer': {
      const value = parseInt(rawValue)

      if (isNaN(value))
        throw Error(`Non-numeric environment variable "${name}" expected to be an integer.\nIt cannot be parsed using parseInt().\nDescription: ${meta.description}`)

      // call user validation, if provided
      const m = meta as EnvMetaIntegerBase
      if (m.valid && !m.valid(value))
        throw Error(`Environment variable "${name}" with value ${value} failed validation.\nDescription: ${meta.description}`)

      return value as EnvType<T>
    }

    case 'boolean': {
      const value = BooleanValues[rawValue]

      if (value === undefined)
        throw Error(`Non-boolean environment variable "${name}" expected to be an truthy or falsey, but got "${rawValue}".\nTruthy values are "TRUE" or "1". Falsey values are "FALSE" and "0".\nDescription: ${meta.description}`)

      // call user validation, if provided. This seems
      // silly, but for consistency adding it.
      const m = meta as EnvMetaBooleanBase
      if (m.valid && !m.valid(value))
        throw Error(`Environment variable "${name}" with value ${value} ("${rawValue}") failed validation.\nDescription: ${meta.description}`)


      return value as EnvType<T>
    }

    default: {
      // call user validation, if provided
      const m = meta as EnvMetaStringBase
      if (m.valid && !m.valid(rawValue))
        throw Error(`Environment variable "${name}" failed validation. Value: "${rawValue}"\nDescription: ${meta.description}`)

      return rawValue as EnvType<T>
    }
  }

}

function jsKey2envName(k: string) {
  return k.toLocaleUpperCase()
}

function rpad(s: string, len: number): string {
  return s.length < len ? rpad(s.toString() + ' ', len) : s;
}
