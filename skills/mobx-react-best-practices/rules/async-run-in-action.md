---
title: Async Run In Action
type: capability
impact: HIGH
impactDescription: properly handle async operations in MobX actions
tags: mobx, async, runInAction, generator, action
---

# Async Run In Action

**Impact: HIGH** - properly handle async operations in MobX actions

When modifying observable state after an async operation (like an API call), wrap the state mutation in `runInAction` to ensure changes are properly tracked.

## Rules

- **After await**: Always wrap state mutations after `await` in `runInAction`
- **autoBind**: Use `runInAction` when `autoBind: true` is enabled

## Example

### Using runInAction

```tsx
class UserStore {
  users: User[] = []
  isLoading = false
  error: string | null = null

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true })
  }

  async loadUsers() {
    this.isLoading = true
    this.error = null

    try {
      const users = await api.fetchUsers()
      // Must wrap in runInAction after await
      runInAction(() => {
        this.users = users
        this.isLoading = false
      })
    } catch (err) {
      runInAction(() => {
        this.error = err.message
        this.isLoading = false
      })
    }
  }

  async updateUser(id: string, data: Partial<User>) {
    const updated = await api.updateUser(id, data)
    runInAction(() => {
      const index = this.users.findIndex(u => u.id === id)
      if (index !== -1) {
        this.users[index] = updated
      }
    })
  }
}
```

## Do NOT Use

```tsx
// ❌ Modifying state after await without runInAction
class UserStore {
  async loadUsers() {
    this.isLoading = true
    const users = await api.fetchUsers()
    this.users = users // Wrong! Outside action after await
    this.isLoading = false
  }
}

// ❌ Using async/await with flow
class TodoStore {
  loadTodos = flow(async function* () {
    // Wrong! flow doesn't work with async
    const todos = await api.fetchTodos()
  })
}

// ❌ Multiple runInAction calls unnecessarily
async loadData() {
  const data = await api.fetchData()
  runInAction(() => { this.a = data.a })
  runInAction(() => { this.b = data.b })
  runInAction(() => { this.c = data.c })
  // Better: single runInAction for all mutations
}
```

## When to Use

| Scenario                          | Recommendation                     |
| --------------------------------- | ---------------------------------- |
| Async action with single mutation | `runInAction` after await          |
| Error handling needed             | `runInAction` in catch block       |
| autoBind enabled                  | `runInAction` required after await |

## Reference

- [MobX Async Actions](https://mobx.js.org/actions.html#asynchronous-actions)
- [runInAction API](https://mobx.js.org/api.html#runinaction)