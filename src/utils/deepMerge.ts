import { isObject } from '../services/store'

function deepMerge(...items: unknown[]): unknown {
  return items.reduce((prev, next) => {
    if (isObject(prev) && isObject(next)) {
      return next
        ? Object.keys(next as object).reduce((merged, key) => {
            const prevChildValue = (prev as Record<string, unknown>)[key]
            const nextChildValue = (next as Record<string, unknown>)[key]
            let mergedValue: unknown
            if (isObject(prevChildValue) && isObject(nextChildValue)) {
              mergedValue = deepMerge(prevChildValue, nextChildValue)
            } else {
              mergedValue = nextChildValue
            }
            return { ...merged, [key]: mergedValue }
          }, prev as object)
        : prev
    } else {
      return next
    }
  }, {})
}

export default deepMerge
