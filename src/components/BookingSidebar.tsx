import { useState } from "react";
import { Pencil, LogIn, Undo2, LogOut, Plus, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookingDetailsView, type BookingData } from "./BookingDetailsView";
import { BookingEditForm } from "./BookingEditForm";
import { BookingGuestsPanel, getBookingGuestsCount } from "./BookingGuests";
import { BookingPaymentPanel } from "./BookingPaymentPanel";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface BookingSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: BookingData;
  onBookingUpdate?: (updated: BookingData) => void;
}

export function BookingSidebar({ open, onOpenChange, booking, onBookingUpdate }: BookingSidebarProps) {
  const [mode, setMode] = useState<"details" | "edit" | "guests" | "payment">("details");
  const [openAddTarget, setOpenAddTarget] = useState<import("./BookingAddOns").AddTarget | null>(null);
  const [isAddCrudOpen, setIsAddCrudOpen] = useState(false);
  const [openPrintSignal, setOpenPrintSignal] = useState(0);

  const handleSave = (updated: BookingData) => {
    // Recalculate derived fields
    updated.balanceDue = updated.total - updated.advancePaid - updated.discount;
    updated.taxAmount = (updated.total * updated.taxPercent) / 100;
    const checkIn = new Date(updated.checkIn);
    const checkOut = new Date(updated.checkOut);
    updated.nights = Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));

    onBookingUpdate?.(updated);
    setMode("details");
    toast.success("Booking updated successfully");
  };

  const handleCancel = () => setMode("details");

  const handlePaymentComplete = (payload: { amount: number; method: string; receiptNo?: string; notes?: string }) => {
    const prevTotalPaid = booking.totalPaid ?? booking.advancePaid;
    const nextTotalPaid = prevTotalPaid + payload.amount;
    const nextBalanceDue = Math.max(0, booking.balanceDue - payload.amount);
    const nextStatus: BookingData["paymentStatus"] =
      nextBalanceDue <= 0 ? "Paid" : nextTotalPaid > 0 ? "Partial" : "Pending";

    const updated: BookingData = {
      ...booking,
      totalPaid: nextTotalPaid,
      balanceDue: nextBalanceDue,
      paymentStatus: nextStatus,
      paymentHistory: [
        ...(booking.paymentHistory ?? []),
        {
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          amount: payload.amount,
          method: payload.method,
          paidAt: new Date().toISOString(),
          receiptNo: payload.receiptNo,
          notes: payload.notes,
        },
      ],
    };
    onBookingUpdate?.(updated);
    setMode("details");
    toast.success(`Payment recorded via ${payload.method}`);
  };

  const status = booking.status;
  const isCheckedIn = status === "Checked In";
  const isCheckedOut = status === "Checked Out";
  const isCancelled = status === "Cancelled";
  const isReserved = status === "Reserved";
  const canCheckIn = isReserved;
  const canCheckOut = isCheckedIn;

  const handleCheckinToggle = () => {
    if (isCancelled) return;
    if (isCheckedIn) {
      const updated = { ...booking, status: "Reserved" as const };
      onBookingUpdate?.(updated);
      toast.success("Check-in undone");
      return;
    }
    if (canCheckIn) {
      const updated = { ...booking, status: "Checked In" as const };
      onBookingUpdate?.(updated);
      toast.success("Guest checked in successfully");
    }
  };

  const handleCheckoutToggle = () => {
    if (isCancelled) return;
    if (isCheckedOut) {
      const updated = { ...booking, status: "Checked In" as const };
      onBookingUpdate?.(updated);
      toast.success("Check-out undone");
      return;
    }
    if (canCheckOut) {
      const updated = { ...booking, status: "Checked Out" as const };
      onBookingUpdate?.(updated);
      toast.success("Guest checked out successfully");
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) {
          setMode("details");
          setOpenPrintSignal(0);
        }
      }}
    >
      <SheetContent
        side="right"
        className={`w-full p-0 transition-all duration-300 ${
          mode !== "details" ? "sm:max-w-[50vw]" : "sm:max-w-[50vw]"
        }`}
      >
        <SheetHeader className="p-6 pb-0">
          <div className="flex items-center justify-between pr-6">
            <SheetTitle>
              {mode === "edit"
                ? "Edit Booking"
                : mode === "guests"
                ? "Guests"
                : mode === "payment"
                ? "Payment"
                : "Booking details"}
            </SheetTitle>
            {mode === "details" && (
              <div className="flex items-center gap-2">
                <Button
                  variant={isCheckedIn ? "outline" : "default"}
                  size="sm"
                  onClick={handleCheckinToggle}
                  disabled={isCancelled || isCheckedOut || (!isCheckedIn && !canCheckIn)}
                  className={
                    isCheckedIn
                      ? "border-destructive text-destructive hover:bg-destructive/10"
                      : "bg-success hover:bg-success/90 text-success-foreground"
                  }
                >
                  {isCheckedIn ? <Undo2 className="h-3.5 w-3.5 mr-1.5" /> : <LogIn className="h-3.5 w-3.5 mr-1.5" />}
                  {isCheckedIn ? "Undo Check-in" : "Check In"}
                </Button>
                <Button
                  variant={isCheckedOut ? "outline" : "default"}
                  size="sm"
                  onClick={handleCheckoutToggle}
                  disabled={isCancelled || (!isCheckedOut && !canCheckOut)}
                  className={
                    isCheckedOut
                      ? "border-destructive text-destructive hover:bg-destructive/10"
                      : "bg-primary hover:bg-primary/90 text-primary-foreground"
                  }
                >
                  {isCheckedOut ? <Undo2 className="h-3.5 w-3.5 mr-1.5" /> : <LogOut className="h-3.5 w-3.5 mr-1.5" />}
                  {isCheckedOut ? "Undo Check-out" : "Check Out"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setMode("edit")}>
                  <Pencil className="h-3.5 w-3.5 mr-1.5" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => setOpenPrintSignal((n) => n + 1)}>
                  <Printer className="h-3.5 w-3.5 mr-1.5" />
                  Print
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Add
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setMode("guests");
                      }}
                    >
                      Guests
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={booking.balanceDue <= 0}
                      onSelect={(e) => {
                        e.preventDefault();
                        if (booking.balanceDue > 0) setMode("payment");
                      }}
                    >
                      Make Payment
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setOpenAddTarget("addons");
                        setIsAddCrudOpen(true);
                      }}
                    >
                      Add-ons
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setOpenAddTarget("meal");
                        setIsAddCrudOpen(true);
                      }}
                    >
                      Meal plan
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setOpenAddTarget("bed");
                        setIsAddCrudOpen(true);
                      }}
                    >
                      Extra bed
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
            {mode !== "details" && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setMode("details")}>
                  Back
                </Button>
              </div>
            )}
          </div>
          <SheetDescription className="sr-only">
            {mode === "edit"
              ? "Edit booking reservation details"
              : mode === "guests"
              ? "Manage guests"
              : mode === "payment"
              ? "Complete booking payment"
              : "View booking reservation details"}
          </SheetDescription>
        </SheetHeader>

        {mode === "edit" ? (
          <div className="px-6 pb-6 pt-4 h-[calc(100vh-5rem)]">
            <BookingEditForm booking={booking} onSave={handleSave} onCancel={handleCancel} />
          </div>
        ) : mode === "payment" ? (
          <div className="px-6 pb-6 pt-4 h-[calc(100vh-5rem)]">
            <BookingPaymentPanel
              booking={booking}
              onCancel={() => setMode("details")}
              onComplete={handlePaymentComplete}
            />
          </div>
        ) : mode === "guests" ? (
          <div className="px-6 pb-6 pt-4 h-[calc(100vh-5rem)]">
            <BookingGuestsPanel bookingId={booking.bookingId} onBack={() => setMode("details")} />
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-5rem)] px-6 pb-6">
            <div className="pt-4">
                <BookingDetailsView
                booking={booking}
                guestCount={getBookingGuestsCount(booking.bookingId)}
                openAddTarget={openAddTarget}
                  hideTopDetails={isAddCrudOpen || Boolean(openAddTarget)}
                onExitCrud={() => { setIsAddCrudOpen(false); setOpenAddTarget(null); }}
                onCrudOpenChange={(openCrud) => setIsAddCrudOpen(openCrud)}
                openPrintSignal={openPrintSignal}
              />
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
}
