---
title: Cleanup Reactions
type: capability
impact: HIGH
impactDescription: always use useAutorun and useReaction hooks in React components
tags: mobx, autorun, reaction, cleanup, hooks, useAutorun, useReaction
---

# Cleanup Reactions

**Impact: HIGH** - always use `useAutorun` and `useReaction` hooks in React components

In React components, never use `autorun` or `reaction` directly. Only use the custom hooks `useAutorun` and `useReaction` to ensure proper cleanup and prevent memory leaks.

## Rules

- **Only use custom hooks**: In React components, use only `useAutorun` and `useReaction`
- **Provide hooks**: If these hooks don't exist in the project, add them to `src/hooks/mobx.ts`
- **Never raw autorun/reaction**: Don't use `autorun` or `reaction` directly in components

## Required Hooks

Add these hooks to your project (e.g., `src/hooks/mobx.ts`):

```tsx
// src/hooks/mobx.ts
import { useEffect, useRef } from 'react'
import {
  autorun,
  reaction,
  type AutorunOptions,
  type ReactionOptions,
  type IReactionDisposer,
} from 'mobx'

// Use the same options type as MobX autorun
type AutorunEffect = Parameters<typeof autorun>[0]

export function useAutorun(
  fn: AutorunEffect,
  options?: AutorunOptions
): IReactionDisposer | void {
  const fnRef = useRef(fn)
  fnRef.current = fn

  useEffect(() => {
    const disposer = autorun(() => fnRef.current(), options)
    return () => disposer()
  }, [])
}

// Use the same parameter types as MobX reaction
type ReactionExpression<T> = () => T
type ReactionEffect<T> = (
  value: T,
  prevValue: T,
  disposer: IReactionDisposer
) => void

export function useReaction<T>(
  expression: ReactionExpression<T>,
  effect: ReactionEffect<T>,
  options?: ReactionOptions
): IReactionDisposer | void {

  useEffect(() => {
    const disposer = reaction(
      () => expression(),
      (value, prevValue, disposer) => effect(value, prevValue, disposer),
      options
    )
    return () => disposer()
  }, [])
}
```

## Important Constraints

The callback functions passed to `useAutorun` and `useReaction` **must only consume MobX observables**.
Do not access React state or props directly within these callbacks. Or the developer can makesure the clousure is desinated and is safe.

```tsx
// ✅ Correct: Only consume observables
useAutorun(() => {
  console.log(store.count)
})

// ❌ Wrong: Captures React state/props
useAutorun(() => {
  console.log(props.value) // Stale closure!
})
```

If you need to react to React state changes, use `useEffect` instead of `useAutorun`.

## Example

### useAutorun

```tsx
import { observer } from 'mobx-react-lite'
import { useAutorun } from '@/hooks/mobx'

const UserProfile = observer(() => {
  const userStore = useUserStore()

  useAutorun(() => {
    console.log('Current user:', userStore.currentUser?.name)
  })

  return <div>{userStore.currentUser?.name}</div>
})
```

### useReaction

```tsx
import { useReaction } from '@/hooks/mobx'

const TodoList = observer(() => {
  const todoStore = useTodoStore()

  useReaction(
    () => todoStore.completedCount,
    (count, prevCount) => {
      if (count > prevCount) {
        toast.success(`Completed ${count - prevCount} more tasks!`)
      }
    },
  )

  return <div>Completed: {todoStore.completedCount}</div>
})
```

## Do NOT Use

```tsx
// ❌ Never use autorun directly in component
import { autorun } from 'mobx'

const MyComponent = observer(() => {
  const store = useStore()

  // Wrong! Memory leak - no cleanup
  autorun(() => {
    console.log(store.value)
  })

  return <div />
})

// ❌ Never use reaction directly in component
import { reaction } from 'mobx'

const MyComponent = observer(() => {
  const store = useStore()

  // Wrong! Creates new reaction on every render
  reaction(
    () => store.value,
    () => console.log('changed')
  )

  return <div />
})

// ❌ Never manually manage autorun in useEffect
const MyComponent = observer(() => {
  const store = useStore()

  useEffect(() => {
    const disposer = autorun(() => {
      console.log(store.value)
    })
    return () => disposer()
  }, [store])

  return <div />
})
```

## When to Use

| Scenario                       | Recommendation                         |
| ------------------------------ | -------------------------------------- |
| React component needs autorun  | Use `useAutorun` hook                  |
| React component needs reaction | Use `useReaction` hook                 |
| Raw autorun/reaction           | Only in non-React code (stores, utils) |
| Hooks don't exist              | Add them to `src/hooks/mobx.ts` first  |

## Reference

- [MobX Reactions](https://mobx.js.org/reactions.html)
- [Autorun API](https://mobx.js.org/reactions.html#autorun)
- [Reaction API](https://mobx.js.org/reactions.html#reaction)
