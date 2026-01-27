---
title: Separate Page States into Domain Stores
type: capability
impact: HIGH
impactDescription: organize page states into domain stores with RootStore pattern
tags: mobx, domain-store, root-store, architecture, store-pattern, dependency-injection
---

# Separate Page States into Domain Stores

**Impact: HIGH** - organize page states into domain stores with RootStore pattern

Create a `RootStore` that instantiates all domain stores. Use `DepsStore` to gather React hooks (router, params), and let RootStore coordinate initialization.

## Rules

- **DepsStore**: Use `useCreateDepsStore` to gather external state (useParams, useLocation, useHistory)
- **Async Init**: Every store has an `async init()` method
- **Root Coordination**: Domain stores don't call `init` directly; RootStore's `init` schedules all domain store initializations
- **Glue Layer**: `useCreateRootStore` creates deps, instantiates RootStore, and calls `rootStore.init()`
- **Helper Hooks**: Provide `useRootStore`, `useXxxStore()` for easy access

## Example

### 1. Define DepsStore

```tsx
// stores/deps.ts
import { useHistory, useParams, useLocation } from 'react-router'

export const useCreateDepsStore = () => {
  // List all the external states.
  const history = useHistory();
  const params = useParams();
  const location = useLocation();

  return useLocalStore((source) => ({
    get history(){
        return source.history;
    },
    get params(){
        return source.params;
    },
    get location(){
        return source.location;
    }
  }), {
    history,
    params,
    location
  })
}

export type DepsStore = ReturnType<typeof useCreateDepsStore>
```

### 2. Define Domain Stores

```tsx
// stores/UserStore.ts
export class UserStore {
  rootStore: RootStore
  users: User[] = []
  currentUser: User | null = null

  constructor(rootStore: RootStore) {
      this.rootStore = rootStore
      makeAutoObservable(this, {}, { autoBind: true })
  }

  // Domain store init - called by RootStore
  init = async () => {
    await this.loadCurrentUser()
  }

  async loadCurrentUser() {
    this.currentUser = await api.fetchCurrentUser()
  }

  goToProfile = (userId: string) => { // should use arrow function to bind this.
    // Access deps through rootStore
    this.rootStore.depsStore.history.push(`/users/${userId}`)
  }

  getTodosForUser = (userId: string) => {
    // Access other stores through rootStore
    return this.rootStore.todoStore.todos.filter(t => t.authorId === userId)
  }
}

// stores/TodoStore.ts
export class TodoStore {
  rootStore: RootStore
  todos: Todo[] = []

  constructor(rootStore: RootStore) {
      this.rootStore = rootStore
    makeAutoObservable(this, {}, { autoBind: true })
  }

  init = async () => {
    await this.loadTodos()
  }

   loadTodos = async () => {
    this.todos = await api.fetchTodos()
  }

  get currentUserTodos() {
    const userId = this.rootStore.userStore.currentUser?.id
    return userId ? this.todos.filter(t => t.authorId === userId) : []
  }

  get userIdFromParams() {
    // Access deps through rootStore
    return this.rootStore.depsStore.params.userId
  }
}
```

### 3. Define RootStore

```tsx
// stores/RootStore.ts
export class RootStore {
  depsStore: DepsStore
  userStore: UserStore
  todoStore: TodoStore

  constructor(depsStore: DepsStore) {
    this.depsStore = depsStore
    this.userStore = new UserStore(this)
    this.todoStore = new TodoStore(this)
    makeAutoObservable(this, {}, { autoBind: true })
  }

  // Root store coordinates all domain store initializations
  init = async () => {
    await this.userStore.init()
    await this.todoStore.init()
  }
}
```

### 4. Glue Layer Hook

```tsx
// stores/useCreateRootStore.ts
import { RootStore } from './RootStore'
import { useCreateDepsStore } from './DepsStore'

export const useCreateRootStore = () => {
  const depsStore = useCreateDepsStore()
  const [store] = useState(() => new RootStore(depsStore))

  useEffect(() => {
    store.init()
  }, [store])

  return store
}
```

### 5. Provide and Consume

```tsx
// stores/RootStoreContext.tsx
export const RootStoreContext = createContext<RootStore | null>(null)

export const useRootStore = () => {
  const store = useContext(RootStoreContext)
  if (!store) throw new Error('useRootStore must be used within RootStoreProvider')
  return store
}

// Helper hooks for domain stores
export const useUserStore = () => useRootStore().userStore
export const useTodoStore = () => useRootStore().todoStore
export const useDepsStore = () => useRootStore().depsStore

// App.tsx
const App = () => {
  const store = useCreateRootStore()

  return (
    <RootStoreContext.Provider value={store}>
      <Routes />
    </RootStoreContext.Provider>
  )
}
```

### 6. Use in Components

```tsx
// pages/UserProfile.tsx
const UserProfile = observer(() => {
  const userStore = useUserStore()

  if (!userStore.currentUser) return <Spinner /> // Dereference values late

  return (
    <div>
      <h1>{userStore.currentUser.name}</h1>
      <button onClick={() => goToProfile(userStore.currentUser.id)}>View Profile</button>
    </div>
  )
})

export default UserProfile
```

## Do NOT Use

```tsx
// ❌ Domain store calling init directly
const userStore = new UserStore(rootStore)
userStore.init() // Wrong - let RootStore coordinate

// ❌ Store importing hooks directly
class UserStore {
  params = useParams() // Wrong - use DepsStore
}

// ❌ Domain stores without init method
class TodoStore {
  constructor(rootStore: RootStore) {
    this.loadTodos() // Wrong - use async init
  }
}
```

## When to Use

| Scenario | Recommendation |
|----------|---------------|
| Store needs external state like router/hooks | Access via `rootStore.depsStore` |
| Store needs other stores | Access via `rootStore.xxxStore` |
| Store initialization | Implement `async init()` method |
| Init coordination | RootStore's `init` calls domain `init` |
| Unit testing | Create `new RootStore(mockDepsStore)` |

## Reference

- [MobX Defining Data Stores](https://mobx.js.org/defining-data-stores.html)
- [Combining Multiple Stores](https://mobx.js.org/defining-data-stores.html#combining-multiple-stores)
