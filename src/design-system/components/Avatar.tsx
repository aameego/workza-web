import type { HTMLAttributes } from "react";
import { cn } from "../cn";

export type AvatarSize = "sm" | "md" | "lg";

export type AvatarProps = HTMLAttributes<HTMLSpanElement> & {
  initials?: string;
  src?: string;
  alt?: string;
  size?: AvatarSize;
};

const sizeClass: Record<AvatarSize, string> = {
  sm: "size-6 text-[10px]",
  md: "size-8 text-[11px]",
  lg: "size-10 text-[13px]",
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
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-wz-full bg-wz-primary font-bold tracking-wide text-white select-none",
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
