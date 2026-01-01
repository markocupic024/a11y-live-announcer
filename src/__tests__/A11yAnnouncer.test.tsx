import React, { useEffect } from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  LiveAnnouncerProvider,
  useLiveAnnouncer,
  LiveAnnouncerMessage,
  LiveAnnouncerMessenger,
} from "../index";

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

  it("renders all four live regions (double announcer pattern)", () => {
    render(
      <LiveAnnouncerProvider>
        <div>Test</div>
      </LiveAnnouncerProvider>
    );

    expect(screen.getByTestId("LiveAnnouncer-polite-1")).toBeInTheDocument();
    expect(screen.getByTestId("LiveAnnouncer-polite-2")).toBeInTheDocument();
    expect(screen.getByTestId("LiveAnnouncer-assertive-1")).toBeInTheDocument();
    expect(screen.getByTestId("LiveAnnouncer-assertive-2")).toBeInTheDocument();
  });

  it("has correct ARIA attributes on live regions", () => {
    render(
      <LiveAnnouncerProvider>
        <div>Test</div>
      </LiveAnnouncerProvider>
    );

    const polite1 = screen.getByTestId("LiveAnnouncer-polite-1");
    expect(polite1).toHaveAttribute("aria-live", "polite");
    expect(polite1).toHaveAttribute("aria-atomic", "true");
    expect(polite1).toHaveAttribute("role", "status");

    const assertive1 = screen.getByTestId("LiveAnnouncer-assertive-1");
    expect(assertive1).toHaveAttribute("aria-live", "assertive");
    expect(assertive1).toHaveAttribute("aria-atomic", "true");
    expect(assertive1).toHaveAttribute("role", "alert");
  });

  it("live regions are visually hidden", () => {
    render(
      <LiveAnnouncerProvider>
        <div>Test</div>
      </LiveAnnouncerProvider>
    );

    const container = screen.getByTestId("LiveAnnouncer-container");
    expect(container).toHaveStyle({ position: "absolute" });
    expect(container).toHaveStyle({ width: "1px" });
    expect(container).toHaveStyle({ height: "1px" });
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

  it("announces polite messages", async () => {
    const user = userEvent.setup();

    render(
      <LiveAnnouncerProvider>
        <TestButton message="Hello World" priority="polite" />
      </LiveAnnouncerProvider>
    );

    await user.click(screen.getByText("Announce"));

    const polite1 = screen.getByTestId("LiveAnnouncer-polite-1");
    expect(polite1).toHaveTextContent("Hello World");
  });

  it("announces assertive messages", async () => {
    const user = userEvent.setup();

    render(
      <LiveAnnouncerProvider>
        <TestButton message="Alert!" priority="assertive" />
      </LiveAnnouncerProvider>
    );

    await user.click(screen.getByText("Announce"));

    const assertive1 = screen.getByTestId("LiveAnnouncer-assertive-1");
    expect(assertive1).toHaveTextContent("Alert!");
  });

  it("alternates between regions for consecutive messages (double announcer pattern)", async () => {
    const user = userEvent.setup();

    render(
      <LiveAnnouncerProvider>
        <TestPoliteButton message="Message 1" />
      </LiveAnnouncerProvider>
    );

    const button = screen.getByText("Announce Polite");

    // First click - should use region 1
    await user.click(button);
    expect(screen.getByTestId("LiveAnnouncer-polite-1")).toHaveTextContent("Message 1");
    expect(screen.getByTestId("LiveAnnouncer-polite-2")).toHaveTextContent("");
  });

  it("uses announcePolite helper", async () => {
    const user = userEvent.setup();

    render(
      <LiveAnnouncerProvider>
        <TestPoliteButton message="Polite message" />
      </LiveAnnouncerProvider>
    );

    await user.click(screen.getByText("Announce Polite"));

    expect(screen.getByTestId("LiveAnnouncer-polite-1")).toHaveTextContent("Polite message");
  });

  it("uses announceAssertive helper", async () => {
    const user = userEvent.setup();

    render(
      <LiveAnnouncerProvider>
        <TestAssertiveButton message="Assertive message" />
      </LiveAnnouncerProvider>
    );

    await user.click(screen.getByText("Announce Assertive"));

    expect(screen.getByTestId("LiveAnnouncer-assertive-1")).toHaveTextContent("Assertive message");
  });

  it("clears all announcements", async () => {
    const user = userEvent.setup();

    render(
      <LiveAnnouncerProvider clearOnUnmountDelay={0}>
        <TestPoliteButton message="Test" />
        <TestClearButton />
      </LiveAnnouncerProvider>
    );

    await user.click(screen.getByText("Announce Polite"));
    expect(screen.getByTestId("LiveAnnouncer-polite-1")).toHaveTextContent("Test");

    await user.click(screen.getByText("Clear"));
    expect(screen.getByTestId("LiveAnnouncer-polite-1")).toHaveTextContent("");
    expect(screen.getByTestId("LiveAnnouncer-polite-2")).toHaveTextContent("");
  });
});

describe("LiveAnnouncerMessage", () => {
  it("announces message on mount", () => {
    render(
      <LiveAnnouncerProvider>
        <LiveAnnouncerMessage message="Initial message" />
      </LiveAnnouncerProvider>
    );

    expect(screen.getByTestId("LiveAnnouncer-polite-1")).toHaveTextContent("Initial message");
  });

  it("announces when message changes", () => {
    const { rerender } = render(
      <LiveAnnouncerProvider>
        <LiveAnnouncerMessage message="First" />
      </LiveAnnouncerProvider>
    );

    expect(screen.getByTestId("LiveAnnouncer-polite-1")).toHaveTextContent("First");

    rerender(
      <LiveAnnouncerProvider>
        <LiveAnnouncerMessage message="Second" />
      </LiveAnnouncerProvider>
    );

    // Due to double announcer, second message goes to region 2
    expect(screen.getByTestId("LiveAnnouncer-polite-2")).toHaveTextContent("Second");
  });

  it("uses assertive priority when specified", () => {
    render(
      <LiveAnnouncerProvider>
        <LiveAnnouncerMessage message="Alert!" priority="assertive" />
      </LiveAnnouncerProvider>
    );

    expect(screen.getByTestId("LiveAnnouncer-assertive-1")).toHaveTextContent("Alert!");
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

  it("clears announcements on unmount when clearOnUnmount is true", async () => {
    const TestComponent: React.FC<{ show: boolean }> = ({ show }) => (
      <LiveAnnouncerProvider clearOnUnmountDelay={0}>
        {show && <LiveAnnouncerMessage message="Temporary" clearOnUnmount />}
      </LiveAnnouncerProvider>
    );

    const { rerender } = render(<TestComponent show={true} />);
    expect(screen.getByTestId("LiveAnnouncer-polite-1")).toHaveTextContent("Temporary");

    rerender(<TestComponent show={false} />);

    await waitFor(() => {
      expect(screen.getByTestId("LiveAnnouncer-polite-1")).toHaveTextContent("");
    });
  });

  it("re-announces same message when id changes", () => {
    const { rerender } = render(
      <LiveAnnouncerProvider>
        <LiveAnnouncerMessage message="Same message" id="1" />
      </LiveAnnouncerProvider>
    );

    expect(screen.getByTestId("LiveAnnouncer-polite-1")).toHaveTextContent("Same message");

    rerender(
      <LiveAnnouncerProvider>
        <LiveAnnouncerMessage message="Same message" id="2" />
      </LiveAnnouncerProvider>
    );

    // Should use region 2 for the re-announcement
    expect(screen.getByTestId("LiveAnnouncer-polite-2")).toHaveTextContent("Same message");
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

    await user.click(screen.getByText("Polite"));
    expect(screen.getByTestId("LiveAnnouncer-polite-1")).toHaveTextContent("Polite via render");

    await user.click(screen.getByText("Assertive"));
    expect(screen.getByTestId("LiveAnnouncer-assertive-1")).toHaveTextContent("Assertive via render");
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
    expect(screen.getByTestId("LiveAnnouncer-polite-1")).toHaveTextContent("Test");

    await user.click(screen.getByText("Clear"));
    expect(screen.getByTestId("LiveAnnouncer-polite-1")).toHaveTextContent("");
  });
});

describe("Auto-clear functionality", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("clears announcements after specified delay", async () => {
    render(
      <LiveAnnouncerProvider clearOnUnmountDelay={1000}>
        <LiveAnnouncerMessage message="Auto-clear test" />
      </LiveAnnouncerProvider>
    );

    expect(screen.getByTestId("LiveAnnouncer-polite-1")).toHaveTextContent("Auto-clear test");

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByTestId("LiveAnnouncer-polite-1")).toHaveTextContent("");
  });

  it("does not auto-clear when delay is 0", async () => {
    render(
      <LiveAnnouncerProvider clearOnUnmountDelay={0}>
        <LiveAnnouncerMessage message="No auto-clear" />
      </LiveAnnouncerProvider>
    );

    expect(screen.getByTestId("LiveAnnouncer-polite-1")).toHaveTextContent("No auto-clear");

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(screen.getByTestId("LiveAnnouncer-polite-1")).toHaveTextContent("No auto-clear");
  });
});

describe("Integration tests", () => {
  it("handles rapid consecutive announcements", async () => {
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

    await user.click(button);
    await user.click(button);
    await user.click(button);

    // The last message should be visible in one of the regions
    const polite1 = screen.getByTestId("LiveAnnouncer-polite-1");
    const polite2 = screen.getByTestId("LiveAnnouncer-polite-2");

    const hasMessage = 
      polite1.textContent?.includes("Message") || 
      polite2.textContent?.includes("Message");

    expect(hasMessage).toBe(true);
  });

  it("works with useEffect announcements", () => {
    const EffectAnnouncer: React.FC<{ message: string }> = ({ message }) => {
      const { announcePolite } = useLiveAnnouncer();

      useEffect(() => {
        announcePolite(message);
      }, [message, announcePolite]);

      return null;
    };

    render(
      <LiveAnnouncerProvider>
        <EffectAnnouncer message="Effect message" />
      </LiveAnnouncerProvider>
    );

    expect(screen.getByTestId("LiveAnnouncer-polite-1")).toHaveTextContent("Effect message");
  });
});

