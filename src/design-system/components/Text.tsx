import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "../cn";

export type TextVariant =
  | "display"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "body-lg"
  | "body"
  | "body-md"
  | "caption"
  | "overline";

const DEFAULT_TAG: Record<TextVariant, ElementType> = {
  display: "h1",
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  "body-lg": "p",
  body: "p",
  "body-md": "p",
  caption: "span",
  overline: "span",
};

const variantClass: Record<TextVariant, string> = {
  display: "text-5xl font-bold leading-14",
  h1: "text-4xl font-bold leading-11",
  h2: "text-[28px] font-semibold leading-9",
  h3: "text-[22px] font-semibold leading-7",
  h4: "text-lg font-semibold leading-6",
  "body-lg": "text-base font-normal leading-6",
  body: "text-sm font-normal leading-5",
  "body-md": "text-sm font-semibold leading-5",
  caption: "text-xs font-normal leading-4",
  overline: "text-xs font-semibold leading-4 tracking-wider uppercase",
};

export type TextProps = HTMLAttributes<HTMLElement> & {
  variant?: TextVariant;
  muted?: boolean;
  inverse?: boolean;
  as?: ElementType;
  children: ReactNode;
};

/** Figma typography scale as a single Text primitive */
export function Text({
  variant = "body",
  muted = false,
  inverse = false,
  as,
  className,
  children,
  ...rest
}: TextProps) {
  const Tag = as ?? DEFAULT_TAG[variant];
  return (
    <Tag
      className={cn(
        "m-0 font-sans",
        variantClass[variant],
        muted ? "text-wz-text-secondary" : "text-wz-text",
        inverse && "text-white",
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
