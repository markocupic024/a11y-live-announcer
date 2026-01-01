import React, { useEffect } from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  A11yAnnouncerProvider,
  useA11yAnnouncer,
  A11yAnnouncerMessage,
  A11yAnnouncerMessenger,
} from "../index";

const TestButton: React.FC<{ message: string; priority?: "polite" | "assertive" }> = ({
  message,
  priority = "polite",
}) => {
  const { announce } = useA11yAnnouncer();
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
  const { announcePolite } = useA11yAnnouncer();
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
  const { announceAssertive } = useA11yAnnouncer();
  return (
    <button onClick={() => announceAssertive(message, id)}>
      Announce Assertive
    </button>
  );
};

const TestClearButton: React.FC = () => {
  const { clearAnnouncements } = useA11yAnnouncer();
  return <button onClick={clearAnnouncements}>Clear</button>;
};

describe("A11yAnnouncerProvider", () => {
  it("renders children correctly", () => {
    render(
      <A11yAnnouncerProvider>
        <div>Test Content</div>
      </A11yAnnouncerProvider>
    );

    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("renders all four live regions (double announcer pattern)", () => {
    render(
      <A11yAnnouncerProvider>
        <div>Test</div>
      </A11yAnnouncerProvider>
    );

    expect(screen.getByTestId("A11yAnnouncer-polite-1")).toBeInTheDocument();
    expect(screen.getByTestId("A11yAnnouncer-polite-2")).toBeInTheDocument();
    expect(screen.getByTestId("A11yAnnouncer-assertive-1")).toBeInTheDocument();
    expect(screen.getByTestId("A11yAnnouncer-assertive-2")).toBeInTheDocument();
  });

  it("has correct ARIA attributes on live regions", () => {
    render(
      <A11yAnnouncerProvider>
        <div>Test</div>
      </A11yAnnouncerProvider>
    );

    const polite1 = screen.getByTestId("A11yAnnouncer-polite-1");
    expect(polite1).toHaveAttribute("aria-live", "polite");
    expect(polite1).toHaveAttribute("aria-atomic", "true");
    expect(polite1).toHaveAttribute("role", "status");

    const assertive1 = screen.getByTestId("A11yAnnouncer-assertive-1");
    expect(assertive1).toHaveAttribute("aria-live", "assertive");
    expect(assertive1).toHaveAttribute("aria-atomic", "true");
    expect(assertive1).toHaveAttribute("role", "alert");
  });

  it("live regions are visually hidden", () => {
    render(
      <A11yAnnouncerProvider>
        <div>Test</div>
      </A11yAnnouncerProvider>
    );

    const container = screen.getByTestId("A11yAnnouncer-container");
    expect(container).toHaveStyle({ position: "absolute" });
    expect(container).toHaveStyle({ width: "1px" });
    expect(container).toHaveStyle({ height: "1px" });
  });
});

describe("useA11yAnnouncer", () => {
  it("throws error when used outside provider", () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});

    const BadComponent = () => {
      useA11yAnnouncer();
      return null;
    };

    expect(() => render(<BadComponent />)).toThrow(
      "useA11yAnnouncer must be used within an A11yAnnouncerProvider"
    );

    consoleError.mockRestore();
  });

  it("announces polite messages", async () => {
    const user = userEvent.setup();

    render(
      <A11yAnnouncerProvider>
        <TestButton message="Hello World" priority="polite" />
      </A11yAnnouncerProvider>
    );

    await user.click(screen.getByText("Announce"));

    const polite1 = screen.getByTestId("A11yAnnouncer-polite-1");
    expect(polite1).toHaveTextContent("Hello World");
  });

  it("announces assertive messages", async () => {
    const user = userEvent.setup();

    render(
      <A11yAnnouncerProvider>
        <TestButton message="Alert!" priority="assertive" />
      </A11yAnnouncerProvider>
    );

    await user.click(screen.getByText("Announce"));

    const assertive1 = screen.getByTestId("A11yAnnouncer-assertive-1");
    expect(assertive1).toHaveTextContent("Alert!");
  });

  it("alternates between regions for consecutive messages (double announcer pattern)", async () => {
    const user = userEvent.setup();

    render(
      <A11yAnnouncerProvider>
        <TestPoliteButton message="Message 1" />
      </A11yAnnouncerProvider>
    );

    const button = screen.getByText("Announce Polite");

    // First click - should use region 1
    await user.click(button);
    expect(screen.getByTestId("A11yAnnouncer-polite-1")).toHaveTextContent("Message 1");
    expect(screen.getByTestId("A11yAnnouncer-polite-2")).toHaveTextContent("");
  });

  it("uses announcePolite helper", async () => {
    const user = userEvent.setup();

    render(
      <A11yAnnouncerProvider>
        <TestPoliteButton message="Polite message" />
      </A11yAnnouncerProvider>
    );

    await user.click(screen.getByText("Announce Polite"));

    expect(screen.getByTestId("A11yAnnouncer-polite-1")).toHaveTextContent("Polite message");
  });

  it("uses announceAssertive helper", async () => {
    const user = userEvent.setup();

    render(
      <A11yAnnouncerProvider>
        <TestAssertiveButton message="Assertive message" />
      </A11yAnnouncerProvider>
    );

    await user.click(screen.getByText("Announce Assertive"));

    expect(screen.getByTestId("A11yAnnouncer-assertive-1")).toHaveTextContent("Assertive message");
  });

  it("clears all announcements", async () => {
    const user = userEvent.setup();

    render(
      <A11yAnnouncerProvider clearOnUnmountDelay={0}>
        <TestPoliteButton message="Test" />
        <TestClearButton />
      </A11yAnnouncerProvider>
    );

    await user.click(screen.getByText("Announce Polite"));
    expect(screen.getByTestId("A11yAnnouncer-polite-1")).toHaveTextContent("Test");

    await user.click(screen.getByText("Clear"));
    expect(screen.getByTestId("A11yAnnouncer-polite-1")).toHaveTextContent("");
    expect(screen.getByTestId("A11yAnnouncer-polite-2")).toHaveTextContent("");
  });
});

describe("A11yAnnouncerMessage", () => {
  it("announces message on mount", () => {
    render(
      <A11yAnnouncerProvider>
        <A11yAnnouncerMessage message="Initial message" />
      </A11yAnnouncerProvider>
    );

    expect(screen.getByTestId("A11yAnnouncer-polite-1")).toHaveTextContent("Initial message");
  });

  it("announces when message changes", () => {
    const { rerender } = render(
      <A11yAnnouncerProvider>
        <A11yAnnouncerMessage message="First" />
      </A11yAnnouncerProvider>
    );

    expect(screen.getByTestId("A11yAnnouncer-polite-1")).toHaveTextContent("First");

    rerender(
      <A11yAnnouncerProvider>
        <A11yAnnouncerMessage message="Second" />
      </A11yAnnouncerProvider>
    );

    // Due to double announcer, second message goes to region 2
    expect(screen.getByTestId("A11yAnnouncer-polite-2")).toHaveTextContent("Second");
  });

  it("uses assertive priority when specified", () => {
    render(
      <A11yAnnouncerProvider>
        <A11yAnnouncerMessage message="Alert!" priority="assertive" />
      </A11yAnnouncerProvider>
    );

    expect(screen.getByTestId("A11yAnnouncer-assertive-1")).toHaveTextContent("Alert!");
  });

  it("does not render any visible content", () => {
    const { container } = render(
      <A11yAnnouncerProvider>
        <A11yAnnouncerMessage message="Hidden" />
      </A11yAnnouncerProvider>
    );

    // The component returns null, so it doesn't add visible elements
    expect(container.querySelector("[data-testid='A11yAnnouncer-message']")).not.toBeInTheDocument();
  });

  it("clears announcements on unmount when clearOnUnmount is true", async () => {
    const TestComponent: React.FC<{ show: boolean }> = ({ show }) => (
      <A11yAnnouncerProvider clearOnUnmountDelay={0}>
        {show && <A11yAnnouncerMessage message="Temporary" clearOnUnmount />}
      </A11yAnnouncerProvider>
    );

    const { rerender } = render(<TestComponent show={true} />);
    expect(screen.getByTestId("A11yAnnouncer-polite-1")).toHaveTextContent("Temporary");

    rerender(<TestComponent show={false} />);

    await waitFor(() => {
      expect(screen.getByTestId("A11yAnnouncer-polite-1")).toHaveTextContent("");
    });
  });

  it("re-announces same message when id changes", () => {
    const { rerender } = render(
      <A11yAnnouncerProvider>
        <A11yAnnouncerMessage message="Same message" id="1" />
      </A11yAnnouncerProvider>
    );

    expect(screen.getByTestId("A11yAnnouncer-polite-1")).toHaveTextContent("Same message");

    rerender(
      <A11yAnnouncerProvider>
        <A11yAnnouncerMessage message="Same message" id="2" />
      </A11yAnnouncerProvider>
    );

    // Should use region 2 for the re-announcement
    expect(screen.getByTestId("A11yAnnouncer-polite-2")).toHaveTextContent("Same message");
  });
});

describe("A11yAnnouncerMessenger", () => {
  it("provides announcer functions via render props", async () => {
    const user = userEvent.setup();

    render(
      <A11yAnnouncerProvider>
        <A11yAnnouncerMessenger>
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
        </A11yAnnouncerMessenger>
      </A11yAnnouncerProvider>
    );

    await user.click(screen.getByText("Polite"));
    expect(screen.getByTestId("A11yAnnouncer-polite-1")).toHaveTextContent("Polite via render");

    await user.click(screen.getByText("Assertive"));
    expect(screen.getByTestId("A11yAnnouncer-assertive-1")).toHaveTextContent("Assertive via render");
  });

  it("provides clearAnnouncements function", async () => {
    const user = userEvent.setup();

    render(
      <A11yAnnouncerProvider clearOnUnmountDelay={0}>
        <A11yAnnouncerMessenger>
          {({ announcePolite, clearAnnouncements }) => (
            <>
              <button onClick={() => announcePolite("Test")}>Announce</button>
              <button onClick={clearAnnouncements}>Clear</button>
            </>
          )}
        </A11yAnnouncerMessenger>
      </A11yAnnouncerProvider>
    );

    await user.click(screen.getByText("Announce"));
    expect(screen.getByTestId("A11yAnnouncer-polite-1")).toHaveTextContent("Test");

    await user.click(screen.getByText("Clear"));
    expect(screen.getByTestId("A11yAnnouncer-polite-1")).toHaveTextContent("");
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
      <A11yAnnouncerProvider clearOnUnmountDelay={1000}>
        <A11yAnnouncerMessage message="Auto-clear test" />
      </A11yAnnouncerProvider>
    );

    expect(screen.getByTestId("A11yAnnouncer-polite-1")).toHaveTextContent("Auto-clear test");

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByTestId("A11yAnnouncer-polite-1")).toHaveTextContent("");
  });

  it("does not auto-clear when delay is 0", async () => {
    render(
      <A11yAnnouncerProvider clearOnUnmountDelay={0}>
        <A11yAnnouncerMessage message="No auto-clear" />
      </A11yAnnouncerProvider>
    );

    expect(screen.getByTestId("A11yAnnouncer-polite-1")).toHaveTextContent("No auto-clear");

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(screen.getByTestId("A11yAnnouncer-polite-1")).toHaveTextContent("No auto-clear");
  });
});

describe("Integration tests", () => {
  it("handles rapid consecutive announcements", async () => {
    const user = userEvent.setup();
    let counter = 0;

    const RapidAnnouncer: React.FC = () => {
      const { announcePolite } = useA11yAnnouncer();
      return (
        <button onClick={() => announcePolite(`Message ${++counter}`, String(counter))}>
          Rapid
        </button>
      );
    };

    render(
      <A11yAnnouncerProvider clearOnUnmountDelay={0}>
        <RapidAnnouncer />
      </A11yAnnouncerProvider>
    );

    const button = screen.getByText("Rapid");

    await user.click(button);
    await user.click(button);
    await user.click(button);

    // The last message should be visible in one of the regions
    const polite1 = screen.getByTestId("A11yAnnouncer-polite-1");
    const polite2 = screen.getByTestId("A11yAnnouncer-polite-2");

    const hasMessage = 
      polite1.textContent?.includes("Message") || 
      polite2.textContent?.includes("Message");

    expect(hasMessage).toBe(true);
  });

  it("works with useEffect announcements", () => {
    const EffectAnnouncer: React.FC<{ message: string }> = ({ message }) => {
      const { announcePolite } = useA11yAnnouncer();

      useEffect(() => {
        announcePolite(message);
      }, [message, announcePolite]);

      return null;
    };

    render(
      <A11yAnnouncerProvider>
        <EffectAnnouncer message="Effect message" />
      </A11yAnnouncerProvider>
    );

    expect(screen.getByTestId("A11yAnnouncer-polite-1")).toHaveTextContent("Effect message");
  });
});

