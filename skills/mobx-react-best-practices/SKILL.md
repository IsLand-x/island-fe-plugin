---
name: mobx-react-best-practices
description: Personal opinionated best practices for MobX React state management, store patterns, and component optimization. This skill represents IsLand's personal coding standards and preferences. Triggers on tasks involving observable state, actions, reactions, store design, or observer components.
---

# MobX React Best Practices (Opinionated)

**Personal opinionated standards by IsLand. Before codegen / review / architecture design, MUST LOAD AND FOLLOW ALL THE REFERENCES.**

## Requirements

This skill is designed for **MobX 6+** with the following dependencies:

```json
{
  "mobx": "^6.0.0",
  "mobx-react-lite": "^3.0.0"
}
```

Rules in this skill assume the use of `makeAutoObservable()` API introduced in MobX 6. For MobX 5 projects using decorators (`@observable`, `@action`), these rules may not apply directly.

## Code Style Rules

| Rule                                                                         | Keywords                                     | When to Use                                                     |
| ---------------------------------------------------------------------------- | -------------------------------------------- | --------------------------------------------------------------- |
| [standard-directory-structure](./references/standard-directory-structure.md) | folder-structure, organization, architecture | When creating page-level feature / organizing project structure |
| [standard-file-structure](./references/standard-file-structure.md)           | file-structure, export, naming, props        | When writing new files or refactoring existing ones             |

## State Management Rules

| Rule                                                                                               | Keywords                                         | When to Use                                                              |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------ |
| [always-use-observer](./references/always-use-observer.md)                                         | observer, mobx-react-lite, render optimization   | When creating or reviewing React components that access observable state |
| [manage-component-scoped-state](./references/manage-component-scoped-state.md)                     | useLocalStore, component state, form state       | When managing complex local component state (forms, temporary UI state)  |
| [separate-page-states-into-domain-stores](./references/separate-page-states-into-domain-stores.md) | domain store, ui store, root store, architecture | When designing store architecture or refactoring page-level state        |
| [action-bound-this](./references/action-bound-this.md)                                             | action.bound, arrow function, this context       | When defining store actions that reference `this`                        |
| [computed-derived-state](./references/computed-derived-state.md)                                   | computed, memoization, derived data              | When creating derived values from observables (caching, performance)     |
| [cleanup-reactions](./references/cleanup-reactions.md)                                             | autorun, reaction, dispose, useEffect            | When using autorun, reaction, or other MobX subscriptions                |
| [async-run-in-action](./references/async-run-in-action.md)                                         | runInAction, flow, async/await, generator        | When implementing async operations in stores                             |
| [mobx-tips-and-tricks](./references/mobx-tips-and-tricks.md)                                       | toJS, tips, utilities, patterns                  | When working with MobX utilities, serialization, or advanced patterns    |

## Technical Selection Rules

| Library / Approach                                   | Keywords                         | When to Use                                                                  |
| ---------------------------------------------------- | -------------------------------- | ---------------------------------------------------------------------------- |
| [nice-modal-react](./references/nice-modal-react.md) | modal, dialog, drawer, sidesheet | When implementing modal, dialog, drawer, or any toggle-able popup components |
