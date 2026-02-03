---
title: MobX Tips and Tricks
type: efficiency
impact: MEDIUM
impactDescription: practical patterns and utilities for working with MobX
tags: mobx, tojs, tips, tricks, utilities, patterns
---

# MobX Tips and Tricks

**Impact: MEDIUM** - practical patterns and utilities for working with MobX

Collection of useful patterns and utilities when working with MobX in React applications.

## toJS

Use `toJS` to convert observable objects/arrays to plain JavaScript. Useful when passing data to external libraries or APIs.

### External Libraries

```tsx
import { toJS } from 'mobx'

const ChartComponent = observer(() => {
  const { dataStore } = useRootStore()

  return (
    <Recharts
      // Convert to plain JS for external libraries
      data={toJS(dataStore.chartData)}
    />
  )
})
```

### Export/Download

```tsx
const ExportButton = observer(() => {
  const { dataStore } = useRootStore()

  const handleExport = () => {
    const plainData = toJS(dataStore.items)
    const csv = convertToCSV(plainData)
    downloadCSV(csv)
  }

  return <button onClick={handleExport}>Export CSV</button>
})
```

## Working with Arrays

### Replace vs Mutate

```tsx
// ✅ Good: Replace array reference
setItems(newItems) {
  this.items = newItems
}

// ✅ Good: Mutate with array methods
addItem(item) {
  this.items.push(item)
}

removeItem(id) {
  const index = this.items.findIndex(i => i.id === id)
  if (index !== -1) {
    this.items.splice(index, 1)
  }
}
```

### Sort/Filter without breaking reactivity

```tsx
get sortedItems() {
  // Create new array to avoid mutating original
  return [...this.items].sort((a, b) => a.name.localeCompare(b.name))
}
```

## Working with Objects

### Dynamic Properties

```tsx
import { makeAutoObservable, observable } from 'mobx'

class DynamicStore {
  data: Record<string, any> = {}

  constructor() {
    makeAutoObservable(this)
  }

  setValue(key: string, value: any) {
    this.data[key] = value
  }

  // Use observable.map for better performance with dynamic keys
  mapData = observable.map<string, any>()

  setMapValue(key: string, value: any) {
    this.mapData.set(key, value)
  }
}
```

## Reference

- [MobX toJS](https://mobx.js.org/api.html#tojs)
- [MobX Observable Map](https://mobx.js.org/api.html#observablemap)
- [MobX Collections](https://mobx.js.org/collections.html)
