import { cn } from "@/lib/utils";

// runner -> ec2 (public subnet) -> rds (private subnet), ec2 -> s3 via iam role
export function AwsDiagram({ className }: { className?: string }) {
  const box = "fill-card stroke-border";
  const label = "fill-foreground font-display text-[15px] font-bold";
  const sub = "fill-muted-foreground text-[12px]";
  return (
    <svg
      viewBox="0 0 520 400"
      role="img"
      aria-labelledby="aws-diagram-title aws-diagram-desc"
      className={cn("h-auto w-full", className)}
    >
      <title id="aws-diagram-title">RaceLink architecture on AWS</title>
      <desc id="aws-diagram-desc">
        Runners connect over the internet to Nginx and the Next.js app on EC2 in a public subnet. The app reads and
        writes MySQL on RDS in a private subnet, and stores files in a private S3 bucket using an IAM role.
      </desc>
      <defs>
        <marker id="aws-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" className="fill-primary" />
        </marker>
      </defs>

      {/* runner */}
      <rect x="185" y="8" width="150" height="48" rx="8" className={box} />
      <text x="260" y="30" textAnchor="middle" className={label}>Runners</text>
      <text x="260" y="46" textAnchor="middle" className={sub}>Browser, HTTPS</text>

      {/* vpc */}
      <rect x="8" y="84" width="350" height="306" rx="10" className="fill-none stroke-primary/50" strokeDasharray="6 5" strokeWidth="1.5" />
      <text x="22" y="106" className="fill-primary font-display text-[14px] font-bold">VPC</text>

      {/* public subnet */}
      <rect x="28" y="118" width="310" height="110" rx="8" className="fill-primary/5 stroke-primary/25" />
      <text x="42" y="138" className={sub}>Public subnet</text>
      <rect x="110" y="148" width="210" height="64" rx="8" className={box} />
      <text x="215" y="174" textAnchor="middle" className={label}>EC2</text>
      <text x="215" y="192" textAnchor="middle" className={sub}>Nginx + Next.js app</text>

      {/* private subnet */}
      <rect x="28" y="252" width="310" height="122" rx="8" className="fill-muted/60 stroke-border" />
      <text x="42" y="272" className={sub}>Private subnets</text>
      <rect x="110" y="286" width="210" height="64" rx="8" className={box} />
      <text x="215" y="312" textAnchor="middle" className={label}>RDS MySQL</text>
      <text x="215" y="330" textAnchor="middle" className={sub}>Races, bookings, accounts</text>

      {/* s3 */}
      <rect x="380" y="148" width="132" height="64" rx="8" className={box} />
      <text x="446" y="174" textAnchor="middle" className={label}>S3 bucket</text>
      <text x="446" y="192" textAnchor="middle" className={sub}>Receipts, race files</text>

      {/* arrows */}
      <line x1="232" y1="56" x2="232" y2="146" className="stroke-primary" strokeWidth="2" markerEnd="url(#aws-arrow)" />
      <line x1="215" y1="212" x2="215" y2="284" className="stroke-primary" strokeWidth="2" markerEnd="url(#aws-arrow)" />
      <text x="224" y="252" className={sub}>port 3306, app only</text>
      <line x1="320" y1="180" x2="378" y2="180" className="stroke-primary" strokeWidth="2" markerEnd="url(#aws-arrow)" />
      <text x="349" y="236" textAnchor="middle" className={sub}>
        <tspan x="446" dy="0">IAM role,</tspan>
        <tspan x="446" dy="15">no keys</tspan>
      </text>
    </svg>
  );
}
