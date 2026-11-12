import type { HTMLAttributes } from "react";
import { cn } from "../cn";

export type AvatarSize = "xs" | "sm" | "md" | "lg";

export type AvatarProps = HTMLAttributes<HTMLSpanElement> & {
  initials?: string;
  src?: string;
  alt?: string;
  size?: AvatarSize;
};

const sizeClass: Record<AvatarSize, string> = {
  /** Figma Top Bar user-profile avatar */
  xs: "size-6 text-[8px]",
  /* Figma Foundation/Avatar: Small 28, Medium 36, Large 44 */
  sm: "size-7 text-[10px]",
  md: "size-9 text-xs",
  lg: "size-11 text-sm",
};

/** Figma Foundation/Avatar */
export function Avatar({
  initials = "?",
  src,
  alt = "",
  size = "md",
  className,
  ...rest
}: AvatarProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-wz-full bg-wz-primary font-semibold text-white select-none",
        sizeClass[size],
        className,
      )}
      aria-hidden={!src && !alt}
      {...rest}
    >
      {src ? (
        <img src={src} alt={alt} className="size-full object-cover" />
      ) : (
        initials.slice(0, 2).toUpperCase()
      )}
    </span>
  );
}
