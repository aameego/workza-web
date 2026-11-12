/** Stable avatar fill per person (Figma uses a few brand tints for initials). */
const AVATAR_TONES = [
  "bg-[#1f5da3]",
  "bg-[#12b76a]",
  "bg-[#f79009]",
  "bg-[#7a5af8]",
  "bg-[#ee46bc]",
  "bg-[#0ba5ec]",
] as const;

export const avatarTone = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i) * (i + 1)) % AVATAR_TONES.length;
  }
  return AVATAR_TONES[hash] || AVATAR_TONES[0];
};
