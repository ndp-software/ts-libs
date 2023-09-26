Carefully crafted help for environmental variable processing within your Typescript project. This library provides a type-safe `envs` variable with all your validated and typed environment variables.

## Introduction

The popularity of 12-factor apps has encouraged us to put more information into environment variables, and react to them within the app. This has stream-lined deployments over the years, but sometimes caused configuration issues. Small problems have cropped up:
- When an environment variable is used in multiple parts of the code, it may be used inconsistently.
- Maintaining and updating default values in different parts of the code is error prone.
- (most common) A new dev starts on a project and discovers that there are undocumented environmental variables that must be set in specific ways in order for the project to run. This is often a bit of a treasure hunt, and can be quite time consuming. On a recent project it took me several weeks to get a working set of environmental variables, due to unavailability of the developer and plethora of unknown libraries in use. 

This library, **ts-envs** is a small solution to those small problems.

## Features

- Provide great Typescript support, both in configuration and the variable access. Client code should not have to coerce any values.
- Provide consistent defaults for optional env variables
- Detect missing configurations in one place and provide nice error messages.
- Provide documentation about what is expected, both as help text and sample `.env` file generation.

## Usage

### `configure`
When using this package, simply replace uses of `process.env[]` with an alternative object. It's called `envs` in this documentation, but you can call it whatever you want. Initialize it with the `configure` function, exporting it so that it can be used within the codebase.

The `configure` function requires simple metadata about each of the expected environment variables.
```ts
import {configure} from "ts-envs";

export const envs = configure({
  debug: { description: "Debug mode. Off by default",
    type: 'boolean', required: false, default: false }
})

// ... 
if (envs.debug) {
  // ...
}
```

Here is an more complex example:

```ts
import {configure} from "ts-envs";

export const envs = configure({
  hostname: {
    description: 'Hostname to be reflected in logs',
    required:     false,
    default:     'www.example.com'
  },
  db_url: {
    description: 'A connection to the database, eg. sqlite3://localhost:3495',
    required:     true,
  },
  port: {
    type:        'integer',
    description: 'Port to listen for HTTP requests',
    required:     true
  },
  verbose: {
    type:        'boolean',
    description: 'Log more stuff',
    required:     false,
    default:      false
  }
})
```
In most cases, you will export this configuration and access it throughout your 
code where you need access to environment variables, using it instead of 
`process.env` everywhere. 

The configuration for each variable name is called "metadata", and the metadata attributes are:
- `description` (required): a textual description of the variable
- `type` (default "string"): `string`, `boolean` or `integer`. For booleans, only "0" or "1" or "true" or "false" are interpreted and valid.
- `required`: `true` or `false` 
- `default`: a default value, if the variable is not required

These are fully typed, so it won't let you do silly things like specifying a default value for required variables (or vice versa). 

### Validation

It is valuable to detect a misconfigured environment and notify the programmer, and it's even better to do so early in the run cycle. To this aim, `configure` does this validation immediately when it is called.
If there is a problem, `configure` outputs to the `console` an easy-to-understand error message:
```
Environmental variable errors!
Missing environment variable "DB_URL"
Description: A connection to the database, eg. sqlite3://localhost:3495

Missing environment variable "PORT"
Description: Port to listen for HTTP requests
...
```
This output is followed by a complete "help text" that describes all the variables.

### Access
Access the variables in `envs` (not `process.env`), as this will be correctly typed:

```ts
const hostName: string  = envs.hostname
const dbUrl:    string  = envs.db_url
const port:     number  = envs.port
const verbose:  boolean = envs.verbose
```
There are a few improvements to `process.env`:
- In Typescript, variables are of the specified type
- Variable name are automatically converted to uppercase before extraction from `process.env`. For example, `envs.hostname` will grab the value of `process.env.HOSTNAME`. Javascript code does not need to have bulky upper-cased strings uglifying the code (although you are free to use uppercase if you prefer). 
- If the variable _is not required_ and missing, the default value will be returned.
- If the variable _is required_ and missing, or of the wrong type, an exception will be thrown. Without this library, these cases go undetected or errors pop up at odd times, perhaps when handling a web request in the middle of the night.

## Advanced Features

The one function, `configure`, above, is all the API that is needed to access your validated, typed environment variables! 

### `envs`

The `envs` object returned from `configure` has a few bonus, non-iterable properties.

#### `envs.helpText: string`

`envs.helpText` describes all of the variables, based on the configuration. This is used for the error message above, but you might want to include it in other help information or documentation. It looks like (although, obviously, varies depending on the variables):

    E N V I R O N M E N T   V A R I A B L E S
    
    Required environment variables:
    DB_URL        A connection to the database, eg. sqlite3://localhost:3495
    PORT          Port to listen for HTTP requests
    
    Optional environment variables [default value]:
    HOSTNAME      Hostname to be reflected in logs ["www.example.com"]

#### `envs.dotEnvExample: string`

Similar to the help text, this outputs a template example `.env` file for usage with libraries that follow that convention (or Node >= 20). This may be useful if you are retrofitting an existing codebase without such a file. You'll have to call this explicitly to create the file.

#### `envsValid(): boolean`

If you want to do validation elsewhere, or in more detail, default validation can be suppressed, and then validation done manually:

1. Turn off the default validation by passing `{ validate: false }` as a second parameter to `configure`.

2. Call `envs.envsValid()`. This method returns `true` if the all the variables are set, and `false` if not. 

3. Explain the problem to the user by looking at `envs.errors`, an array of error messages:
```ts
const envs = configure({...}, {validate: false})
if (!envs.envsValid())
  // do something with envs.errors
  process.exit(1)
```

#### `env.errors: Array<string>`

`env.errors` is an array of strings describing the errors. This is accessed automatically in default validation, but is available for any other usage.

### Metadata

In addition the the `description`, `type` and `name`, metadata may also include a validation function, `valid()`. It will be called after the value is found and coerced to the correct type, but before the value is returned. This can check the value of an integer is in a certain range, or run a regular expression to pre-check a URL or similar. Or perhaps verify that passwords are not being provided in database configuration strings. Or perhaps check the integrity between multiple environment variables. This function should return `true` or `false`.

## In Closing...
### Off-Label Usage

There's nothing about this library that will prevent one from using multiple instances. This is not recommended. 

If you're creating a Typescript library, I strongly advise you **not** to use ENVs, and instead make an explicit configuration mechanism, allowing the host to set configs explicitly. Piggy-backing on the host applications ENVs is not only a misplacement of responsibilities, it can also be quite hard for developers to untangle.

### Non-Features
This library does not aim to:
- Create some sort of hierarchy out of your environment variables, based on their names.
- Allow you to create aliases of environment variables, so they have multiple names.
- Parse complex values, like XML or JSON, included within environment variables.
- Reading alternate `.env` files, like `dotenv`. Just use that library.
- Use some third-party schema definitions, like zod or joi. (We're Typescript only!)

If you want some of those features...

### Similar Projects (if you don't like this one)

- https://www.npmjs.com/package/znv: Parses using zod types. 
- https://www.npmjs.com/package/env-var: Verification, sanitization, and type coercion for environment variables in Node.js and web applications. Supports TypeScript! Somewhat deeper features, but slightly fussier syntax. 
- https://www.npmjs.com/package/@sadams/environment: Similar, with custom parsers.
- https://www.npmjs.com/package/chickenv: Detects missing variables
- https://www.npmjs.com/package/common-env: Lots of options. Aliases?
- https://www.npmjs.com/package/@trenskow/config: Infers a hierarchy, and has a little bit of validation
- https://www.npmjs.com/package/castenv: Casts process.env variables directly, based on heuristics
- https://www.npmjs.com/package/@tonbul/env-parser: explicit conversion functions
- https://www.npmjs.com/package/getenv2: Uses joi for types, and also defaults per environment
- https://www.npmjs.com/package/strict-env-conf: Similar motivation; builds hierarchy of values
- https://www.npmjs.com/package/safe-env-vars: Verification build on `get`.

## CONTRIBUTING

Of course! Standard conventions apply.

## NOTES

- Created package using https://medium.com/cameron-nokes/the-30-second-guide-to-publishing-a-typescript-package-to-npm-89d93ff7bccd

## TODOs

- (Maybe) Support "coercion" function, so complex values, like JSON, or encoded values can be used. I'd need to do this in a type-safe way.
