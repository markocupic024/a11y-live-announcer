import { useState, useCallback } from 'react'
import {
  A11yAnnouncerProvider,
  useA11yAnnouncer,
  A11yAnnouncerMessage,
  A11yAnnouncerMessenger,
} from 'a11yAnnouncer'

function HookDemo() {
  const { announcePolite, announceAssertive, clearAnnouncements } = useA11yAnnouncer()
  const [counter, setCounter] = useState(0)

  const handlePolite = () => {
    announcePolite(`Polite announcement #${counter + 1}`)
    setCounter(c => c + 1)
  }

  const handleAssertive = () => {
    announceAssertive(`ALERT: Assertive announcement #${counter + 1}`)
    setCounter(c => c + 1)
  }

  const handleSameMessage = () => {
    // Using unique ID to force re-announcement of same text
    announcePolite('This message repeats!', `unique-${Date.now()}`)
  }

  return (
    <div className="demo-section">
      <h2>Hook API</h2>
      <p className="description">
        Use the <code>useA11yAnnouncer</code> hook for imperative announcements.
      </p>
      <div className="button-group">
        <button className="btn btn-polite" onClick={handlePolite}>
          Announce Polite
        </button>
        <button className="btn btn-assertive" onClick={handleAssertive}>
          Announce Assertive
        </button>
        <button className="btn btn-secondary" onClick={handleSameMessage}>
          Repeat Same Message
        </button>
        <button className="btn btn-ghost" onClick={clearAnnouncements}>
          Clear All
        </button>
      </div>
      <div className="counter">
        Announcements made: <span className="count">{counter}</span>
      </div>
    </div>
  )
}

function MessageComponentDemo() {
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState<'polite' | 'assertive'>('polite')
  const [showMessage, setShowMessage] = useState(true)

  return (
    <div className="demo-section">
      <h2>Declarative Component</h2>
      <p className="description">
        Use <code>&lt;A11yAnnouncerMessage&gt;</code> for declarative announcements.
      </p>
      
      <div className="input-group">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message to announce..."
          className="text-input"
        />
        <select 
          value={priority} 
          onChange={(e) => setPriority(e.target.value as 'polite' | 'assertive')}
          className="select-input"
        >
          <option value="polite">Polite</option>
          <option value="assertive">Assertive</option>
        </select>
      </div>

      <div className="checkbox-group">
        <label>
          <input
            type="checkbox"
            checked={showMessage}
            onChange={(e) => setShowMessage(e.target.checked)}
          />
          Show message component (toggle to test clearOnUnmount)
        </label>
      </div>

      {showMessage && (
        <A11yAnnouncerMessage 
          message={message} 
          priority={priority}
          clearOnUnmount
        />
      )}

      <div className="hint">
        The message is announced when you type. Toggle the checkbox to test unmount clearing.
      </div>
    </div>
  )
}

function MessengerDemo() {
  return (
    <div className="demo-section">
      <h2>Render Props</h2>
      <p className="description">
        Use <code>&lt;A11yAnnouncerMessenger&gt;</code> for render props pattern.
      </p>
      
      <A11yAnnouncerMessenger>
        {({ announcePolite, announceAssertive }) => (
          <div className="button-group">
            <button 
              className="btn btn-polite"
              onClick={() => announcePolite('Message via render props!')}
            >
              Polite (Render Props)
            </button>
            <button 
              className="btn btn-assertive"
              onClick={() => announceAssertive('Alert via render props!')}
            >
              Assertive (Render Props)
            </button>
          </div>
        )}
      </A11yAnnouncerMessenger>
    </div>
  )
}

function RouteChangeDemo() {
  const { announcePolite } = useA11yAnnouncer()
  const [currentPage, setCurrentPage] = useState('Home')

  const navigateTo = (page: string) => {
    setCurrentPage(page)
    announcePolite(`Navigated to ${page} page`)
  }

  return (
    <div className="demo-section">
      <h2>Route Change Simulation</h2>
      <p className="description">
        Common use case: announcing page navigation to screen readers.
      </p>
      
      <nav className="fake-nav">
        {['Home', 'Products', 'About', 'Contact'].map((page) => (
          <button
            key={page}
            className={`nav-link ${currentPage === page ? 'active' : ''}`}
            onClick={() => navigateTo(page)}
          >
            {page}
          </button>
        ))}
      </nav>
      
      <div className="current-page">
        Current page: <strong>{currentPage}</strong>
      </div>
    </div>
  )
}

function LoadingStateDemo() {
  const { announcePolite, announceAssertive } = useA11yAnnouncer()
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)

  const simulateLoad = useCallback(async (shouldFail: boolean) => {
    setIsLoading(true)
    setHasError(false)
    announcePolite('Loading data...')

    await new Promise(resolve => setTimeout(resolve, 2000))

    setIsLoading(false)
    if (shouldFail) {
      setHasError(true)
      announceAssertive('Error: Failed to load data. Please try again.')
    } else {
      announcePolite('Data loaded successfully!')
    }
  }, [announcePolite, announceAssertive])

  return (
    <div className="demo-section">
      <h2>Loading States</h2>
      <p className="description">
        Announce loading states and errors to screen reader users.
      </p>
      
      <div className="button-group">
        <button 
          className="btn btn-polite"
          onClick={() => simulateLoad(false)}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Load Data (Success)'}
        </button>
        <button 
          className="btn btn-assertive"
          onClick={() => simulateLoad(true)}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Load Data (Fail)'}
        </button>
      </div>

      {isLoading && <div className="loading-spinner" />}
      {hasError && <div className="error-message">Error loading data!</div>}
    </div>
  )
}

function LiveRegionVisualizer() {
  const [polite1, setPolite1] = useState('')
  const [polite2, setPolite2] = useState('')
  const [assertive1, setAssertive1] = useState('')
  const [assertive2, setAssertive2] = useState('')

  // Poll the DOM for live region contents
  useState(() => {
    const interval = setInterval(() => {
      const p1 = document.querySelector('[data-testid="A11yAnnouncer-polite-1"]')
      const p2 = document.querySelector('[data-testid="A11yAnnouncer-polite-2"]')
      const a1 = document.querySelector('[data-testid="A11yAnnouncer-assertive-1"]')
      const a2 = document.querySelector('[data-testid="A11yAnnouncer-assertive-2"]')
      
      setPolite1(p1?.textContent || '')
      setPolite2(p2?.textContent || '')
      setAssertive1(a1?.textContent || '')
      setAssertive2(a2?.textContent || '')
    }, 100)

    return () => clearInterval(interval)
  })

  return (
    <div className="demo-section visualizer">
      <h2>Live Region Inspector</h2>
      <p className="description">
        See what's in the hidden ARIA live regions (double announcer pattern).
      </p>
      
      <div className="region-grid">
        <div className="region-box polite">
          <div className="region-label">Polite #1</div>
          <div className="region-content">{polite1 || '(empty)'}</div>
        </div>
        <div className="region-box polite">
          <div className="region-label">Polite #2</div>
          <div className="region-content">{polite2 || '(empty)'}</div>
        </div>
        <div className="region-box assertive">
          <div className="region-label">Assertive #1</div>
          <div className="region-content">{assertive1 || '(empty)'}</div>
        </div>
        <div className="region-box assertive">
          <div className="region-label">Assertive #2</div>
          <div className="region-content">{assertive2 || '(empty)'}</div>
        </div>
      </div>

      <div className="hint">
        The double announcer pattern alternates between regions to ensure
        screen readers always detect changes.
      </div>
    </div>
  )
}

export default function App() {
  return (
    <A11yAnnouncerProvider clearOnUnmountDelay={7000}>
      <div className="app">
        <header className="header">
          <h1>
            A11y Announcer
          </h1>
          <p className="tagline">
            React ARIA live region announcer
          </p>
        </header>

        <main className="main">
          <LiveRegionVisualizer />
          <HookDemo />
          <MessageComponentDemo />
          <MessengerDemo />
          <RouteChangeDemo />
          <LoadingStateDemo />
        </main>
      </div>
    </A11yAnnouncerProvider>
  )
}

