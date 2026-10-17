
import type { ReactNode } from "react";
import "./VendorPageHeader.css";

type VendorPageHeaderProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export default function VendorPageHeader({
  title,
  description,
  action,
}: VendorPageHeaderProps) {
  return (
    <div className="vendor-page-heading">
      <div className="vendor-page-heading-copy">
        <h1>{title}</h1>
        <p className="vendor-page-description">{description}</p>
      </div>

      {action && (
        <div className="vendor-page-heading-action">{action}</div>
      )}
    </div>
  );
}
