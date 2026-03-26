import { useMemo, useState } from "react";
import { CreditCard, Landmark, Smartphone, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { BookingData } from "./BookingDetailsView";

type PaymentMethod =
  | "Cash"
  | "Credit/Debit Card"
  | "UPI"
  | "Bank Transfer"
  | "Cheque"
  | "Online Payment"
  | "Digital Wallet";

const METHODS: { label: PaymentMethod; icon: React.ComponentType<{ className?: string }> }[] = [
  { label: "Cash", icon: Wallet },
  { label: "Credit/Debit Card", icon: CreditCard },
  { label: "UPI", icon: Smartphone },
  { label: "Bank Transfer", icon: Landmark },
  { label: "Cheque", icon: CreditCard },
  { label: "Online Payment", icon: CreditCard },
  { label: "Digital Wallet", icon: Smartphone },
];

interface BookingPaymentPanelProps {
  booking: BookingData;
  onComplete: (payload: { amount: number; method: PaymentMethod; receiptNo?: string; notes?: string }) => void;
  onCancel: () => void;
}

function inr(n: number) {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

export function BookingPaymentPanel({ booking, onComplete, onCancel }: BookingPaymentPanelProps) {
  const [method, setMethod] = useState<PaymentMethod>("Cash");
  const [amount, setAmount] = useState<number>(Math.max(0, booking.balanceDue));
  const [receiptNo, setReceiptNo] = useState("");
  const [notes, setNotes] = useState("");

  const amountLeft = useMemo(() => Math.max(0, booking.balanceDue - Math.max(0, amount)), [amount, booking.balanceDue]);
  const isValid = amount > 0 && amount <= Math.max(0, booking.balanceDue);

  return (
    <div className="h-full flex flex-col gap-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Complete Payment</h3>
        <p className="text-sm text-muted-foreground">Secure and encrypted transaction</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_1.3fr] gap-4 flex-1 min-h-0">
        <div className="space-y-3">
          <Label className="text-sm font-medium">Payment method</Label>
          <div className="grid grid-cols-2 gap-2">
            {METHODS.map((m) => {
              const Icon = m.icon;
              const active = method === m.label;
              return (
                <button
                  key={m.label}
                  type="button"
                  className={`rounded-md border p-3 text-left transition-colors ${
                    active ? "border-success bg-success/10" : "border-border hover:bg-muted/60"
                  }`}
                  onClick={() => setMethod(m.label)}
                >
                  <Icon className="h-4 w-4 text-muted-foreground mb-2" />
                  <div className="text-sm font-medium text-foreground">{m.label}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <Label htmlFor="payAmount" className="text-sm font-medium">Amount *</Label>
          <Input
            id="payAmount"
            type="number"
            min={0}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
          <p className="text-xs text-muted-foreground">
            Balance due: <strong>{inr(Math.max(0, booking.balanceDue))}</strong> - Remaining after payment:{" "}
            <strong>{inr(amountLeft)}</strong>
          </p>

          <div className="space-y-1.5">
            <Label htmlFor="receiptNo" className="text-sm">Receipt number</Label>
            <Input
              id="receiptNo"
              placeholder="Enter receipt number"
              value={receiptNo}
              onChange={(e) => setReceiptNo(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="paymentNotes" className="text-sm">Notes (optional)</Label>
            <Textarea
              id="paymentNotes"
              placeholder="Add any additional information..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[96px]"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-4 flex items-center justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button
          onClick={() => onComplete({ amount, method, receiptNo: receiptNo.trim() || undefined, notes: notes.trim() || undefined })}
          disabled={!isValid}
        >
          Complete Payment
        </Button>
      </div>
    </div>
  );
}

