---
title: Standard Directory Structure
type: capability
impact: MEDIUM
impactDescription: define project-level directory organization
tags: mobx, directory-structure, folder-structure, architecture, pages
---

# Standard Directory Structure

**Impact: MEDIUM** - define project-level directory organization

Establish a consistent directory hierarchy that separates project-level shared resources from page-specific code. Pages are organized by business domain first, then by page type.

## Rules

- **Project-level shared resources**: Place in `src/components/`, `src/utils/`, `src/hooks/`
- **Global cross-domain stores**: Place in `src/global-store/` following [manage-component-scoped-state](./manage-component-scoped-state.md) practices for shared state like user info, permissions, and general config
- **Pages by domain**: Group pages under `src/pages/{domain}/` (e.g., `strategy/`, `function/`, `budget/`)
- **Pages by type**: Within each domain, create subfolders for page types (e.g., `list/`, `detail/`, `ticket/`)
- **Page self-contained**: Each page folder contains its own `index.tsx`, `stores/`, `components/`, `utils/`, `consts/`
- **Store organization**: Page stores follow the RootStore pattern with `index.ts` (glue layer), `root.ts` (RootStore), and domain stores

## Example

### Project Structure

```text
src/
├── components/                 # Project-level shared components
│   ├── CommonTable/
│   ├── SearchForm/
│   └── PageHeader/
├── global-store/               # Global cross-domain stores (RootStore pattern)
│   ├── index.tsx               # Glue layer: Context + helper hooks
│   ├── root-store.ts           # RootStore coordinating all global stores
│   ├── deps-store.ts           # External dependencies (router, etc.)
│   ├── user-store.ts           # Global user info store
│   ├── permission-store.ts     # Global permission store
│   └── config-store.ts         # Global config store
├── hooks/                      # Project-level shared hooks
│   ├── usePermission.ts
│   └── useDebounce.ts
├── utils/                      # Project-level shared utilities
│   ├── request.ts
│   ├── format.ts
│   └── validator.ts
└── pages/                      # Page modules organized by domain
    ├── Strategy/               # Strategy domain (PascalCase)
    │   ├── List/               # Strategy list page (PascalCase)
    │   │   ├── index.tsx       # Page entry
    │   │   ├── consts/         # Page constants
    │   │   ├── utils/          # Page utilities
    │   │   ├── components/     # Page-specific components
    │   │   │   ├── StrategyCard/
    │   │   │   └── StrategyFilter/
    │   │   └── stores/         # Page stores (RootStore pattern)
    │   │       ├── index.tsx   # Glue layer: Context + helper hooks
    │   │       ├── root.ts     # RootStore
    │   │       ├── strategy-list-store.ts    # Domain store (kebab-case)
    │   │       └── strategy-filter-store.ts  # Domain store (kebab-case)
    │   ├── Detail/             # Strategy detail page (PascalCase)
    │   │   ├── index.tsx
    │   │   ├── components/
    │   │   └── stores/
    │   └── Ticket/             # Strategy ticket page (PascalCase)
    │       ├── index.tsx
    │       ├── components/
    │       └── stores/
    ├── Function/               # Function domain (PascalCase)
    │   ├── List/
    │   ├── Detail/
    │   └── Ticket/
    └── Budget/                 # Budget control domain (PascalCase)
        ├── List/
        ├── Detail/
        └── Ticket/
```

### Global Store Structure

Global stores in `src/global-store/` follow the same RootStore pattern as page stores, using [manage-component-scoped-state](./manage-component-scoped-state.md) practices for shared cross-domain state.

```tsx
// src/global-store/root-store.ts
export class RootStore {
  depsStore: DepsStore
  userStore: UserStore
  permissionStore: PermissionStore
  configStore: ConfigStore

  constructor(depsStore: DepsStore) {
    this.depsStore = depsStore
    this.userStore = new UserStore(this)
    this.permissionStore = new PermissionStore(this)
    this.configStore = new ConfigStore(this)
  }

  init = async () => {
    await Promise.all([
      this.userStore.init(),
      this.permissionStore.init(),
      this.configStore.init()
    ])
  }
}
```

```tsx
// src/global-store/index.tsx
export const GlobalStoreContext = createContext<RootStore | null>(null)

export const useGlobalStore = () => {
  const store = useContext(GlobalStoreContext)
  if (!store) throw new Error('Must be used within GlobalStoreProvider')
  return store
}

export const useUserStore = () => useGlobalStore().userStore
export const usePermissionStore = () => useGlobalStore().permissionStore
export const useConfigStore = () => useGlobalStore().configStore

export const GlobalStoreProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const store = useCreateGlobalStore() // Creates RootStore + calls init()
  return (
    <GlobalStoreContext.Provider value={store}>
      {children}
    </GlobalStoreContext.Provider>
  )
}
```

### Page Stores Structure

```tsx
// pages/Strategy/List/stores/index.tsx
// Glue layer - exports useCreateRootStore hook, RootStoreContext, and helper hooks
import { createContext, useContext, useState, useEffect } from 'react'
import { RootStore } from './root'
import { useCreateDepsStore } from './deps'

// Context for RootStore
export const RootStoreContext = createContext<RootStore | null>(null)

// Hook to access RootStore
export const useRootStore = () => {
  const store = useContext(RootStoreContext)
  if (!store) throw new Error('useRootStore must be used within RootStoreProvider')
  return store
}

// Simplified helper hooks for domain stores
export const useStrategyListStore = () => useRootStore().strategyListStore
export const useStrategyFilterStore = () => useRootStore().strategyFilterStore

// Factory hook to create and initialize RootStore
export const useCreateRootStore = () => {
  const depsStore = useCreateDepsStore()
  const [store] = useState(() => new RootStore(depsStore))

  useEffect(() => {
    store.init()
  }, [store])

  return store
}

```

```tsx
// pages/Strategy/List/stores/root.ts
import { makeAutoObservable } from 'mobx'
import { DepsStore } from './deps'
import { StrategyListStore } from './strategy-list-store'
import { StrategyFilterStore } from './strategy-filter-store'

export class RootStore {
  depsStore: DepsStore
  strategyListStore: StrategyListStore
  strategyFilterStore: StrategyFilterStore

  constructor(depsStore: DepsStore) {
    this.depsStore = depsStore
    this.strategyListStore = new StrategyListStore(this)
    this.strategyFilterStore = new StrategyFilterStore(this)
    makeAutoObservable(this, {}, { autoBind: true })
  }

  init = async () => {
    await Promise.all([
      this.strategyListStore.init(),
      this.strategyFilterStore.init()
    ])
  }
}
```

```tsx
// pages/Strategy/List/stores/strategy-list-store.ts
import { makeAutoObservable, runInAction } from 'mobx'
import type { RootStore } from './root'

export class StrategyListStore {
  rootStore: RootStore
  strategies: Strategy[] = []
  loading = false

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore
    makeAutoObservable(this, {}, { autoBind: true })
  }

  init = async () => {
    await this.loadStrategies()
  }

  loadStrategies = async () => {
    this.loading = true
    try {
      const data = await api.fetchStrategies()
      runInAction(() => {
        this.strategies = data
      })
    } finally {
      runInAction(() => {
        this.loading = false
      })
    }
  }
}
```

### Page Entry Pattern

```tsx
// pages/Strategy/List/index.tsx
import { observer } from 'mobx-react-lite'
import { RootStoreContext, useCreateRootStore } from './stores'
import { StrategyListHeader } from './components/StrategyListHeader'
import { StrategyTable } from './components/StrategyTable'

const StrategyListPage = observer(() => {
  const store = useCreateRootStore()

  return (
    <RootStoreContext.Provider value={store}>
      <div>
        <StrategyListHeader />
        <StrategyTable />
      </div>
    </RootStoreContext.Provider>
  )
})

export default StrategyListPage
```

## Do NOT Use

```text
❌ Flat pages structure
src/
├── pages/
│   ├── StrategyList.tsx
│   ├── StrategyDetail.tsx
│   ├── FunctionList.tsx
│   └── FunctionDetail.tsx

❌ Mixed domain and type
src/
├── pages/
│   ├── list/           # All list pages mixed
│   │   ├── StrategyList.tsx
│   │   └── FunctionList.tsx
│   └── detail/         # All detail pages mixed
│       ├── StrategyDetail.tsx
│       └── FunctionDetail.tsx

❌ Stores far from pages
src/
├── pages/
│   └── Strategy/
│       └── List.tsx
├── stores/             # Stores disconnected from pages
│   ├── Strategy/
│   └── Function/

❌ Shared code inside page folders
src/
├── pages/
│   └── Strategy/
│       └── List/
│           ├── components/
│           │   └── CommonTable/    # Should be project-level
│           └── utils/
│               └── request.ts      # Should be project-level
```

## Directory Conventions

| Directory | Purpose | Example |
| --------- | ------- | ------- |
| `src/components/` | Project-level shared components | `CommonTable`, `SearchForm` |
| `src/global-store/` | Global cross-domain stores (RootStore pattern) | `UserStore`, `PermissionStore` |
| `src/hooks/` | Project-level shared hooks | `usePermission`, `useDebounce` |
| `src/utils/` | Project-level shared utilities | `request.ts`, `format.ts` |
| `src/pages/{Domain}/` | Business domain modules (PascalCase) | `Strategy/`, `Function/` |
| `src/pages/{Domain}/{Page}/` | Specific page within domain (PascalCase) | `List/`, `Detail/`, `Ticket/` |
| `{page}/stores/` | Page-level stores with RootStore pattern | `index.ts`, `root.ts`, domain stores |
| `{page}/components/` | Page-specific components | `StrategyCard/`, `StrategyFilter/` |
| `{page}/utils/` | Page-specific utilities | `formatStrategyData.ts` |
| `{page}/consts/` | Page-specific constants | `STRATEGY_STATUS_MAP.ts` |

## Naming Conventions

| Element | Convention | Example | Rationale |
| --------- | ------- | ------- | --------- |
| Page files | PascalCase | `StrategyListPage.tsx` | Match component name for imports |
| Page components | PascalCase | `const StrategyListPage = ...` | React component convention |
| Store files | kebab-case | `strategy-list-store.ts` | Consistent with non-component files |
| Store classes | PascalCase + Store suffix | `class StrategyListStore {}` | Class naming convention |
| Utility files | kebab-case | `strategy-utils.ts` | Consistent with non-component files |
| Helper hooks | camelCase | `useStrategyListStore` | React hooks convention |
| Domain folders | PascalCase | `Strategy/List/` | Match route/page URLs visually |
| Barrel files | `index.ts` | `stores/index.ts` | Standard barrel export |

### Naming Rationale

**PascalCase for folders**: Domain/page folders use PascalCase to:
- Visually distinguish business domains in the file tree
- Match the component file names they contain
- Align with URL/route naming conventions

**kebab-case for non-component files**: Store/util files use kebab-case to:
- Clearly distinguish from React components (which use PascalCase)
- Follow TypeScript/JavaScript file naming best practices
- Avoid confusion when importing (class vs file name)

## When to Use

| Scenario | Location |
| --------- | -------- |
| Component used by multiple pages | `src/components/` |
| Component used only by one page | `pages/{Domain}/{Page}/components/` |
| Store shared across domains (user, permission, config) | `src/global-store/` |
| Store specific to one page | `pages/{Domain}/{Page}/stores/` |
| Utility used by multiple pages | `src/utils/` |
| Utility specific to one page | `pages/{Domain}/{Page}/utils/` |

## Reference

- [Separate Page States into Domain Stores](./separate-page-states-into-domain-stores.md)
- [Manage Component-Scoped State](./manage-component-scoped-state.md)
- [MobX Defining Data Stores](https://mobx.js.org/defining-data-stores.html)
