---
name: mobx-react-best-practices
description: MobX React best practices for state management, store patterns, and component optimization. This skill should be used when writing, reviewing, or refactoring React components that use MobX for state management. Triggers on tasks involving observable state, actions, reactions, store design, or observer components.
---

# Mobx React Codegen

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

| Rule | Keywords | Description |
| ---- | -------- | ----------- |
| [standard-directory-structure](./rules/standard-directory-structure.md) | folder-structure, organization, architecture | Define where to place stores in the project directory hierarchy |
| [standard-file-structure](./rules/standard-file-structure.md) | file-structure, export, naming, props | Define export patterns and code organization within single files |

## State Management Rules

| Rule | Keywords | Description |
| ---- | -------- | ----------- |
| [always-use-observer](./rules/always-use-observer.md) | observer, mobx-react-lite, render optimization | Wrap all components that use observable values with observer |
| [manage-component-scoped-state](./rules/manage-component-scoped-state.md) | useLocalStore, component state, form state | Manage complex component-local state with MobX (NOT for global stores) |
| [separate-page-states-into-domain-stores](./rules/separate-page-states-into-domain-stores.md) | domain store, ui store, root store, architecture | Separate domain data from page state in different stores |
| [action-bound-this](./rules/action-bound-this.md) | action.bound, arrow function, this context | Proper this binding in store actions |
| [computed-derived-state](./rules/computed-derived-state.md) | computed, memoization, derived data | Use computed for expensive derived values |
| [cleanup-reactions](./rules/cleanup-reactions.md) | autorun, reaction, dispose, useEffect | Always dispose reactions in useEffect cleanup |
| [async-run-in-action](./rules/async-run-in-action.md) | runInAction, flow, async/await, generator | Handle async operations properly |
| [mobx-tips-and-tricks](./rules/mobx-tips-and-tricks.md) | toJS, tips, utilities, patterns | Practical patterns and utilities for working with MobX |

## Reference

- [MobX Documentation](https://mobx.js.org/)
- [MobX React Integration](https://mobx.js.org/react-integration.html)
- [Optimizing React Renders](https://mobx.js.org/react-optimizations.html)
- [Defining Data Stores](https://mobx.js.org/defining-data-stores.html)
