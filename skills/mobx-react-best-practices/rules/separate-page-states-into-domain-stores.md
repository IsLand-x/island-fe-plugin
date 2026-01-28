---
title: Separate Page States into Domain Stores
type: capability
impact: HIGH
impactDescription: organize page states into domain stores with RootStore pattern
tags: mobx, domain-store, root-store, architecture, store-pattern, dependency-injection
---

## Separate Page States into Domain Stores

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

```ts
// src/pages/{Domain}/{Page}/stores/deps-store.ts
import { useHistory, useParams, useLocation } from 'react-router'
import { useLocalStore } from 'mobx-react-lite'

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

```ts
// src/pages/{Domain}/{Page}/stores/user-store.ts
import { makeAutoObservable, runInAction } from 'mobx'

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
    const user = await api.fetchCurrentUser()
    runInAction(() => {
      this.currentUser = user
    })
  }

  goToProfile = (userId: string) => {
    // Access deps through rootStore
    this.rootStore.depsStore.history.push(`/users/${userId}`)
  }

  getTodosForUser = (userId: string) => {
    // Access other stores through rootStore
    return this.rootStore.todoStore.todos.filter(t => t.authorId === userId)
  }
}

// stores/todo-store.ts
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

```ts
// src/pages/{Domain}/{Page}/stores/root-store.ts
import { makeAutoObservable } from 'mobx'

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

### 4. Glue Layer

```tsx
// src/pages/{Domain}/{Page}/stores/index.tsx
import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { observer } from 'mobx-react-lite'
import { RootStore } from './root-store'
import { useCreateDepsStore } from './deps-store'

export const useCreateRootStore = () => {
  const depsStore = useCreateDepsStore()
  const [store] = useState(() => new RootStore(depsStore))

  useEffect(() => {
    store.init()
  }, [store])

  return store
}

export const RootStoreContext = createContext<RootStore | null>(null)

/**
 * Provider component for RootStore
 */
export const RootStoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const store = useCreateRootStore()

  return (
    <RootStoreContext.Provider value={store}>
      {children}
    </RootStoreContext.Provider>
  )
}

export const useRootStore = () => {
  const store = useContext(RootStoreContext)
  if (!store) throw new Error('useRootStore must be used within RootStoreProvider')
  return store
}


export const useUserStore = () => useRootStore().userStore
export const useTodoStore = () => useRootStore().todoStore
export const useDepsStore = () => useRootStore().depsStore

```

### 5. Consume

```tsx
// src/pages/{Domain}/{Page}/index.tsx
import { observer } from 'mobx-react-lite'
import { RootStoreProvider } from './stores'

const PageContent = observer(() => {
  // Use store hooks here
  return (
    <div>
      {/** Business component */}
      <Header />
      <Body />
      <Footer />
    </div>
  )
})

export default function Page() {
  return (
    <RootStoreProvider>
      <PageContent />
    </RootStoreProvider>
  )
}
```

### 6. Use in Components

```tsx
// src/pages/{Domain}/{Page}/components/UserProfile.tsx
import { observer } from 'mobx-react-lite'
import { useUserStore } from '../stores'

const UserProfile = observer(() => {
  const userStore = useUserStore()

  if (!userStore.currentUser) return <Spinner /> // Dereference values late

  return (
    <div>
      <h1>{userStore.currentUser.name}</h1>
      <button onClick={() => userStore.goToProfile(userStore.currentUser!.id)}>
        View Profile
      </button>
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
| --------- | -------------- |
| Store needs external state like router/hooks | Access via `rootStore.depsStore` |
| Store needs other stores | Access via `rootStore.xxxStore` |
| Store initialization | Implement `async init()` method |
| Init coordination | RootStore's `init` calls domain `init` |
| Unit testing | Create `new RootStore(mockDepsStore)` |

## Reference

- [MobX Defining Data Stores](https://mobx.js.org/defining-data-stores.html)
- [Combining Multiple Stores](https://mobx.js.org/defining-data-stores.html#combining-multiple-stores)
