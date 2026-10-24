import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from "react";
import { CheckCircle2, X, XCircle } from "lucide-react";

type ToastItem = { id: number; message: string; kind: "success" | "error" };
type ToastContextValue = (message: string, kind?: ToastItem["kind"]) => void;
const ToastContext = createContext<ToastContextValue>(() => undefined);

export function ToastProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const notify = useCallback((message: string, kind: ToastItem["kind"] = "success") => {
    const id = Date.now() + Math.random();
    setItems((current) => [...current, { id, message, kind }]);
    window.setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), 4200);
  }, []);
  const value = useMemo(() => notify, [notify]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="false">
        {items.map((item) => (
          <div className={`toast toast-${item.kind}`} key={item.id} role="status">
            {item.kind === "success" ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            <span>{item.message}</span>
            <button
              className="toast-close"
              aria-label="Dismiss notification"
              onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
