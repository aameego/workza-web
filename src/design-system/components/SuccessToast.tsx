import { useEffect, useState } from "react";
import { subscribeSuccessToast } from "./toastBus";

export type SuccessToastProps = {
  message: string | null;
  /** Pass the state setter; called with null 3s after a message shows. */
  onClear: (value: null) => void;
};

/** Bottom-right green confirmation after a save. */
export function SuccessToast({ message, onClear }: SuccessToastProps) {
  useEffect(() => {
    if (!message) return undefined;
    const t = window.setTimeout(() => onClear(null), 3000);
    return () => window.clearTimeout(t);
  }, [message, onClear]);
  if (!message) return null;
  return (
    <p
      role="status"
      className="fixed right-6 bottom-6 z-90 m-0 rounded-wz-md bg-[#ecfdf3] px-4 py-3 text-sm font-semibold text-[#027a48] shadow-lg max-md:right-4 max-md:left-4"
    >
      {message}
    </p>
  );
}

/** App-wide host for showSuccessToast(); mounted once in AppLayout. */
export function SuccessToastHost() {
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => subscribeSuccessToast(setMessage), []);
  return <SuccessToast message={message} onClear={setMessage} />;
}
