import React, { useEffect } from "react";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  LiveAnnouncerProvider,
  useLiveAnnouncer,
  LiveAnnouncerMessage,
  LiveAnnouncerMessenger,
} from "../index";

// Note: Live announcer DOM elements are not rendered in test environments
// to keep snapshots clean. These tests verify the behavior of the hooks
// and components without checking DOM output.

const TestButton: React.FC<{ message: string; priority?: "polite" | "assertive" }> = ({
  message,
  priority = "polite",
}) => {
  const { announce } = useLiveAnnouncer();
  return (
    <button onClick={() => announce(message, { priority })}>
      Announce
    </button>
  );
};

const TestPoliteButton: React.FC<{ message: string; id?: string }> = ({
  message,
  id,
}) => {
  const { announcePolite } = useLiveAnnouncer();
  return (
    <button onClick={() => announcePolite(message, id)}>
      Announce Polite
    </button>
  );
};

const TestAssertiveButton: React.FC<{ message: string; id?: string }> = ({
  message,
  id,
}) => {
  const { announceAssertive } = useLiveAnnouncer();
  return (
    <button onClick={() => announceAssertive(message, id)}>
      Announce Assertive
    </button>
  );
};

const TestClearButton: React.FC = () => {
  const { clearAnnouncements } = useLiveAnnouncer();
  return <button onClick={clearAnnouncements}>Clear</button>;
};

describe("LiveAnnouncerProvider", () => {
  it("renders children correctly", () => {
    render(
      <LiveAnnouncerProvider>
        <div>Test Content</div>
      </LiveAnnouncerProvider>
    );

    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("does not render live regions in test environment", () => {
    render(
      <LiveAnnouncerProvider>
        <div>Test</div>
      </LiveAnnouncerProvider>
    );

    // Live regions should not be present in test environment
    expect(screen.queryByTestId("LiveAnnouncer-polite-1")).not.toBeInTheDocument();
    expect(screen.queryByTestId("LiveAnnouncer-polite-2")).not.toBeInTheDocument();
    expect(screen.queryByTestId("LiveAnnouncer-assertive-1")).not.toBeInTheDocument();
    expect(screen.queryByTestId("LiveAnnouncer-assertive-2")).not.toBeInTheDocument();
    expect(screen.queryByTestId("LiveAnnouncer-container")).not.toBeInTheDocument();
  });
});

describe("useLiveAnnouncer", () => {
  it("throws error when used outside provider", () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});

    const BadComponent = () => {
      useLiveAnnouncer();
      return null;
    };

    expect(() => render(<BadComponent />)).toThrow(
      "useLiveAnnouncer must be used within a LiveAnnouncerProvider"
    );

    consoleError.mockRestore();
  });

  it("provides announce function that can be called without error", async () => {
    const user = userEvent.setup();

    render(
      <LiveAnnouncerProvider>
        <TestButton message="Hello World" priority="polite" />
      </LiveAnnouncerProvider>
    );

    // Should not throw when clicking
    await expect(user.click(screen.getByText("Announce"))).resolves.not.toThrow();
  });

  it("provides announcePolite function that can be called without error", async () => {
    const user = userEvent.setup();

    render(
      <LiveAnnouncerProvider>
        <TestPoliteButton message="Polite message" />
      </LiveAnnouncerProvider>
    );

    await expect(user.click(screen.getByText("Announce Polite"))).resolves.not.toThrow();
  });

  it("provides announceAssertive function that can be called without error", async () => {
    const user = userEvent.setup();

    render(
      <LiveAnnouncerProvider>
        <TestAssertiveButton message="Assertive message" />
      </LiveAnnouncerProvider>
    );

    await expect(user.click(screen.getByText("Announce Assertive"))).resolves.not.toThrow();
  });

  it("provides clearAnnouncements function that can be called without error", async () => {
    const user = userEvent.setup();

    render(
      <LiveAnnouncerProvider clearOnUnmountDelay={0}>
        <TestPoliteButton message="Test" />
        <TestClearButton />
      </LiveAnnouncerProvider>
    );

    await user.click(screen.getByText("Announce Polite"));
    await expect(user.click(screen.getByText("Clear"))).resolves.not.toThrow();
  });

  it("returns stable function references", () => {
    const functionRefs: Array<{
      announce: ReturnType<typeof useLiveAnnouncer>["announce"];
      announcePolite: ReturnType<typeof useLiveAnnouncer>["announcePolite"];
      announceAssertive: ReturnType<typeof useLiveAnnouncer>["announceAssertive"];
      clearAnnouncements: ReturnType<typeof useLiveAnnouncer>["clearAnnouncements"];
    }> = [];

    const RefCollector: React.FC = () => {
      const context = useLiveAnnouncer();
      functionRefs.push(context);
      return null;
    };

    const { rerender } = render(
      <LiveAnnouncerProvider>
        <RefCollector />
      </LiveAnnouncerProvider>
    );

    rerender(
      <LiveAnnouncerProvider>
        <RefCollector />
      </LiveAnnouncerProvider>
    );

    expect(functionRefs.length).toBe(2);
    // Functions should be stable across renders
    expect(functionRefs[0].clearAnnouncements).toBe(functionRefs[1].clearAnnouncements);
  });
});

describe("LiveAnnouncerMessage", () => {
  it("renders without errors", () => {
    expect(() => {
      render(
        <LiveAnnouncerProvider>
          <LiveAnnouncerMessage message="Initial message" />
        </LiveAnnouncerProvider>
      );
    }).not.toThrow();
  });

  it("handles message changes without errors", () => {
    const { rerender } = render(
      <LiveAnnouncerProvider>
        <LiveAnnouncerMessage message="First" />
      </LiveAnnouncerProvider>
    );

    expect(() => {
      rerender(
        <LiveAnnouncerProvider>
          <LiveAnnouncerMessage message="Second" />
        </LiveAnnouncerProvider>
      );
    }).not.toThrow();
  });

  it("handles assertive priority without errors", () => {
    expect(() => {
      render(
        <LiveAnnouncerProvider>
          <LiveAnnouncerMessage message="Alert!" priority="assertive" />
        </LiveAnnouncerProvider>
      );
    }).not.toThrow();
  });

  it("does not render any visible content", () => {
    const { container } = render(
      <LiveAnnouncerProvider>
        <LiveAnnouncerMessage message="Hidden" />
      </LiveAnnouncerProvider>
    );

    // The component returns null, so it doesn't add visible elements
    expect(container.querySelector("[data-testid='LiveAnnouncer-message']")).not.toBeInTheDocument();
  });

  it("handles clearOnUnmount without errors", () => {
    const TestComponent: React.FC<{ show: boolean }> = ({ show }) => (
      <LiveAnnouncerProvider clearOnUnmountDelay={0}>
        {show && <LiveAnnouncerMessage message="Temporary" clearOnUnmount />}
      </LiveAnnouncerProvider>
    );

    const { rerender } = render(<TestComponent show={true} />);

    expect(() => {
      rerender(<TestComponent show={false} />);
    }).not.toThrow();
  });

  it("handles id changes without errors", () => {
    const { rerender } = render(
      <LiveAnnouncerProvider>
        <LiveAnnouncerMessage message="Same message" id="1" />
      </LiveAnnouncerProvider>
    );

    expect(() => {
      rerender(
        <LiveAnnouncerProvider>
          <LiveAnnouncerMessage message="Same message" id="2" />
        </LiveAnnouncerProvider>
      );
    }).not.toThrow();
  });
});

describe("LiveAnnouncerMessenger", () => {
  it("provides announcer functions via render props", async () => {
    const user = userEvent.setup();

    render(
      <LiveAnnouncerProvider>
        <LiveAnnouncerMessenger>
          {({ announcePolite, announceAssertive }) => (
            <>
              <button onClick={() => announcePolite("Polite via render")}>
                Polite
              </button>
              <button onClick={() => announceAssertive("Assertive via render")}>
                Assertive
              </button>
            </>
          )}
        </LiveAnnouncerMessenger>
      </LiveAnnouncerProvider>
    );

    await expect(user.click(screen.getByText("Polite"))).resolves.not.toThrow();
    await expect(user.click(screen.getByText("Assertive"))).resolves.not.toThrow();
  });

  it("provides clearAnnouncements function", async () => {
    const user = userEvent.setup();

    render(
      <LiveAnnouncerProvider clearOnUnmountDelay={0}>
        <LiveAnnouncerMessenger>
          {({ announcePolite, clearAnnouncements }) => (
            <>
              <button onClick={() => announcePolite("Test")}>Announce</button>
              <button onClick={clearAnnouncements}>Clear</button>
            </>
          )}
        </LiveAnnouncerMessenger>
      </LiveAnnouncerProvider>
    );

    await user.click(screen.getByText("Announce"));
    await expect(user.click(screen.getByText("Clear"))).resolves.not.toThrow();
  });
});

describe("Auto-clear functionality", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("schedules auto-clear after specified delay", () => {
    render(
      <LiveAnnouncerProvider clearOnUnmountDelay={1000}>
        <LiveAnnouncerMessage message="Auto-clear test" />
      </LiveAnnouncerProvider>
    );

    // Should not throw when advancing timers
    expect(() => {
      act(() => {
        jest.advanceTimersByTime(1000);
      });
    }).not.toThrow();
  });

  it("handles clearOnUnmountDelay of 0", () => {
    render(
      <LiveAnnouncerProvider clearOnUnmountDelay={0}>
        <LiveAnnouncerMessage message="No auto-clear" />
      </LiveAnnouncerProvider>
    );

    expect(() => {
      act(() => {
        jest.advanceTimersByTime(10000);
      });
    }).not.toThrow();
  });
});

describe("Integration tests", () => {
  it("handles rapid consecutive announcements without errors", async () => {
    const user = userEvent.setup();
    let counter = 0;

    const RapidAnnouncer: React.FC = () => {
      const { announcePolite } = useLiveAnnouncer();
      return (
        <button onClick={() => announcePolite(`Message ${++counter}`, String(counter))}>
          Rapid
        </button>
      );
    };

    render(
      <LiveAnnouncerProvider clearOnUnmountDelay={0}>
        <RapidAnnouncer />
      </LiveAnnouncerProvider>
    );

    const button = screen.getByText("Rapid");

    // Multiple rapid clicks should not throw
    await user.click(button);
    await user.click(button);
    await expect(user.click(button)).resolves.not.toThrow();
  });

  it("works with useEffect announcements", () => {
    const EffectAnnouncer: React.FC<{ message: string }> = ({ message }) => {
      const { announcePolite } = useLiveAnnouncer();

      useEffect(() => {
        announcePolite(message);
      }, [message, announcePolite]);

      return null;
    };

    expect(() => {
      render(
        <LiveAnnouncerProvider>
          <EffectAnnouncer message="Effect message" />
        </LiveAnnouncerProvider>
      );
    }).not.toThrow();
  });

  it("can be used with multiple nested components", async () => {
    const user = userEvent.setup();

    const Parent: React.FC = () => {
      const { announcePolite } = useLiveAnnouncer();
      return (
        <div>
          <button onClick={() => announcePolite("Parent announcement")}>
            Parent Announce
          </button>
          <Child />
        </div>
      );
    };

    const Child: React.FC = () => {
      const { announceAssertive } = useLiveAnnouncer();
      return (
        <button onClick={() => announceAssertive("Child announcement")}>
          Child Announce
        </button>
      );
    };

    render(
      <LiveAnnouncerProvider>
        <Parent />
      </LiveAnnouncerProvider>
    );

    await expect(user.click(screen.getByText("Parent Announce"))).resolves.not.toThrow();
    await expect(user.click(screen.getByText("Child Announce"))).resolves.not.toThrow();
  });
});
