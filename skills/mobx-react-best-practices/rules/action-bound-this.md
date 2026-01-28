---
title: Action Bound This
type: capability
impact: MEDIUM
impactDescription: properly bind this context in store actions
tags: mobx, action, this, bind, arrow-function, autoBind
---

# Action Bound This

**Impact: MEDIUM** - properly bind `this` context in store actions

Use `autoBind: true` in `makeAutoObservable` to automatically bind `this` for all actions, or use arrow functions for methods that need correct `this` context when passed as callbacks.

## Rules

- **Use autoBind**: Pass `{ autoBind: true }` as third argument to `makeAutoObservable`
- **Arrow functions**: Alternative approach for binding without `autoBind`
- **Destructuring caution**: Be careful when destructuring methods from store

## Example

### With autoBind (Recommended)

```tsx
import { makeAutoObservable } from 'mobx'

class UserStore {
  rootStore: RootStore
  users: User[] = []
  currentUser: User | null = null

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore
    makeAutoObservable(this, {}, { autoBind: true })
  }

  // Regular method - autoBind handles this
  setCurrentUser(user: User) {
    this.currentUser = user
  }

  // Can be passed as callback without binding
  handleClick = () => {
    this.setCurrentUser({ id: '1', name: 'John' })
  }
}
```

### With Arrow Functions

```tsx
import { makeAutoObservable } from 'mobx'

class TodoStore {
  todos: Todo[] = []

  constructor() {
    makeAutoObservable(this)
  }

  // Arrow function binds this automatically
  addTodo = (text: string) => {
    this.todos.push({ id: Date.now(), text, completed: false })
  }

  toggleTodo = (id: number) => {
    const todo = this.todos.find(t => t.id === id)
    if (todo) todo.completed = !todo.completed
  }
}
```

## Do NOT Use

```tsx
// ❌ Method loses this when destructured
class UserStore {
  constructor() {
    makeAutoObservable(this) // No autoBind
  }

  setUser(user: User) {
    this.user = user // this is undefined when destructured
  }
}

// In component - this will fail
const { setUser } = userStore
setUser(user) // Error: Cannot read property 'user' of undefined

// ❌ Manual binding in constructor (verbose)
class UserStore {
  constructor() {
    makeAutoObservable(this)
    this.setUser = this.setUser.bind(this)
  }
}
```

## When to Use

| Scenario                    | Recommendation                    |
| --------------------------- | --------------------------------- |
| Class store with methods    | Use `{ autoBind: true }`          |
| Need to destructure methods | Use `autoBind` or arrow functions |
| Method as event handler     | `autoBind` handles automatically  |
| Method passed to setTimeout | `autoBind` handles automatically  |

## Reference

- [MobX makeAutoObservable](https://mobx.js.org/observable-state.html#makeautoobservable)
- [MobX Actions](https://mobx.js.org/actions.html)
