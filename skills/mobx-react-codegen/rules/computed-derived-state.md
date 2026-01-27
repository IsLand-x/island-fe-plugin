---
title: Computed Derived State
type: capability
impact: MEDIUM
impactDescription: use computed for derived values that depend on observable state
tags: mobx, computed, derived-state, memoization, performance
---

# Computed Derived State

**Impact: MEDIUM** - use `computed` for derived values that depend on observable state

Use `get` computed properties for values that are derived from observable state. Computed values are automatically cached and only recalculate when their dependencies change.

## Rules

- **Pure functions**: Computed getters should be pure - no side effects
- **Derived data only**: Use for values that can be calculated from existing state
- **Avoid overuse**: Don't use computed for simple property access

## Example

### Basic Computed

```tsx
class TodoStore {
  todos: Todo[] = []
  filter: 'all' | 'active' | 'completed' = 'all'

  constructor() {
    makeAutoObservable(this)
  }

  get filteredTodos() {
    switch (this.filter) {
      case 'active':
        return this.todos.filter(t => !t.completed)
      case 'completed':
        return this.todos.filter(t => t.completed)
      default:
        return this.todos
    }
  }

  get stats() {
    const completed = this.todos.filter(t => t.completed).length
    return {
      total: this.todos.length,
      completed,
      active: this.todos.length - completed
    }
  }

  get completionRate() {
    if (this.stats.total === 0) return 0
    return this.stats.completed / this.stats.total
  }
}
```

### Computed with Transformations

```tsx
class UserStore {
  users: User[] = []
  sortBy: 'name' | 'date' = 'name'

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true })
  }

  get sortedUsers() {
    const sorted = [...this.users]
    if (this.sortBy === 'name') {
      sorted.sort((a, b) => a.name.localeCompare(b.name))
    } else {
      sorted.sort((a, b) => b.createdAt - a.createdAt)
    }
    return sorted
  }

  get usersById() {
    const map = new Map<string, User>()
    this.users.forEach(user => map.set(user.id, user))
    return map
  }
}
```

## Do NOT Use

```tsx
// ❌ Side effects in computed
get saveToLocalStorage() {
  localStorage.setItem('todos', JSON.stringify(this.todos)) // Side effect!
  return this.todos
}

// ❌ Simple property access (unnecessary computed)
get todoCount() {
  return this.todos.length // Just use todos.length directly
}

// ❌ Mutating state in computed
get normalizedTodos() {
  this.todos.forEach(t => t.text = t.text.trim()) // Mutation!
  return this.todos
}
```

## When to Use

| Scenario | Recommendation |
|----------|---------------|
| Filtering/sorting lists | Use computed |
| Calculating aggregates (sum, count) | Use computed |
| Transforming data format | Use computed |
| Simple property access | Access directly |
| Side effects needed | Use reaction or autorun |

## Reference

- [MobX Computed Values](https://mobx.js.org/computeds.html)
- [Computed with Options](https://mobx.js.org/computeds.html#computed-options)
