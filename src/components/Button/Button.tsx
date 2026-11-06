import "./Button.css";

type ButtonProps = {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  onClick?: () => void;
  className?: string;
};

const Button = ({
  children,
  variant = "primary",
  onClick,
  className,
}: ButtonProps) => {
  return (
    <button
      type="button"
      className={`btn btn-${variant} ${className || ""}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;
