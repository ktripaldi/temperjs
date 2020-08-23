function compare(a: unknown, b: unknown): boolean {
  if (a === b) return true

  if (a && b && typeof a === 'object' && typeof b === 'object') {
    if (a.constructor !== b.constructor) return false

    // tslint:disable-next-line:one-variable-per-declaration
    let length, i, keys
    if (Array.isArray(a) && Array.isArray(b)) {
      length = a.length
      if (length !== b.length) return false
      for (i = length; i-- !== 0; ) if (!compare(a[i], b[i])) return false
      return true
    }

    if (a instanceof Map && b instanceof Map) {
      if (a.size !== b.size) return false
      for (i of a.entries()) if (!b.has(i[0])) return false
      for (i of a.entries()) if (!compare(i[1], b.get(i[0]))) return false
      return true
    }

    if (a instanceof Set && b instanceof Set) {
      if (a.size !== b.size) return false
      for (i of a.entries()) if (!b.has(i[0])) return false
      return true
    }

    if (ArrayBuffer.isView(a) && ArrayBuffer.isView(b)) {
      length = (a as any).length
      if (length !== (b as any).length) return false
      for (i = length; i-- !== 0; )
        if ((a as any)[i] !== (b as any)[i]) return false
      return true
    }

    if (a.constructor === RegExp) {
      const a1 = a as Record<string, unknown>
      return a1.source === a1.source && a1.flags === a1.flags
    }
    if (a.valueOf !== Object.prototype.valueOf)
      return a.valueOf() === b.valueOf()
    if (a.toString !== Object.prototype.toString)
      return a.toString() === b.toString()

    keys = Object.keys(a)
    length = keys.length
    if (length !== Object.keys(b).length) return false

    for (i = length; i-- !== 0; )
      if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false

    for (i = length; i-- !== 0; ) {
      const key = keys[i]
      if (key === '_owner' && (a as Record<string, unknown>).$$typeof) {
        // React-specific: avoid traversing React elements' _owner.
        //  _owner contains circular references
        // and is not needed when comparing the actual elements (and not their owners)
        continue
      }
      if (!compare((a as any)[key], (b as any)[key])) return false
    }

    return true
  }

  // true if both NaN, false otherwise
  return a !== a && b !== b
}

export default compare
