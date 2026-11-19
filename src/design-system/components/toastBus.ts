type Listener = (message: string) => void;
const listeners = new Set<Listener>();

/** Show a success toast from anywhere (survives navigation; host lives in AppLayout). */
export const showSuccessToast = (message: string) => {
  listeners.forEach((l) => l(message));
};

export const subscribeSuccessToast = (listener: Listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
