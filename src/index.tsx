import React, {
  createContext,
  useContext,
  useRef,
  useCallback,
  useEffect,
  useState,
  ReactNode,
} from "react";

export type A11yAnnouncerPriority = "polite" | "assertive";

export interface A11yAnnouncerOptions {
  priority?: A11yAnnouncerPriority;
  id?: string;
}

export interface A11yAnnouncerContextValue {
  announce: (message: string, options?: A11yAnnouncerOptions) => void;
  announcePolite: (message: string, id?: string) => void;
  announceAssertive: (message: string, id?: string) => void;
  clearAnnouncements: () => void;
}

interface AnnouncementState {
  message: string;
  id: string;
}

const visuallyHiddenStyle: React.CSSProperties = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
};

const A11yAnnouncerContext = createContext<A11yAnnouncerContextValue | null>(
  null
);

interface DoubleAnnouncerProps {
  polite1: string;
  polite2: string;
  assertive1: string;
  assertive2: string;
}

const DoubleAnnouncer: React.FC<DoubleAnnouncerProps> = ({
  polite1,
  polite2,
  assertive1,
  assertive2,
}) => {
  return (
    <div style={visuallyHiddenStyle} data-testid="A11yAnnouncer-container">
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        data-testid="A11yAnnouncer-polite-1"
      >
        {polite1}
      </div>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        data-testid="A11yAnnouncer-polite-2"
      >
        {polite2}
      </div>
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        data-testid="A11yAnnouncer-assertive-1"
      >
        {assertive1}
      </div>
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        data-testid="A11yAnnouncer-assertive-2"
      >
        {assertive2}
      </div>
    </div>
  );
};

export interface A11yAnnouncerProviderProps {
  children: ReactNode;
  clearOnUnmountDelay?: number;
}

export const A11yAnnouncerProvider: React.FC<A11yAnnouncerProviderProps> = ({
  children,
  clearOnUnmountDelay = 7000,
}) => {
  const politeIndexRef = useRef(0);
  const assertiveIndexRef = useRef(0);

  const [polite1, setPolite1] = useState("");
  const [polite2, setPolite2] = useState("");
  const [assertive1, setAssertive1] = useState("");
  const [assertive2, setAssertive2] = useState("");

  const lastPoliteRef = useRef<AnnouncementState>({ message: "", id: "" });
  const lastAssertiveRef = useRef<AnnouncementState>({ message: "", id: "" });

  const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const generateId = useCallback(() => {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }, []);

  const clearAnnouncements = useCallback(() => {
    setPolite1("");
    setPolite2("");
    setAssertive1("");
    setAssertive2("");
    lastPoliteRef.current = { message: "", id: "" };
    lastAssertiveRef.current = { message: "", id: "" };
  }, []);

  const announce = useCallback(
    (message: string, options: A11yAnnouncerOptions = {}) => {
      const { priority = "polite", id } = options;
      const announcementId = id || generateId();

      if (priority === "assertive") {
        const lastState = lastAssertiveRef.current;

        if (lastState.message === message && lastState.id === id && id) {
          return;
        }

        const currentIndex = assertiveIndexRef.current;
        if (currentIndex === 0) {
          setAssertive1(message);
          setAssertive2("");
        } else {
          setAssertive2(message);
          setAssertive1("");
        }
        assertiveIndexRef.current = currentIndex === 0 ? 1 : 0;
        lastAssertiveRef.current = { message, id: announcementId };
      } else {
        const lastState = lastPoliteRef.current;

        if (lastState.message === message && lastState.id === id && id) {
          return;
        }

        const currentIndex = politeIndexRef.current;
        if (currentIndex === 0) {
          setPolite1(message);
          setPolite2("");
        } else {
          setPolite2(message);
          setPolite1("");
        }
        politeIndexRef.current = currentIndex === 0 ? 1 : 0;
        lastPoliteRef.current = { message, id: announcementId };
      }

      if (clearOnUnmountDelay > 0) {
        if (clearTimeoutRef.current) {
          clearTimeout(clearTimeoutRef.current);
        }
        clearTimeoutRef.current = setTimeout(() => {
          clearAnnouncements();
        }, clearOnUnmountDelay);
      }
    },
    [generateId, clearOnUnmountDelay, clearAnnouncements]
  );

  const announcePolite = useCallback(
    (message: string, id?: string) => {
      announce(message, { priority: "polite", id });
    },
    [announce]
  );

  const announceAssertive = useCallback(
    (message: string, id?: string) => {
      announce(message, { priority: "assertive", id });
    },
    [announce]
  );

  useEffect(() => {
    return () => {
      if (clearTimeoutRef.current) {
        clearTimeout(clearTimeoutRef.current);
      }
    };
  }, []);

  const contextValue: A11yAnnouncerContextValue = {
    announce,
    announcePolite,
    announceAssertive,
    clearAnnouncements,
  };

  return (
    <A11yAnnouncerContext.Provider value={contextValue}>
      {children}
      <DoubleAnnouncer
        polite1={polite1}
        polite2={polite2}
        assertive1={assertive1}
        assertive2={assertive2}
      />
    </A11yAnnouncerContext.Provider>
  );
};

export const useA11yAnnouncer = (): A11yAnnouncerContextValue => {
  const context = useContext(A11yAnnouncerContext);

  if (!context) {
    throw new Error(
      "useA11yAnnouncer must be used within an A11yAnnouncerProvider"
    );
  }

  return context;
};

export interface A11yAnnouncerMessageProps {
  message: string;
  priority?: A11yAnnouncerPriority;
  id?: string;
  clearOnUnmount?: boolean;
}

export const A11yAnnouncerMessage: React.FC<A11yAnnouncerMessageProps> = ({
  message,
  priority = "polite",
  id,
  clearOnUnmount = false,
}) => {
  const { announce, clearAnnouncements } = useA11yAnnouncer();
  const previousMessageRef = useRef<string>("");
  const previousIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (message && (message !== previousMessageRef.current || id !== previousIdRef.current)) {
      announce(message, { priority, id });
      previousMessageRef.current = message;
      previousIdRef.current = id;
    }
  }, [message, priority, id, announce]);

  useEffect(() => {
    return () => {
      if (clearOnUnmount) {
        clearAnnouncements();
      }
    };
  }, [clearOnUnmount, clearAnnouncements]);

  return null;
};

export interface A11yAnnouncerMessengerProps {
  children: (context: A11yAnnouncerContextValue) => ReactNode;
}

export const A11yAnnouncerMessenger: React.FC<A11yAnnouncerMessengerProps> = ({
  children,
}) => {
  const context = useA11yAnnouncer();
  return <>{children(context)}</>;
};

export { A11yAnnouncerContext };

export default {
  A11yAnnouncerProvider,
  useA11yAnnouncer,
  A11yAnnouncerMessage,
  A11yAnnouncerMessenger,
  A11yAnnouncerContext,
};
