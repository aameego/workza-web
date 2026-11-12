import { Eye, MapPin } from "lucide-react";

/** Figma table location cell: 12px pin + eye, 6 apart, opening the map; "-" when unknown. */
export default function LocationIcons({ url }: { url?: string | null }) {
  if (!url) return <>-</>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 text-wz-heading hover:text-wz-primary"
      aria-label="Open location on map"
    >
      <MapPin size={12} aria-hidden />
      <Eye size={12} aria-hidden />
    </a>
  );
}
