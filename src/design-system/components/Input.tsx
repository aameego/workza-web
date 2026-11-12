import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "../cn";

const controlBase =
  "w-full min-h-[42px] px-3 py-2.5 rounded-wz-md border border-wz-border bg-white text-wz-heading text-sm leading-5 outline-none transition-[border-color,box-shadow,background-color] placeholder:text-wz-text-muted hover:enabled:border-wz-neutral-400 focus:border-wz-primary focus:shadow-[0_0_0_1px_var(--wz-primary)] disabled:bg-wz-neutral-100 disabled:border-wz-neutral-200 disabled:text-wz-neutral-500 disabled:cursor-not-allowed";

const invalidClass =
  "border-wz-error focus:border-wz-error focus:shadow-[0_0_0_1px_var(--wz-error)]";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

/** Figma Form/Input — default / focus / error / disabled */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ className, invalid = false, ...rest }, ref) {
    return (
      <input
        ref={ref}
        className={cn(controlBase, invalid && invalidClass, className)}
        aria-invalid={invalid || undefined}
        {...rest}
      />
    );
  },
);

export type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
};

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  function TextArea({ className, invalid = false, rows = 3, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={cn(
          controlBase,
          "min-h-20 resize-y",
          invalid && invalidClass,
          className,
        )}
        aria-invalid={invalid || undefined}
        {...rest}
      />
    );
  },
);
