# a11y-live-announcer

A lightweight React library for managing ARIA live regions for reliable screen reader notifications.

[![npm](https://img.shields.io/npm/v/a11y-live-announcer.svg)](https://www.npmjs.com/package/a11y-live-announcer) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Why Use This?

ARIA Live Regions are used to communicate important information to screen reader users. However, screen readers can be finicky about detecting changes to live regions, especially when:

- The same message is announced twice in a row
- Messages change too rapidly
- The live region content is updated in a non-standard way

## Installation

```bash
npm install a11y-live-announcer
```

or

```bash
yarn add a11y-live-announcer
```

## Quick Start

Wrap your app with `LiveAnnouncerProvider`:

```tsx
import { LiveAnnouncerProvider } from 'a11y-live-announcer';

function App() {
  return (
    <LiveAnnouncerProvider>
      <YourApp />
    </LiveAnnouncerProvider>
  );
}
```

Then announce messages from anywhere in your app:

```tsx
import { useLiveAnnouncer } from 'a11y-live-announcer';

function MyComponent() {
  const { announcePolite, announceAssertive } = useLiveAnnouncer();

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

### `LiveAnnouncerProvider`

The context provider that renders the hidden ARIA live regions.

```tsx
<LiveAnnouncerProvider
  clearOnUnmountDelay={7000} // Optional: auto-clear delay in ms (default: 7000, 0 to disable)
>
  {children}
</LiveAnnouncerProvider>
```

### `useLiveAnnouncer` Hook

The primary way to announce messages.

```tsx
const {
  announce,           // (message, options?) => void
  announcePolite,     // (message, id?) => void
  announceAssertive,  // (message, id?) => void
  clearAnnouncements, // () => void
} = useLiveAnnouncer();
```

#### Options

```tsx
interface LiveAnnouncerOptions {
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

### `LiveAnnouncerMessage` Component

Declarative component for announcements. Announces when the `message` prop changes.

```tsx
import { LiveAnnouncerMessage } from 'a11y-live-announcer';

function StatusMessage({ status }) {
  return (
    <LiveAnnouncerMessage
      message={status}
      priority="polite"     // Optional: 'polite' | 'assertive'
      id={statusId}         // Optional: force re-announcement
      clearOnUnmount        // Optional: clear when component unmounts
    />
  );
}
```

### `LiveAnnouncerMessenger` Component

Render props pattern for when you can't use hooks directly.

```tsx
import { LiveAnnouncerMessenger } from 'a11y-live-announcer';

function ClassComponent() {
  return (
    <LiveAnnouncerMessenger>
      {({ announcePolite, announceAssertive, clearAnnouncements }) => (
        <button onClick={() => announcePolite('Clicked!')}>
          Click me
        </button>
      )}
    </LiveAnnouncerMessenger>
  );
}
```

## Common Use Cases

### Route Changes

```tsx
function useRouteAnnouncer() {
  const { announcePolite } = useLiveAnnouncer();
  const location = useLocation();

  useEffect(() => {
    announcePolite(`Navigated to ${document.title || location.pathname}`);
  }, [location.pathname, announcePolite]);
}
```

### Form Validation

```tsx
function FormField({ error }) {
  const { announceAssertive } = useLiveAnnouncer();

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
  const { announcePolite } = useLiveAnnouncer();
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
      <LiveAnnouncerMessage
        message={message}
        priority={type === 'error' ? 'assertive' : 'polite'}
        clearOnUnmount
      />
      <div className="toast">{message}</div>
    </>
  );
}
```

## Demo

Try the interactive demo to see the library in action:

- **Live Demo**: [View on GitHub Pages](https://markocupic024.github.io/a11y-live-announcer/) (auto-deployed)
- **Local Demo**: Run `npm run demo` from the project root

The demo showcases all features including hooks, declarative components, render props, and common use cases.

## Testing

This library automatically detects test environments and **does not render live region DOM elements** when running in tests. This keeps your snapshots clean and prevents the announcer markup from cluttering test output.

## Requirements

- React 16.8+ (hooks support)
- React DOM 16.8+

## License

MIT © Marko Cupic

