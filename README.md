# A11yAnnouncer

A lightweight React library for managing ARIA live regions for reliable screen reader notifications.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Why Use This?

ARIA Live Regions are used to communicate important information to screen reader users. However, screen readers can be finicky about detecting changes to live regions, especially when:

- The same message is announced twice in a row
- Messages change too rapidly
- The live region content is updated in a non-standard way

## Installation

```bash
npm install a11yAnnouncer
```

or

```bash
yarn add a11yAnnouncer
```

## Quick Start

Wrap your app with `A11yAnnouncerProvider`:

```tsx
import { A11yAnnouncerProvider } from 'a11yAnnouncer';

function App() {
  return (
    <A11yAnnouncerProvider>
      <YourApp />
    </A11yAnnouncerProvider>
  );
}
```

Then announce messages from anywhere in your app:

```tsx
import { useA11yAnnouncer } from 'a11yAnnouncer';

function MyComponent() {
  const { announcePolite, announceAssertive } = useA11yAnnouncer();

  const handleSave = async () => {
    await saveData();
    announcePolite('Your changes have been saved');
  };

  const handleError = () => {
    announceAssertive('Error: Please fix the form errors');
  };

  return (
    <button onClick={handleSave}>Save</button>
  );
}
```

## API Reference

### `A11yAnnouncerProvider`

The context provider that renders the hidden ARIA live regions.

```tsx
<A11yAnnouncerProvider
  clearOnUnmountDelay={7000} // Optional: auto-clear delay in ms (default: 7000, 0 to disable)
>
  {children}
</A11yAnnouncerProvider>
```

### `useA11yAnnouncer` Hook

The primary way to announce messages.

```tsx
const {
  announce,           // (message, options?) => void
  announcePolite,     // (message, id?) => void
  announceAssertive,  // (message, id?) => void
  clearAnnouncements, // () => void
} = useA11yAnnouncer();
```

#### Options

```tsx
interface A11yAnnouncerOptions {
  priority?: 'polite' | 'assertive';  // Default: 'polite'
  id?: string;  // Force re-announcement of same message
}
```

#### Examples

```tsx
// Basic polite announcement
announcePolite('Item added to cart');

// Assertive announcement (interrupts current speech)
announceAssertive('Session expired. Please log in again.');

// Force re-announcement of same message using ID
announcePolite('Form submitted', `submission-${Date.now()}`);

// Using the generic announce function
announce('Loading complete', { priority: 'polite' });
```

### `A11yAnnouncerMessage` Component

Declarative component for announcements. Announces when the `message` prop changes.

```tsx
import { A11yAnnouncerMessage } from 'A11yAnnouncer';

function StatusMessage({ status }) {
  return (
    <A11yAnnouncerMessage
      message={status}
      priority="polite"     // Optional: 'polite' | 'assertive'
      id={statusId}         // Optional: force re-announcement
      clearOnUnmount        // Optional: clear when component unmounts
    />
  );
}
```

### `A11yAnnouncerMessenger` Component

Render props pattern for when you can't use hooks directly.

```tsx
import { A11yAnnouncerMessenger } from 'A11yAnnouncer';

function ClassComponent() {
  return (
    <A11yAnnouncerMessenger>
      {({ announcePolite, announceAssertive, clearAnnouncements }) => (
        <button onClick={() => announcePolite('Clicked!')}>
          Click me
        </button>
      )}
    </A11yAnnouncerMessenger>
  );
}
```

## Common Use Cases

### Route Changes

```tsx
function useRouteAnnouncer() {
  const { announcePolite } = useA11yAnnouncer();
  const location = useLocation();

  useEffect(() => {
    announcePolite(`Navigated to ${document.title || location.pathname}`);
  }, [location.pathname, announcePolite]);
}
```

### Form Validation

```tsx
function FormField({ error }) {
  const { announceAssertive } = useA11yAnnouncer();

  useEffect(() => {
    if (error) {
      announceAssertive(error);
    }
  }, [error, announceAssertive]);

  return <input aria-invalid={!!error} />;
}
```

### Loading States

```tsx
function DataLoader() {
  const { announcePolite } = useA11yAnnouncer();
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    announcePolite('Loading data...');
    
    try {
      await fetchData();
      announcePolite('Data loaded successfully');
    } catch {
      announcePolite('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  return <button onClick={loadData}>Load</button>;
}
```

### Toast Notifications

```tsx
function Toast({ message, type }) {
  return (
    <>
      <A11yAnnouncerMessage
        message={message}
        priority={type === 'error' ? 'assertive' : 'polite'}
        clearOnUnmount
      />
      <div className="toast">{message}</div>
    </>
  );
}
```

## Requirements

- React 16.8+ (hooks support)
- React DOM 16.8+

## License

MIT © Marko Cupic

