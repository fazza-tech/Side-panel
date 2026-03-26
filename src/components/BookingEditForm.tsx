import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { BookingData } from "./BookingDetailsView";

interface BookingEditFormProps {
  booking: BookingData;
  onSave: (updated: BookingData) => void;
  onCancel: () => void;
}

export function BookingEditForm({ booking, onSave, onCancel }: BookingEditFormProps) {
  const [form, setForm] = useState<BookingData>({ ...booking });

  const update = <K extends keyof BookingData>(key: K, value: BookingData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => onSave(form);

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      <div className="flex-1 grid grid-rows-[auto_1fr_auto] gap-3">
        {/* Guest Info */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Guest Info</h3>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label htmlFor="guestName" className="text-xs">Guest Name</Label>
              <Input id="guestName" className="h-8 text-sm" value={form.guestName} onChange={(e) => update("guestName", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone" className="text-xs">Phone</Label>
              <Input id="phone" className="h-8 text-sm" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={(v) => update("status", v as BookingData["status"])}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Reserved">Reserved</SelectItem>
                  <SelectItem value="Checked In">Checked In</SelectItem>
                  <SelectItem value="Checked Out">Checked Out</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Room & Stay */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Room & Stay</h3>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div className="space-y-1">
              <Label htmlFor="roomNumber" className="text-xs">Room No.</Label>
              <Input id="roomNumber" className="h-8 text-sm" value={form.roomNumber} onChange={(e) => update("roomNumber", e.target.value)} />
            </div>
            <div className="space-y-1 col-span-2">
              <Label htmlFor="roomType" className="text-xs">Room Type</Label>
              <Input id="roomType" className="h-8 text-sm" value={form.roomType} onChange={(e) => update("roomType", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div className="space-y-1">
              <Label htmlFor="checkIn" className="text-xs">Check-in</Label>
              <Input id="checkIn" type="date" className="h-8 text-sm" value={form.checkIn} onChange={(e) => update("checkIn", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="checkOut" className="text-xs">Check-out</Label>
              <Input id="checkOut" type="date" className="h-8 text-sm" value={form.checkOut} onChange={(e) => update("checkOut", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="adults" className="text-xs">Adults</Label>
              <Input id="adults" type="number" min={1} className="h-8 text-sm" value={form.adults} onChange={(e) => update("adults", Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="children" className="text-xs">Children</Label>
              <Input id="children" type="number" min={0} className="h-8 text-sm" value={form.children} onChange={(e) => update("children", Number(e.target.value))} />
            </div>
          </div>
        </div>

        {/* Payment */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Payment</h3>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div className="space-y-1">
              <Label className="text-xs">Payment Status</Label>
              <Select value={form.paymentStatus} onValueChange={(v) => update("paymentStatus", v as BookingData["paymentStatus"])}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Partial">Partial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="total" className="text-xs">Total (₹)</Label>
              <Input id="total" type="number" min={0} className="h-8 text-sm" value={form.total} onChange={(e) => update("total", Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="advancePaid" className="text-xs">Advance Paid (₹)</Label>
              <Input id="advancePaid" type="number" min={0} className="h-8 text-sm" value={form.advancePaid} onChange={(e) => update("advancePaid", Number(e.target.value))} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label htmlFor="discount" className="text-xs">Discount (₹)</Label>
              <Input id="discount" type="number" min={0} className="h-8 text-sm" value={form.discount} onChange={(e) => update("discount", Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="taxPercent" className="text-xs">Tax %</Label>
              <Input id="taxPercent" type="number" min={0} className="h-8 text-sm" value={form.taxPercent} onChange={(e) => update("taxPercent", Number(e.target.value))} />
            </div>
            <div />
          </div>
        </div>
      </div>

      {/* Action buttons pinned to bottom */}
      <div className="flex gap-3 pt-4 border-t border-border mt-4">
        <Button onClick={handleSave} className="flex-1" size="sm">Save Changes</Button>
        <Button variant="outline" onClick={onCancel} className="flex-1" size="sm">Cancel</Button>
      </div>
    </div>
  );
}
