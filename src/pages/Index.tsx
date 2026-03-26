import { useState } from "react";
import { PanelRightOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookingSidebar } from "@/components/BookingSidebar";
import type { BookingData } from "@/components/BookingDetailsView";

function createSampleBooking(): BookingData {
  const checkIn = "2025-04-10";
  const checkOut = "2025-04-13";
  const nights = Math.max(
    1,
    Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)),
  );
  const total = 45000;
  const advancePaid = 25000;
  const discount = 5000;
  const taxPercent = 18;
  const taxAmount = (total * taxPercent) / 100;
  const balanceDue = total - advancePaid - discount;

  return {
    guestName: "Priya Sharma",
    bookingId: "BK-2025-0842",
    phone: "+91 98765 43210",
    roomNumber: "304",
    roomType: "Deluxe King",
    checkIn,
    checkOut,
    adults: 2,
    children: 1,
    nights,
    invoiceId: "INV-4421",
    paymentStatus: "Partial",
    total,
    balanceDue,
    advancePaid,
    discount,
    taxPercent,
    taxAmount,
    status: "Reserved",
    tags: ["VIP", "Breakfast"],
    splitBooking: false,
  };
}

export default function Index() {
  const [booking, setBooking] = useState<BookingData>(createSampleBooking);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container flex flex-col items-center justify-center gap-6 py-16">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Booking sidebar demo</h1>
          <p className="text-muted-foreground text-sm max-w-md">
            Open the side panel to view or edit a sample reservation.
          </p>
        </div>
        <Button onClick={() => setSidebarOpen(true)} size="lg" className="gap-2">
          <PanelRightOpen className="h-4 w-4" />
          Open booking details
        </Button>
      </div>

      <BookingSidebar
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        booking={booking}
        onBookingUpdate={setBooking}
      />
    </div>
  );
}
