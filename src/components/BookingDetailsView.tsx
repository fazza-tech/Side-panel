import { useState } from "react";
import { Phone, Bed, Calendar, Users, Clock, IndianRupee, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BookingAddOns, BookingAddOnsSummary, type AddTarget } from "@/components/BookingAddOns";

export interface PaymentHistoryItem {
  id: string;
  amount: number;
  method: string;
  paidAt: string;
  receiptNo?: string;
  notes?: string;
}

export interface BookingData {
  guestName: string;
  bookingId: string;
  phone: string;
  roomNumber: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  nights: number;
  invoiceId: string;
  paymentStatus: "Pending" | "Paid" | "Partial";
  total: number;
  balanceDue: number;
  advancePaid: number;
  /** All payments received toward this booking; defaults to advance when omitted */
  totalPaid?: number;
  paymentHistory?: PaymentHistoryItem[];
  discount: number;
  taxPercent: number;
  taxAmount: number;
  status: "Reserved" | "Checked In" | "Checked Out" | "Cancelled";
  tags: string[];
  splitBooking: boolean;
}

interface BookingDetailsViewProps {
  booking: BookingData;
  guestCount?: number;
  openAddTarget?: AddTarget | null;
  onOpenAddTargetHandled?: () => void;
  hideTopDetails?: boolean;
  onExitCrud?: () => void;
  onCrudOpenChange?: (open: boolean) => void;
  openPrintSignal?: number;
}

const statusColors: Record<string, string> = {
  Reserved: "bg-success/15 text-success border-success/30",
  "Checked In": "bg-primary/15 text-primary border-primary/30",
  "Checked Out": "bg-muted text-muted-foreground border-border",
  Cancelled: "bg-destructive/15 text-destructive border-destructive/30",
};

const paymentColors: Record<string, string> = {
  Pending: "bg-warning/15 text-warning border-warning/30",
  Paid: "bg-success/15 text-success border-success/30",
  Partial: "bg-primary/15 text-primary border-primary/30",
};

function formatInr(n: number) {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

export function BookingDetailsView({
  booking,
  guestCount = 0,
  openAddTarget,
  onOpenAddTargetHandled,
  hideTopDetails = false,
  onExitCrud,
  onCrudOpenChange,
  openPrintSignal,
}: BookingDetailsViewProps) {
  const totalPaid = booking.totalPaid ?? booking.advancePaid;
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const paymentHistory = booking.paymentHistory ?? [];
  return (
    <div className="space-y-5">
      {!hideTopDetails ? (
        <>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start">
            {/* Guest header */}
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-foreground truncate">{booking.guestName}</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm text-primary/70 font-medium">{booking.bookingId}</p>
                    {guestCount > 0 ? (
                      <span className="text-xs text-muted-foreground">
                        ({guestCount} guest{guestCount > 1 ? "s" : ""})
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <Badge className={statusColors[booking.status]}>{booking.status}</Badge>
                  {booking.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{booking.phone}</span>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-foreground">
                  <Bed className="h-4 w-4 text-muted-foreground" />
                  <span>Room: <strong>{booking.roomNumber}</strong> · {booking.roomType}</span>
                </div>
                <div className="flex items-center gap-2 text-foreground">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{booking.checkIn} → {booking.checkOut}</span>
                </div>
                <div className="flex items-center gap-2 text-foreground">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{booking.adults} Adults, {booking.children} Children · {booking.nights} nights</span>
                </div>
              </div>
            </div>

            {/* Financial details */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-primary/70 font-medium">Invoice</span>
                <span className="font-medium text-foreground">{booking.invoiceId}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-primary/70 font-medium">Payment status</span>
                <Badge className={paymentColors[booking.paymentStatus]}>
                  <Clock className="h-3 w-3 mr-1" />
                  {booking.paymentStatus}
                </Badge>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <IndianRupee className="h-4 w-4" />
                  <span>Total</span>
                </div>
                <span className="text-lg font-bold text-foreground">{formatInr(booking.total)}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-destructive font-medium">Discount</span>
                <span className="text-destructive font-semibold">−{formatInr(booking.discount)}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tax {booking.taxPercent}%</span>
                <span className="text-foreground">{formatInr(booking.taxAmount)}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-destructive font-medium">Balance due</span>
                <span
                  className={
                    booking.balanceDue <= 0
                      ? "font-semibold text-success tabular-nums"
                      : "font-semibold text-destructive tabular-nums"
                  }
                >
                  {formatInr(Math.max(0, booking.balanceDue))}
                </span>
              </div>

              <div className="flex items-start justify-between gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground pt-0.5">Total paid</span>
                  {paymentHistory.length > 0 ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1.5 text-muted-foreground"
                      onClick={() => setShowPaymentHistory((v) => !v)}
                    >
                      {showPaymentHistory ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </Button>
                  ) : null}
                </div>
                <div className="flex flex-col items-end gap-0.5 text-right">
                  <span className="font-semibold text-foreground tabular-nums">{formatInr(totalPaid)}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">Advance {formatInr(booking.advancePaid)}</span>
                </div>
              </div>

              {showPaymentHistory && paymentHistory.length > 0 ? (
                <div className="rounded-md border border-border bg-muted/30 p-2.5 space-y-2">
                  {paymentHistory.map((p) => (
                    <div key={p.id} className="flex items-start justify-between gap-3 text-xs">
                      <div className="text-muted-foreground">
                        <p className="text-foreground font-medium">{p.method}</p>
                        <p>{new Date(p.paidAt).toLocaleString("en-IN")}{p.receiptNo ? ` · ${p.receiptNo}` : ""}</p>
                      </div>
                      <span className="font-semibold text-foreground tabular-nums">{formatInr(p.amount)}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <Separator />

          <BookingAddOnsSummary
            bookingId={booking.bookingId}
            openPrintSignal={openPrintSignal}
            booking={{
              bookingId: booking.bookingId,
              invoiceId: booking.invoiceId,
              guestName: booking.guestName,
              phone: booking.phone,
              roomNumber: booking.roomNumber,
              roomType: booking.roomType,
              checkIn: booking.checkIn,
              checkOut: booking.checkOut,
              total: booking.total,
              discount: booking.discount,
              taxAmount: booking.taxAmount,
              totalPaid: totalPaid,
              balanceDue: booking.balanceDue,
              paymentHistory: booking.paymentHistory ?? [],
            }}
          />
        </>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Add-ons</p>
              <p className="text-xs text-muted-foreground">Create and manage booking add-ons</p>
            </div>
            {onExitCrud ? (
              <Button variant="outline" size="sm" onClick={onExitCrud}>
                Back to details
              </Button>
            ) : null}
          </div>
          <BookingAddOns
            bookingId={booking.bookingId}
            openTarget={openAddTarget}
            onOpenTargetHandled={onOpenAddTargetHandled}
            onCrudOpenChange={onCrudOpenChange}
          />
        </div>
      )}
    </div>
  );
}
