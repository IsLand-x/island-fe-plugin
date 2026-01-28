---
title: Manage Component-Scoped State with MobX
type: capability
impact: HIGH
impactDescription: use useLocalStore for any component-local state instead of useState
tags: mobx, useLocalStore, component-state, form-state, local-state, react-hooks
---

# Manage Component-Scoped State with MobX

**Impact: HIGH** - use `useLocalStore` for any component-local state instead of `useState`

Use `useLocalStore` from `mobx-react-lite` to manage component-local state. It combines state, computed values, and actions in one place with better performance than multiple `useState` hooks.

## Example

```tsx
import { observer, useLocalStore } from 'mobx-react-lite'

const Counter = observer(() => {
  const state = useLocalStore(() => ({
    count: 0,
    get doubled() {
      return this.count * 2
    },
    increment() {
      this.count++
    },
  }))

  return (
    <button onClick={state.increment}>
      {state.count} x 2 = {state.doubled}
    </button>
  )
})

export default Counter;
```

## Do NOT Use

```tsx
// ❌ Multiple useState hooks with useMemo
const Counter = () => {
  const [count, setCount] = useState(0)
  const doubled = useMemo(() => count * 2, [count])

  return (
    <button onClick={() => setCount(c => c + 1)}>
      {count} x 2 = {doubled}
    </button>
  )
}
```

## When to Use

| Scenario            | Recommendation  |
| ------------------- | --------------- |
| Any component state | `useLocalStore` |
