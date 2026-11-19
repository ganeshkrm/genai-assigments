import { StatusDot } from "./StatusDot";
import { BrandLogo } from "./BrandLogo";

/**
 * BrandAvatar — header brand block: logo placeholder + product name +
 * department label + online status.
 */
export function BrandAvatar() {
  return (
    <div className="flex items-center gap-3">
      <BrandLogo size={40} />
      <div>
        <div className="text-sm font-semibold text-text-primary">RecruitBot</div>
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <StatusDot /> Talent Acquisition
        </div>
      </div>
    </div>
  );
}

export default BrandAvatar;
