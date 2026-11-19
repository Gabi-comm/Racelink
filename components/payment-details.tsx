import { PAYMENT_METHOD_LABEL, type PaymentMethod } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type PaymentInfo = {
  paymentMethod: PaymentMethod | null;
  paymentBank: string | null;
  paymentAccountName: string | null;
  paymentAccountNumber: string | null;
  paymentInstructions: string | null;
};

// kung saan magbabayad ang runner, galing sa event
export function PaymentDetails({ info, className }: { info: PaymentInfo; className?: string }) {
  const { paymentMethod: method, paymentAccountName: name, paymentAccountNumber: number } = info;
  if (!method && !info.paymentInstructions) return null;

  return (
    <div className={cn("grid gap-2 text-sm", className)}>
      {method && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          <dt className="text-muted-foreground">Pay via</dt>
          <dd className="font-semibold">
            {method === "bank" && info.paymentBank ? `${info.paymentBank} (bank transfer)` : PAYMENT_METHOD_LABEL[method]}
          </dd>
          {name && (
            <>
              <dt className="text-muted-foreground">Account name</dt>
              <dd className="font-semibold">{name}</dd>
            </>
          )}
          {number && (
            <>
              <dt className="text-muted-foreground">{method === "bank" ? "Account number" : "GCash number"}</dt>
              <dd className="font-semibold tabular-nums">{number}</dd>
            </>
          )}
        </dl>
      )}
      {info.paymentInstructions && <p className="leading-relaxed whitespace-pre-line">{info.paymentInstructions}</p>}
    </div>
  );
}
