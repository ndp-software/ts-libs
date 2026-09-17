/** Describes the visible queue after a mutation. */
export type RiggedQueueChangeEvent<T> = {
  added: T[]
  removed: T[]
  items: T[]
}

export type RiggedQueueChangeListener<T> = (event: RiggedQueueChangeEvent<T>) => void

/**
 * A bounded queue with pinned items and an evictable pool.
 *
 * Pinned items always remain ahead of pool entries. Pool entries are evicted
 * when the visible queue exceeds maxSize, with recently used entries protected.
 */
export class RiggedQueue<T> {
  private readonly maxSize: number
  private pinnedItems: Set<T>
  private items: Array<T> = []
  private view: Array<T> = []
  private usages: Array<T> = []
  private readonly listeners: Set<RiggedQueueChangeListener<T>> = new Set()
  private dirty: boolean = true

  constructor(
    maxSize: number,
    pinnedItems: Iterable<T>,
    pool: Iterable<T> = []) {
    this.maxSize = maxSize
    const initialPinned = [...pinnedItems]
    this.pinnedItems = new Set(initialPinned)
    this.items = [...this.pinnedItems, ...[...pool].filter(item => !this.pinnedItems.has(item))]
  }

  // Register a listener that fires after each effective mutation. Pinning and
  // unpinning can emit an event even when the visible order is unchanged.
  // Returns an unsubscribe function.
  onChange(listener: RiggedQueueChangeListener<T>): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  // Add items at the front of the pool, prioritizing them over existing pool items.
  add(...moreItems: T[]) {
    const before = this.snapshot().slice()
    let changed = false
    for (let i = moreItems.length - 1; i >= 0; --i)
      changed = this.addOne(moreItems[i]) || changed
    this.notifyChange(before, changed)
  }

  remove(item: T): boolean {
    const before = this.snapshot().slice()
    const index = this.items.indexOf(item)
    if (index === -1) return false

    this.pinnedItems.delete(item)
    this.items.splice(index, 1)
    this.usages = this.usages.filter(used => used !== item)
    this.dirty = true
    this.notifyChange(before)
    return true
  }

  /** Promote one or more items to pinned status. */
  pin(...items: T[]) {
    const before = this.snapshot().slice()
    let changed = false
    for (const item of items) {
      if (!this.pinnedItems.has(item)) {
        this.pinnedItems.add(item)
        changed = true
      }
      if (!this.items.includes(item)) {
        this.addAfterPinned(item)
        changed = true
      }
    }
    if (changed) this.dirty = true
    this.notifyChange(before, changed)
  }

  /** Demote one or more pinned items back to the pool without removing them. */
  unpin(...items: T[]) {
    const before = this.snapshot().slice()
    let changed = false
    for (const item of items) {
      if (!this.pinnedItems.delete(item)) continue
      changed = true
      this.use(item)
      if (!this.items.includes(item))
        this.addAfterPinned(item)
      this.dirty = true
    }
    this.notifyChange(before, changed)
  }

  private addOne(item: T): boolean {
    if (this.pinnedItems.has(item)) return false // Pinned items are already at the front of the list.

    this.use(item)
    if (this.items.includes(item)) return false

    this.dirty = true
    this.addAfterPinned(item)
    return true
  }

  private addAfterPinned(item: T) {
    for (let i = Math.max(0, this.pinnedItems.size - 1); i < this.items.length; ++i)
      if (!this.pinnedItems.has(this.items[i])) {
        this.items.splice(i, 0, item)
        return
      }
    this.items.unshift(item)
  }

  // Record usage of a pool item, protecting it from eviction.
  use(item: T) {
    this.usages.unshift(item)
  }

  /** Number of visible pinned items and pool entries. */
  get size(): number {
    return this.snapshot().length
  }

  /** Whether an item is currently visible in the queue. */
  has(item: T): boolean {
    return this.snapshot().includes(item)
  }

  /** Iterate over the current visible order without exposing mutable state. */
  values(): IterableIterator<T> {
    return this.snapshot()[Symbol.iterator]()
  }

  [Symbol.iterator](): IterableIterator<T> {
    return this.values()
  }

  snapshot(): T[] {
    if (this.dirty)
      this.calculateItems()
    return this.view
  }

  private calculateItems(): void {
    const numberOfItemsToRemove = Math.max(0, this.items.length - Math.max(this.maxSize, this.pinnedItems.size))
    if (numberOfItemsToRemove == 0) {
      this.dirty = false
      this.view = Object.freeze(this.items.slice()) as T[]
      return
    }


    const removing = this.items
      .filter(item => !this.pinnedItems.has(item))
      .sort((a, b) => {
        const aUsageIndex = this.usages.indexOf(a)
        const bUsageIndex = this.usages.indexOf(b)

        if (aUsageIndex === -1 && bUsageIndex !== -1) return 1
        if (aUsageIndex !== -1 && bUsageIndex === -1) return -1
        if (aUsageIndex >= 0 && bUsageIndex >= 0)
          return aUsageIndex - bUsageIndex

        const aIndex = this.items.indexOf(a)
        const bIndex = this.items.indexOf(b)
        return aIndex - bIndex
      })
      .reverse()
      .slice(0, numberOfItemsToRemove)

    for (let i of removing)
      this.items.splice(this.items.indexOf(i), 1)
    this.usages = this.usages.filter(item => this.items.includes(item))

    this.dirty = false
    this.view = Object.freeze(this.items.slice()) as T[]
  }

  private notifyChange(before: T[], force = false): void {
    if (this.listeners.size === 0) return
    const after = this.snapshot()
    const beforeSet = new Set(before)
    const afterSet = new Set(after)
    const added = after.filter(x => !beforeSet.has(x))
    const removed = before.filter(x => !afterSet.has(x))
    if (!force && added.length === 0 && removed.length === 0) return
    const event: RiggedQueueChangeEvent<T> = {
      added: Object.freeze(added) as T[],
      removed: Object.freeze(removed) as T[],
      items: after
    }
    for (const listener of Array.from(this.listeners)) {
      try {
        listener(event)
      } catch { /* swallow listener errors */
      }
    }
  }
}
