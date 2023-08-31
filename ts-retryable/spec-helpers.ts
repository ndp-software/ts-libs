export function rejectNTimesThenResolve<T, E>(n: number, result: T, error: E) {
  return () => n-- > 0
    ? Promise.reject(error)
    : Promise.resolve(result)
}

export function asyncCycle(...actions: Array<string>): () => Promise<string> {
  let i = 0
  return () => {
    const a = actions[i++ % actions.length]
    return a.match(/throw/i) ? Promise.reject(a) : Promise.resolve(a);
  }
}

export function syncCycle(...actions: Array<string>) {
  let i = 0
  return () => {
    const a = actions[i++ % actions.length]
    if (a.match(/throw/i))
      throw a
    else
      return a
  }
}
