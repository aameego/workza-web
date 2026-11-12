/**
 * Workza Design System — public API.
 * Agents and app code MUST import UI primitives and tokens from here
 * (or `./tokens` / CSS vars), not invent one-off colors/fonts.
 */

export { tokens, brand, neutral, semantic, shell, radius, space, typography, figma } from "./tokens";
export type { BrandToken, NeutralToken, SemanticToken } from "./tokens";

export { cn } from "./cn";

export { Button } from "./components/Button";
export type { ButtonProps, ButtonVariant, ButtonSize } from "./components/Button";

export { Badge } from "./components/Badge";
export type { BadgeProps, BadgeStatus, BadgeSize } from "./components/Badge";

export { Avatar } from "./components/Avatar";
export type { AvatarProps, AvatarSize } from "./components/Avatar";

export { IconButton } from "./components/IconButton";
export type { IconButtonProps } from "./components/IconButton";

export { Card } from "./components/Card";
export type { CardProps } from "./components/Card";

export { Text } from "./components/Text";
export type { TextProps, TextVariant } from "./components/Text";

export { Field } from "./components/Field";
export type { FieldProps } from "./components/Field";

export { Input, TextArea } from "./components/Input";
export type { InputProps, TextAreaProps } from "./components/Input";

export { Select } from "./components/Select";
export type { SelectProps } from "./components/Select";

export { Modal } from "./components/Modal";
export type { ModalProps } from "./components/Modal";

export { TabSwitcher } from "./components/TabSwitcher";
export type { TabSwitcherItem, TabSwitcherProps } from "./components/TabSwitcher";

export { FilterSelect } from "./components/FilterSelect";
export { MonthSelect } from "./components/MonthSelect";
export { Pagination } from "./components/Pagination";
export { paginationItems } from "./components/paginationItems";
export type { FilterSelectProps } from "./components/FilterSelect";

export {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSectionToggle,
  DropdownMenuSeparator,
} from "./components/DropdownMenu";
export type {
  DropdownMenuProps,
  DropdownMenuItemProps,
  DropdownMenuSectionToggleProps,
} from "./components/DropdownMenu";


export { ConfirmDialog } from "./components/ConfirmDialog";
export type { ConfirmDialogProps, ConfirmTone } from "./components/ConfirmDialog";
export { SegmentedToggle } from "./components/SegmentedToggle";
export type { SegmentedToggleProps } from "./components/SegmentedToggle";
export { FileUploadZone } from "./components/FileUploadZone";
export type { FileUploadZoneProps, UploadState } from "./components/FileUploadZone";
export { SearchableSelect } from "./components/SearchableSelect";
export type { SearchableSelectOption, SearchableSelectProps } from "./components/SearchableSelect";
