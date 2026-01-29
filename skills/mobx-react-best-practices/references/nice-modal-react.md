# nice-modal-react Reference

> **Recommended**: This library is the recommended solution for modal management in all React projects.

[nice-modal-react](https://github.com/eBay/nice-modal-react) is a lightweight (~2kb gzipped), zero-dependency library for managing modals globally using React Context.

## Core Concepts

- **Global state management** — Modals are managed globally via React Context, callable from anywhere
- **Uncontrolled modals** — Components can close themselves via the `useModal` hook
- **Promise API** — `show()` returns a promise for async modal interactions
- **Lazy evaluation** — Modal code only executes when visible
- **Component-based** — Use component reference (not string ID) to control modals

## Installation

```bash
npm install @ebay/nice-modal-react
```

## Provider Setup

Wrap your app with the provider:

```tsx
import { Provider } from '@ebay/nice-modal-react';

function App() {
  return (
    <Provider>
      <Routes />
    </Provider>
  );
}
```

## Basic Usage

### 1. Create a Modal Component

Use `create()` to wrap your modal component:

```tsx
import { Modal } from 'antd';
import { useModal, create } from '@ebay/nice-modal-react';

interface UserModalProps {
  userId: string;
}

export const UserModal = create(({ userId }: UserModalProps) => {
  const modal = useModal();

  const handleOk = () => {
    modal.resolve({ userId, success: true });
    modal.hide();
  };

  const handleCancel = () => {
    modal.reject('cancelled');
    modal.hide();
  };

  return (
    <Modal
      title="User Details"
      open={modal.visible}
      onOk={handleOk}
      onCancel={handleCancel}
      afterClose={() => modal.remove()}
    >
      User ID: {userId}
    </Modal>
  );
});
```

### 2. Show the Modal

Call `show()` with the component:

```tsx
import { show } from '@ebay/nice-modal-react';
import { UserModal } from './modals/UserModal';

function UserList() {
  const handleEdit = async (userId: string) => {
    const result = await show(UserModal, { userId });
    console.log('Result:', result);
  };

  return <button onClick={() => handleEdit('123')}>Edit</button>;
}
```

## Core API

```tsx
import { show, useModal, create } from '@ebay/nice-modal-react';
```

### Methods

| Method   | Signature                        | Description                          |
| -------- | -------------------------------- | ------------------------------------ |
| `create` | `(component) => Component`       | HOC to create a nice modal component |
| `show`   | `(Component, props?) => Promise` | Display modal, returns promise       |

### useModal Hook

Returns a modal instance inside components created with `create()`:

| Property/Method        | Type                   | Description                       |
| ---------------------- | ---------------------- | --------------------------------- |
| `modal.visible`        | `boolean`              | Whether modal is visible          |
| `modal.hide()`         | `() => void`           | Hide the modal                    |
| `modal.remove()`       | `() => void`           | Remove from React tree            |
| `modal.resolve(value)` | `(value: any) => void` | Resolve the promise from `show()` |
| `modal.reject(error)`  | `(error: any) => void` | Reject the promise from `show()`  |

## Best Practices

### 1. Provider Ordering for SPA Pages

In a SPA with multiple business pages, if your modal components use Context (e.g., page-specific data, theme, user info), `NiceModal.Provider` **must be placed inside** those Context providers at the page level.

**Global providers** (App level):

```tsx
// App.tsx - Global providers only
function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <Routes />
      </UserProvider>
    </ThemeProvider>
  );
}
```

**Page-level providers** (where page Context is used):

```tsx
// UserPage.tsx - Page with its own Context
function UserPage() {
  return (
    <UserPageContext.Provider value={pageData}>
      <NiceModal.Provider>
        <UserList />
        {/* Modals here can access UserPageContext */}
      </NiceModal.Provider>
    </UserPageContext.Provider>
  );
}
```

This ensures:
- Page-specific modals can access page Context
- Modals are scoped to the page lifecycle
- Automatic cleanup when navigating away

### 2. Clean Up with afterClose

Always use `afterClose` to preserve exit animations:

```tsx
<Modal
  open={modal.visible}
  onCancel={() => modal.hide()}
  afterClose={() => modal.remove()}
>
  Content
</Modal>
```

### 3. Promise-based Results

Use the promise API for simple parent-child communication:

```tsx
// ConfirmModal.tsx
export const ConfirmModal = create(({ title }: { title: string }) => {
  const modal = useModal();

  return (
    <Modal
      open={modal.visible}
      onOk={() => { modal.resolve(true); modal.hide(); }}
      onCancel={() => { modal.reject(false); modal.hide(); }}
      afterClose={() => modal.remove()}
    >
      {title}
    </Modal>
  );
});

// Usage
const confirmed = await show(ConfirmModal, { title: 'Are you sure?' });
if (confirmed) {
  // Proceed
}
```

### 4. TypeScript Support

Define props interface on your modal component:

```tsx
interface UserModalProps {
  userId: string;
}

export const UserModal = create(({ userId }: UserModalProps) => {
  const modal = useModal();
  // ...
});
```

### 5. MobX Support

Modals can use MobX hooks normally. Wrap with `observer`:

```tsx
import { observer } from 'mobx-react-lite';
import { useStore } from './stores';

export const UserEditModal = create(
  observer(({ userId }: { userId: string }) => {
    const modal = useModal();
    const store = useStore('userStore');

    return (
      <Modal
        open={modal.visible}
        onOk={() => { modal.resolve(); modal.hide(); }}
        onCancel={() => modal.hide()}
        afterClose={() => modal.remove()}
      >
        <input
          value={store.user?.name}
          onChange={(e) => store.setName(e.target.value)}
        />
      </Modal>
    );
  })
);
```

`show()` can be called from anywhere — components, stores, or event handlers — depending on your project's patterns.

### 6. Hide After Resolve/Reject

When the modal completes its purpose (user confirms, submits, or cancels), call `modal.hide()` after `modal.resolve()` or `modal.reject()` to close the modal:

```tsx
// Good: hide after resolve/reject
const handleOk = async () => {
  await saveData();
  modal.resolve({ success: true });
  modal.hide();  // Close the modal
};

const handleCancel = () => {
  modal.reject('cancelled');
  modal.hide();  // Close the modal
};
```

## Key Takeaways

1. **Recommended** — Use nice-modal-react for all modal management
2. **Use `create()`** — Wrap modal components with `create()` HOC
3. **Component reference** — Pass component to `show(Component, props)`
4. **No `register()`** — Do not use the `register()` API
5. **Named imports** — Import `{ show, useModal, create }` directly
6. **Promise-based** — Use `modal.resolve()` / `modal.reject()` for results
7. **Cleanup required** — Always call `modal.remove()` in `afterClose`
8. **Provider ordering** — Place `NiceModal.Provider` inside page-level Context providers
