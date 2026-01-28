---
title: Standard File Structure
type: capability
impact: MEDIUM
impactDescription: enforce consistent patterns within single files
tags: mobx, file-structure, export, naming, component, props
---

# Standard File Structure

**Impact: MEDIUM** - enforce consistent patterns within single files

Define consistent patterns for organizing content within a single file. This includes export patterns, component definitions, props handling, and naming conventions.

## Rules

- **Default export**: Each component file / store file can only have 1 component, and must use default export.
- **Single component per file**: Each `.tsx` file can only contain one component
- **No props destructuring in parameters**: Do NOT destructure props in function parameters
- **Named exports for types**: Use named exports only for TypeScript types, interfaces, and secondary utilities
- **Consistent naming**: Follow naming conventions for files and exports

## Example

### Component File Pattern

```tsx
// components/UserCard.tsx
import { observer } from 'mobx-react-lite'

// ✅ Named export for props type
export type UserCardProps = {
  userId: string
  title: string
  onClick?: () => void
}

// ✅ Use props parameter directly, destructure in function body
const UserCard = observer<UserCardProps>((props) => {
  const { userId, title, onClick } = props

  return (
    <div onClick={onClick}>
      <h3>{title}</h3>
      <p>ID: {userId}</p>
    </div>
  )
})

// ✅ Default export for the component
export default UserCard
```

### Store File Pattern

```tsx
// stores/user-store.ts
import { makeAutoObservable } from 'mobx'
import type { RootStore } from './RootStore'

// ✅ Named export for types
export type User = {
  id: string
  name: string
}

// Store implementation
class UserStore {
  rootStore: RootStore
  users: User[] = []
  currentUser: User | null = null

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore
    makeAutoObservable(this, {}, { autoBind: true })
  }

  setCurrentUser(user: User) {
    this.currentUser = user
  }
}

// ✅ Default export for the store
export default UserStore
```

### RootStore Pattern

For cross-domain shared state (user info, permissions, general config), use the RootStore pattern from [separate-page-states-into-domain-stores](./separate-page-states-into-domain-stores.md).

```tsx
// stores/root-store.ts
import UserStore from './user-store'
import PermissionStore from './permission-store'
import ConfigStore from './config-store'
import type { DepsStore } from './deps-store'

export class RootStore {
  depsStore: DepsStore

  // Domain stores
  userStore: UserStore
  permissionStore: PermissionStore
  configStore: ConfigStore

  constructor(depsStore: DepsStore) {
    this.depsStore = depsStore

    // Instantiate all domain stores with rootStore reference
    this.userStore = new UserStore(this)
    this.permissionStore = new PermissionStore(this)
    this.configStore = new ConfigStore(this)
  }

  // Coordinate initialization of all domain stores
  init = async () => {
    await this.userStore.init()
    await this.permissionStore.init()
    await this.configStore.init()
  }
}

export default RootStore
```

**Key patterns for RootStore:**

| Pattern             | Implementation                                          |
| ------------------- | ------------------------------------------------------- |
| Shared user info    | `this.rootStore.userStore.currentUser`                  |
| Shared permissions  | `this.rootStore.permissionStore.hasPermission('admin')` |
| Shared config       | `this.rootStore.configStore.apiBaseUrl`                 |
| Cross-store actions | Call `rootStore.otherStore.action()`                    |

## Do NOT Use

```tsx
// ❌ Named export only (no default)
export class UserStore { /* ... */ }

// ❌ Destructure props in function parameters
const UserCard = ({ userId, title }: UserCardProps) => {
  // Avoid: destructuring in parameter makes it hard to track MobX observables
  return <div>{title}</div>
}

// ❌ Export component using named export.
export const UserCard = ({ userId, title }: UserCardProps) => {
  // Avoid: destructuring in parameter makes it hard to track MobX observables
  return <div>{title}</div>
}


// ❌ Multiple components in one file
const Header = () => <header>...</header>
const Footer = () => <footer>...</footer>

const Layout = () => (
  <>
    <Header />
    <main>...</main>
    <Footer />
  </>
)

export default Layout

// ❌ Mixed export styles in same project
// File A: export default class StoreA {}
// File B: export class StoreB {}
```

## Naming Conventions

| Element                     | Convention                  | Example                |
| --------------------------- | --------------------------- | ---------------------- |
| Component files             | PascalCase + component name | `UserCard.tsx`         |
| Store files                 | kebab-case + store suffix   | `user-store.ts`        |
| RootStore file              | kebab-case                  | `root-store.ts`        |
| DepsStore file              | kebab-case                  | `deps-store.ts`        |
| Component classes/functions | PascalCase                  | `const UserCard = ...` |
| Store classes               | PascalCase                  | `class UserStore {}`   |
| Props types                 | PascalCase + Props suffix   | `UserCardProps`        |

## When to Use

| Scenario                  | Recommendation                                 |
| ------------------------- | ---------------------------------------------- |
| Creating new component    | Single default export + named Props type       |
| Creating new store        | Single default export + named types            |
| Creating RootStore        | Centralize all domain stores + coordinate init |
| Cross-domain shared state | Access via `rootStore.xxxStore`                |
| Exporting utilities       | Named exports allowed in utility files         |

## Migration Guide

When refactoring existing code:

```tsx
// Before refactoring
export const UserCard: FC<UserCardProps> = ({ userId }) => {
  // ...
}

// After refactoring
export type UserCardProps = { userId: string }

const UserCard: FC<UserCardProps> = (props) => {
  const { userId } = props
  // ...
}

export default UserCard
```
