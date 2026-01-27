---
title: Always Use Observer
type: capability
impact: HIGH
impactDescription: wrap all components that render observable values with observer
tags: mobx, observer, mobx-react-lite, reactive, render
---

# Always Use Observer

**Impact: HIGH** - wrap all components that render observable values with `observer`

All components that read observable state must be wrapped in `observer` from `mobx-react-lite`. This enables automatic re-rendering when observed values change and includes `React.memo` for performance.

## Example

```tsx
import { observer } from 'mobx-react-lite'

export type TodoListProps = {
    todoList: Todo[];
}

const TodoList = observer<TodoListProps>((props) => {
  return (
    <ul>
      {props.todos.map(todo => (
        <li key={todo.id}>{todo.text}</li>
      ))}
    </ul>
  )
})

export default TodoList;
```

## Do NOT Use

```tsx
// ❌ Component won't re-render when todos change
import { store } from './store'

const TodoList = () => {
  return (
    <ul>
      {store.todos.map(todo => (
        <li key={todo.id}>{todo.text}</li>
      ))}
    </ul>
  )
}

export default TodoList
```

## When to Use

Always wrap component with observer.
