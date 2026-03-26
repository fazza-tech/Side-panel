import { Phone, Bed, Calendar, Users, Clock, IndianRupee } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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
  discount: number;
  taxPercent: number;
  taxAmount: number;
  status: "Reserved" | "Checked In" | "Checked Out" | "Cancelled";
  tags: string[];
  splitBooking: boolean;
}

interface BookingDetailsViewProps {
  booking: BookingData;
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

export function BookingDetailsView({ booking }: BookingDetailsViewProps) {
  return (
    <div className="space-y-5">
      {/* Guest header */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{booking.guestName}</h3>
            <p className="text-sm text-primary/70 font-medium">{booking.bookingId}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
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
          <span className="text-lg font-bold text-foreground">₹{booking.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-destructive font-medium">Balance due</span>
          <span className="text-destructive font-semibold">₹{booking.balanceDue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Advance Paid</span>
          <span className="text-foreground">₹{booking.advancePaid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-destructive font-medium">Discount</span>
          <span className="text-destructive font-semibold">₹{booking.discount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Tax {booking.taxPercent}%</span>
          <span className="text-foreground">₹{booking.taxAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
        </div>

        <Separator />

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Split booking</span>
          <span className="font-medium text-foreground">{booking.splitBooking ? "Yes" : "No"}</span>
        </div>
      </div>
    </div>
  );
}
