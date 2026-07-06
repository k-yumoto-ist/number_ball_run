export class SeededRandom {
  private state: number

  constructor(seed: number) {
    this.state = seed >>> 0 || 1
  }

  next() {
    this.state = (this.state * 1664525 + 1013904223) >>> 0
    return this.state / 0x100000000
  }

  range(min: number, max: number) {
    return min + (max - min) * this.next()
  }

  integer(min: number, max: number) {
    return Math.floor(this.range(min, max + 1))
  }

  pick<T>(items: T[]) {
    return items[Math.floor(this.next() * items.length)]
  }

  weightedPick<T>(items: T[], weight: (item: T) => number) {
    const total = items.reduce((sum, item) => sum + Math.max(0, weight(item)), 0)
    if (total <= 0) {
      return this.pick(items)
    }
    let cursor = this.next() * total
    for (const item of items) {
      cursor -= Math.max(0, weight(item))
      if (cursor <= 0) {
        return item
      }
    }
    return items[items.length - 1]
  }

  getState() {
    return this.state
  }
}

export function createRunSeed() {
  return (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0
}
