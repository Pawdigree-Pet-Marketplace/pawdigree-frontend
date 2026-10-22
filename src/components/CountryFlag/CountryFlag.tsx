import type { ComponentType, SVGProps } from "react";
import * as flags from "country-flag-icons/react/3x2";

type FlagComponent = ComponentType<SVGProps<SVGSVGElement>>;
type CountryFlagProps = {
  countryCode?: string | null;
  className?: string;
};

export default function CountryFlag({
  countryCode,
  className,
}: CountryFlagProps) {
  const code = countryCode?.trim().toUpperCase();

  if (!code) return null;

  const Flag = flags[code as keyof typeof flags] as FlagComponent | undefined;

  if (!Flag) return null;

  return (
    <Flag
      className={className}
      width="24"
      height="16"
      role="img"
      aria-label={`${code} flag`}
    />
  );
}
