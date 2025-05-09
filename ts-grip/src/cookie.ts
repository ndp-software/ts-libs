import {Grip} from "./grip";

/**
 * Creates a grip on a cookie with a default value.
 *
 * @param cookieName - The name of the cookie.
 * @param defawlt - The default value if the cookie does not exist.
 * @returns A new instance of a `Grip`.
 */
export function cookieGrip<T extends string>(
  cookieName: string,
  defawlt: T,
  settings: string = ';path=/;SameSite=Strict') {
  return new CookieGrip(cookieName, defawlt, settings);
}

/*
The CookieGrip class extends Grip and provides an implementation
of a grip backed by browser cookies. Assumes all values are strings.

Using strong typing should work well, but there's the risk
than an existing cookie will not conform to the type, and there
is no run-time type checking.

A `document` may be injected to facilitate testing.
 */
export class CookieGrip<T extends string> extends Grip<T> {
  private _testingDocument: Partial<Document> | null = null

  constructor(private readonly name: string,
              private readonly defawlt: T,
              private readonly settings: string = ';path=/;SameSite=Strict') {
    super()
  }

  get value() {
    return (this.readCookie(this.name) ?? this.defawlt) as T
  }

  set(newValue: T) {
    this.document().cookie = this.name + '=' + newValue + this.settings
    return newValue
  }


  private readCookie(name: string): string | null {
    const nameEQ = name + '='
    const cookies: string | undefined = this.document().cookie
    if (!cookies) return null

    const ca = cookies.split(';')
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i]
      while (c.charAt(0) === ' ') c = c.substring(1, c.length)
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
    }
    return null
  }

  // For testing...
  setDocument(d: Partial<Document>) {
    this._testingDocument = d
  }
  private document(): Partial<Document> {
    return this._testingDocument ?? window.document
  }
}