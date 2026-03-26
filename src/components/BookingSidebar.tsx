import { useState } from "react";
import { Pencil, LogIn, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookingDetailsView, type BookingData } from "./BookingDetailsView";
import { BookingEditForm } from "./BookingEditForm";
import { toast } from "sonner";

interface BookingSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: BookingData;
  onBookingUpdate?: (updated: BookingData) => void;
}

export function BookingSidebar({ open, onOpenChange, booking, onBookingUpdate }: BookingSidebarProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = (updated: BookingData) => {
    // Recalculate derived fields
    updated.balanceDue = updated.total - updated.advancePaid - updated.discount;
    updated.taxAmount = (updated.total * updated.taxPercent) / 100;
    const checkIn = new Date(updated.checkIn);
    const checkOut = new Date(updated.checkOut);
    updated.nights = Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));

    onBookingUpdate?.(updated);
    setIsEditing(false);
    toast.success("Booking updated successfully");
  };

  const handleCancel = () => setIsEditing(false);

  const isCheckedIn = booking.status === "Checked In";

  const handleCheckinToggle = () => {
    const updated = { ...booking, status: isCheckedIn ? "Reserved" as const : "Checked In" as const };
    onBookingUpdate?.(updated);
    toast.success(isCheckedIn ? "Check-in undone" : "Guest checked in successfully");
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setIsEditing(false); }}>
      <SheetContent side="right" className={`w-full p-0 transition-all duration-300 ${isEditing ? "sm:max-w-2xl" : "sm:max-w-md"}`}>
        <SheetHeader className="p-6 pb-0">
          <div className="flex items-center justify-between pr-6">
            <SheetTitle>{isEditing ? "Edit Booking" : "Booking details"}</SheetTitle>
            {!isEditing && (
              <div className="flex items-center gap-2">
                <Button
                  variant={isCheckedIn ? "outline" : "default"}
                  size="sm"
                  onClick={handleCheckinToggle}
                  className={isCheckedIn ? "border-destructive text-destructive hover:bg-destructive/10" : "bg-success hover:bg-success/90 text-success-foreground"}
                >
                  {isCheckedIn ? <Undo2 className="h-3.5 w-3.5 mr-1.5" /> : <LogIn className="h-3.5 w-3.5 mr-1.5" />}
                  {isCheckedIn ? "Undo Check-in" : "Check In"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Pencil className="h-3.5 w-3.5 mr-1.5" />
                  Edit
                </Button>
              </div>
            )}
          </div>
          <SheetDescription className="sr-only">
            {isEditing ? "Edit booking reservation details" : "View booking reservation details"}
          </SheetDescription>
        </SheetHeader>

        {isEditing ? (
          <div className="px-6 pb-6 pt-4 h-[calc(100vh-5rem)]">
            <BookingEditForm booking={booking} onSave={handleSave} onCancel={handleCancel} />
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-5rem)] px-6 pb-6">
            <div className="pt-4">
              <BookingDetailsView booking={booking} />
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
}
