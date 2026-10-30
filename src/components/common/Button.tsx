import type { ButtonHTMLAttributes } from "react";
import "./Button.css";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
}

/** Brand button. Defaults to type="button" so it never submits a form by accident. */
export default function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`pw-btn pw-btn--${variant} ${className}`.trim()}
      {...rest}
    />
  );
}
