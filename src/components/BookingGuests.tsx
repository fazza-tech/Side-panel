import { useEffect, useMemo, useState } from "react";
import { UserPlus, Users, Search, Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type GuestIdType = "Aadhaar" | "PAN" | "Passport" | "Driving License" | "Voter ID" | "Other";

export type BookingGuest = {
  id: string;
  phone: string;
  fullName: string;
  dob?: string;
  idType?: GuestIdType;
  idNumber?: string;
  email?: string;
  country?: string;
  state?: string;
  district?: string;
  pincode?: string;
  address?: string;
  companyName?: string;
  gstId?: string;
  vip?: boolean;
  createdAt: number;
  updatedAt: number;
};

const DEFAULT_COUNTRY = "India";

function storageKey(bookingId: string) {
  return `bookingGuests:${bookingId}`;
}

export function getBookingGuestsCount(bookingId: string) {
  if (typeof window === "undefined") return 0;
  return safeParseGuests(localStorage.getItem(storageKey(bookingId))).length;
}

function safeParseGuests(raw: string | null): BookingGuest[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(Boolean) as BookingGuest[];
  } catch {
    return [];
  }
}

function newGuestId() {
  // Good enough for local-only storage; avoids extra deps.
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

type GuestDraft = Omit<BookingGuest, "id" | "createdAt" | "updatedAt">;

function emptyDraft(): GuestDraft {
  return {
    phone: "",
    fullName: "",
    dob: "",
    idType: undefined,
    idNumber: "",
    email: "",
    country: DEFAULT_COUNTRY,
    state: "",
    district: "",
    pincode: "",
    address: "",
    companyName: "",
    gstId: "",
    vip: false,
  };
}

function trimOrUndef(v: string | undefined) {
  const t = (v ?? "").trim();
  return t.length ? t : undefined;
}

function normalizePhone(phone: string) {
  return phone.replace(/\s+/g, "").trim();
}

type Mode = "closed" | "add" | "view";

export function BookingGuestsControls({ bookingId }: { bookingId: string }) {
  const [guests, setGuests] = useState<BookingGuest[]>([]);
  const [mode, setMode] = useState<Mode>("closed");
  const [detailsGuestId, setDetailsGuestId] = useState<string | null>(null);

  const [draft, setDraft] = useState<GuestDraft>(emptyDraft());
  const [searchHint, setSearchHint] = useState<string | null>(null);

  useEffect(() => {
    setGuests(safeParseGuests(localStorage.getItem(storageKey(bookingId))));
  }, [bookingId]);

  useEffect(() => {
    localStorage.setItem(storageKey(bookingId), JSON.stringify(guests));
  }, [bookingId, guests]);

  const guestCount = guests.length;

  const phoneToSearch = useMemo(() => normalizePhone(draft.phone), [draft.phone]);

  const canSave = useMemo(() => {
    return normalizePhone(draft.phone).length >= 8 && draft.fullName.trim().length >= 2;
  }, [draft.phone, draft.fullName]);

  const openAdd = () => {
    setSearchHint(null);
    setDraft(emptyDraft());
    setDetailsGuestId(null);
    setMode("add");
  };

  const loadFromPhone = () => {
    const p = phoneToSearch;
    if (!p) {
      setSearchHint("Enter a phone number to search.");
      return;
    }
    const found = guests.find((g) => normalizePhone(g.phone) === p);
    if (!found) {
      setSearchHint("No local guest found for this phone.");
      return;
    }
    setSearchHint("Loaded saved guest details.");
    setDraft({
      phone: found.phone,
      fullName: found.fullName,
      dob: found.dob ?? "",
      idType: found.idType,
      idNumber: found.idNumber ?? "",
      email: found.email ?? "",
      country: found.country ?? DEFAULT_COUNTRY,
      state: found.state ?? "",
      district: found.district ?? "",
      pincode: found.pincode ?? "",
      address: found.address ?? "",
      companyName: found.companyName ?? "",
      gstId: found.gstId ?? "",
      vip: Boolean(found.vip),
    });
  };

  const saveGuest = () => {
    if (!canSave) return;

    const now = Date.now();
    const normalized = normalizePhone(draft.phone);
    const existing = guests.find((g) => normalizePhone(g.phone) === normalized);

    const base: Omit<BookingGuest, "id" | "createdAt"> = {
      phone: draft.phone.trim(),
      fullName: draft.fullName.trim(),
      dob: trimOrUndef(draft.dob),
      idType: draft.idType,
      idNumber: trimOrUndef(draft.idNumber),
      email: trimOrUndef(draft.email),
      country: trimOrUndef(draft.country) ?? DEFAULT_COUNTRY,
      state: trimOrUndef(draft.state),
      district: trimOrUndef(draft.district),
      pincode: trimOrUndef(draft.pincode),
      address: trimOrUndef(draft.address),
      companyName: trimOrUndef(draft.companyName),
      gstId: trimOrUndef(draft.gstId),
      vip: Boolean(draft.vip),
      updatedAt: now,
    };

    if (existing) {
      setGuests((prev) =>
        prev.map((g) =>
          g.id === existing.id
            ? { ...g, ...base, updatedAt: now }
            : g,
        ),
      );
    } else {
      const next: BookingGuest = {
        id: newGuestId(),
        createdAt: now,
        ...base,
      };
      setGuests((prev) => [next, ...prev]);
    }

    setMode("view");
  };

  const selectedGuest = useMemo(() => {
    if (!detailsGuestId) return null;
    return guests.find((g) => g.id === detailsGuestId) ?? null;
  }, [detailsGuestId, guests]);

  return (
    <div className="w-full">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={openAdd} className="h-7 px-2.5 text-xs">
          <UserPlus className="h-3.5 w-3.5 mr-1.5" />
          Add guest
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { setDetailsGuestId(null); setMode(mode === "view" ? "closed" : "view"); }}
          className="h-7 px-2 text-xs"
        >
          <Users className="h-3.5 w-3.5 mr-1.5" />
          View
          {guestCount > 0 ? <span className="ml-1 text-muted-foreground">({guestCount})</span> : null}
        </Button>
        {mode !== "closed" ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setMode("closed"); setDetailsGuestId(null); }}
            className="h-7 px-2 text-xs text-muted-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        ) : null}
      </div>

      {mode === "add" ? (
        <div className="mt-3 rounded-lg border border-border bg-background p-3 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Add guest</p>
              <p className="text-xs text-muted-foreground">Saved locally for this booking.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="guestPhoneSearch">Phone</Label>
              <Input
                id="guestPhoneSearch"
                placeholder="Enter phone number"
                value={draft.phone}
                onChange={(e) => {
                  const v = e.target.value;
                  setSearchHint(null);
                  setDraft((d) => ({ ...d, phone: v }));
                }}
              />
            </div>
            <Button type="button" onClick={loadFromPhone} className="sm:mb-[1px]">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            {searchHint ? <p className="text-xs text-muted-foreground sm:col-span-2">{searchHint}</p> : null}
          </div>

          <Separator />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="guestFullName">Full name</Label>
              <Input
                id="guestFullName"
                placeholder="Enter full name"
                value={draft.fullName}
                onChange={(e) => setDraft((d) => ({ ...d, fullName: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="guestDob">Date of birth</Label>
              <Input
                id="guestDob"
                type="date"
                value={draft.dob ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, dob: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>ID type</Label>
              <Select
                value={draft.idType ?? ""}
                onValueChange={(v) => setDraft((d) => ({ ...d, idType: (v || undefined) as GuestIdType | undefined }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select ID type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aadhaar">Aadhaar</SelectItem>
                  <SelectItem value="PAN">PAN</SelectItem>
                  <SelectItem value="Passport">Passport</SelectItem>
                  <SelectItem value="Driving License">Driving License</SelectItem>
                  <SelectItem value="Voter ID">Voter ID</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="guestIdNumber">ID number</Label>
              <Input
                id="guestIdNumber"
                placeholder="Enter ID number"
                value={draft.idNumber ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, idNumber: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="guestEmail">Email</Label>
              <Input
                id="guestEmail"
                type="email"
                placeholder="Enter email address"
                value={draft.email ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="guestCountry">Country</Label>
              <Input
                id="guestCountry"
                placeholder="Country"
                value={draft.country ?? DEFAULT_COUNTRY}
                onChange={(e) => setDraft((d) => ({ ...d, country: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="guestState">State</Label>
              <Input
                id="guestState"
                placeholder="Search or select state..."
                value={draft.state ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, state: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="guestDistrict">District</Label>
              <Input
                id="guestDistrict"
                placeholder="Search or select district..."
                value={draft.district ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, district: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="guestPincode">Pincode</Label>
              <Input
                id="guestPincode"
                placeholder="Enter pincode"
                value={draft.pincode ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, pincode: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="guestAddress">Address</Label>
              <Input
                id="guestAddress"
                placeholder="Enter full address"
                value={draft.address ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, address: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="guestCompanyName">Company name</Label>
              <Input
                id="guestCompanyName"
                placeholder="Enter company name"
                value={draft.companyName ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, companyName: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="guestGstId">GST ID</Label>
              <Input
                id="guestGstId"
                placeholder="Enter GST ID"
                value={draft.gstId ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, gstId: e.target.value }))}
              />
            </div>

            <div className="flex items-center gap-2 pt-6">
              <Checkbox
                id="guestVip"
                checked={Boolean(draft.vip)}
                onCheckedChange={(v) => setDraft((d) => ({ ...d, vip: Boolean(v) }))}
              />
              <Label htmlFor="guestVip" className="text-sm">
                VIP Guest
              </Label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setMode("closed")}>
              Cancel
            </Button>
            <Button onClick={saveGuest} disabled={!canSave}>
              Save guest
            </Button>
          </div>
        </div>
      ) : null}

      {mode === "view" ? (
        <div className="mt-3 rounded-lg border border-border bg-background p-3 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Guests</p>
              <p className="text-xs text-muted-foreground">{guestCount ? "Saved locally for this booking." : "No guests added yet."}</p>
            </div>
            <Button variant="outline" size="sm" className="h-8" onClick={openAdd}>
              <UserPlus className="h-3.5 w-3.5 mr-1.5" />
              Add
            </Button>
          </div>

          {!guestCount ? (
            <div className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              Click <span className="font-medium text-foreground">Add</span> to save guest details.
            </div>
          ) : (
            <ScrollArea className="max-h-[50vh] pr-2">
              <div className="space-y-2">
                {guests.map((g) => (
                  <div key={g.id} className="rounded-md border border-border p-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground truncate">{g.fullName}</p>
                          {g.vip ? (
                            <span className="rounded-full bg-success/15 text-success border border-success/30 px-2 py-0.5 text-xs">
                              VIP
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{g.phone}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8"
                        onClick={() => setDetailsGuestId(detailsGuestId === g.id ? null : g.id)}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1.5" />
                        {detailsGuestId === g.id ? "Hide" : "View"}
                      </Button>
                    </div>

                    {detailsGuestId === g.id ? (
                      <div className="mt-2 pt-2 border-t border-border text-xs text-muted-foreground grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <div><span className="font-medium text-foreground">DOB:</span> {g.dob ?? "—"}</div>
                        <div><span className="font-medium text-foreground">Email:</span> {g.email ?? "—"}</div>
                        <div><span className="font-medium text-foreground">ID:</span> {g.idType ? `${g.idType}${g.idNumber ? ` · ${g.idNumber}` : ""}` : "—"}</div>
                        <div><span className="font-medium text-foreground">GST:</span> {g.gstId ?? "—"}</div>
                        <div className="sm:col-span-2"><span className="font-medium text-foreground">Address:</span> {g.address ?? "—"}</div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function BookingGuestsPanel({
  bookingId,
  onBack,
}: {
  bookingId: string;
  onBack: () => void;
}) {
  const [guests, setGuests] = useState<BookingGuest[]>([]);
  const [mode, setMode] = useState<Exclude<Mode, "closed">>("view");
  const [detailsGuestId, setDetailsGuestId] = useState<string | null>(null);

  const [draft, setDraft] = useState<GuestDraft>(emptyDraft());
  const [searchHint, setSearchHint] = useState<string | null>(null);

  useEffect(() => {
    setGuests(safeParseGuests(localStorage.getItem(storageKey(bookingId))));
  }, [bookingId]);

  useEffect(() => {
    localStorage.setItem(storageKey(bookingId), JSON.stringify(guests));
  }, [bookingId, guests]);

  const guestCount = guests.length;
  const phoneToSearch = useMemo(() => normalizePhone(draft.phone), [draft.phone]);

  const canSave = useMemo(() => {
    return normalizePhone(draft.phone).length >= 8 && draft.fullName.trim().length >= 2;
  }, [draft.phone, draft.fullName]);

  const openAdd = () => {
    setSearchHint(null);
    setDraft(emptyDraft());
    setDetailsGuestId(null);
    setMode("add");
  };

  const loadFromPhone = () => {
    const p = phoneToSearch;
    if (!p) {
      setSearchHint("Enter a phone number to search.");
      return;
    }
    const found = guests.find((g) => normalizePhone(g.phone) === p);
    if (!found) {
      setSearchHint("No local guest found for this phone.");
      return;
    }
    setSearchHint("Loaded saved guest details.");
    setDraft({
      phone: found.phone,
      fullName: found.fullName,
      dob: found.dob ?? "",
      idType: found.idType,
      idNumber: found.idNumber ?? "",
      email: found.email ?? "",
      country: found.country ?? DEFAULT_COUNTRY,
      state: found.state ?? "",
      district: found.district ?? "",
      pincode: found.pincode ?? "",
      address: found.address ?? "",
      companyName: found.companyName ?? "",
      gstId: found.gstId ?? "",
      vip: Boolean(found.vip),
    });
  };

  const saveGuest = () => {
    if (!canSave) return;

    const now = Date.now();
    const normalized = normalizePhone(draft.phone);
    const existing = guests.find((g) => normalizePhone(g.phone) === normalized);

    const base: Omit<BookingGuest, "id" | "createdAt"> = {
      phone: draft.phone.trim(),
      fullName: draft.fullName.trim(),
      dob: trimOrUndef(draft.dob),
      idType: draft.idType,
      idNumber: trimOrUndef(draft.idNumber),
      email: trimOrUndef(draft.email),
      country: trimOrUndef(draft.country) ?? DEFAULT_COUNTRY,
      state: trimOrUndef(draft.state),
      district: trimOrUndef(draft.district),
      pincode: trimOrUndef(draft.pincode),
      address: trimOrUndef(draft.address),
      companyName: trimOrUndef(draft.companyName),
      gstId: trimOrUndef(draft.gstId),
      vip: Boolean(draft.vip),
      updatedAt: now,
    };

    if (existing) {
      setGuests((prev) =>
        prev.map((g) =>
          g.id === existing.id
            ? { ...g, ...base, updatedAt: now }
            : g,
        ),
      );
    } else {
      const next: BookingGuest = {
        id: newGuestId(),
        createdAt: now,
        ...base,
      };
      setGuests((prev) => [next, ...prev]);
    }

    setMode("view");
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between gap-3 pb-4">
        <div className="min-w-0">
          <p className="text-lg font-semibold tracking-tight text-foreground">Guests</p>
          <p className="text-sm text-muted-foreground truncate">{bookingId}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onBack}>
            Back
          </Button>
          <Button size="sm" onClick={openAdd}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add guest
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {mode === "add" ? (
          <ScrollArea className="h-full pr-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                <div className="space-y-1.5">
                  <Label htmlFor="guestPhoneSearchPanel">Phone</Label>
                  <Input
                    id="guestPhoneSearchPanel"
                    placeholder="Enter phone number"
                    value={draft.phone}
                    onChange={(e) => {
                      const v = e.target.value;
                      setSearchHint(null);
                      setDraft((d) => ({ ...d, phone: v }));
                    }}
                  />
                </div>
                <Button type="button" onClick={loadFromPhone} className="sm:mb-[1px]">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
                {searchHint ? <p className="text-xs text-muted-foreground sm:col-span-2">{searchHint}</p> : null}
              </div>

              <Separator />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="guestFullNamePanel">Full name</Label>
                  <Input
                    id="guestFullNamePanel"
                    placeholder="Enter full name"
                    value={draft.fullName}
                    onChange={(e) => setDraft((d) => ({ ...d, fullName: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="guestDobPanel">Date of birth</Label>
                  <Input
                    id="guestDobPanel"
                    type="date"
                    value={draft.dob ?? ""}
                    onChange={(e) => setDraft((d) => ({ ...d, dob: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>ID type</Label>
                  <Select
                    value={draft.idType ?? ""}
                    onValueChange={(v) => setDraft((d) => ({ ...d, idType: (v || undefined) as GuestIdType | undefined }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select ID type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Aadhaar">Aadhaar</SelectItem>
                      <SelectItem value="PAN">PAN</SelectItem>
                      <SelectItem value="Passport">Passport</SelectItem>
                      <SelectItem value="Driving License">Driving License</SelectItem>
                      <SelectItem value="Voter ID">Voter ID</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="guestIdNumberPanel">ID number</Label>
                  <Input
                    id="guestIdNumberPanel"
                    placeholder="Enter ID number"
                    value={draft.idNumber ?? ""}
                    onChange={(e) => setDraft((d) => ({ ...d, idNumber: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="guestEmailPanel">Email</Label>
                  <Input
                    id="guestEmailPanel"
                    type="email"
                    placeholder="Enter email address"
                    value={draft.email ?? ""}
                    onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="guestCountryPanel">Country</Label>
                  <Input
                    id="guestCountryPanel"
                    placeholder="Country"
                    value={draft.country ?? DEFAULT_COUNTRY}
                    onChange={(e) => setDraft((d) => ({ ...d, country: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="guestStatePanel">State</Label>
                  <Input
                    id="guestStatePanel"
                    placeholder="Search or select state..."
                    value={draft.state ?? ""}
                    onChange={(e) => setDraft((d) => ({ ...d, state: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="guestDistrictPanel">District</Label>
                  <Input
                    id="guestDistrictPanel"
                    placeholder="Search or select district..."
                    value={draft.district ?? ""}
                    onChange={(e) => setDraft((d) => ({ ...d, district: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="guestPincodePanel">Pincode</Label>
                  <Input
                    id="guestPincodePanel"
                    placeholder="Enter pincode"
                    value={draft.pincode ?? ""}
                    onChange={(e) => setDraft((d) => ({ ...d, pincode: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="guestAddressPanel">Address</Label>
                  <Input
                    id="guestAddressPanel"
                    placeholder="Enter full address"
                    value={draft.address ?? ""}
                    onChange={(e) => setDraft((d) => ({ ...d, address: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="guestCompanyNamePanel">Company name</Label>
                  <Input
                    id="guestCompanyNamePanel"
                    placeholder="Enter company name"
                    value={draft.companyName ?? ""}
                    onChange={(e) => setDraft((d) => ({ ...d, companyName: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="guestGstIdPanel">GST ID</Label>
                  <Input
                    id="guestGstIdPanel"
                    placeholder="Enter GST ID"
                    value={draft.gstId ?? ""}
                    onChange={(e) => setDraft((d) => ({ ...d, gstId: e.target.value }))}
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <Checkbox
                    id="guestVipPanel"
                    checked={Boolean(draft.vip)}
                    onCheckedChange={(v) => setDraft((d) => ({ ...d, vip: Boolean(v) }))}
                  />
                  <Label htmlFor="guestVipPanel" className="text-sm">
                    VIP Guest
                  </Label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setMode("view")}>
                  Cancel
                </Button>
                <Button onClick={saveGuest} disabled={!canSave}>
                  Save guest
                </Button>
              </div>
            </div>
          </ScrollArea>
        ) : (
          <ScrollArea className="h-full pr-4">
            <div className="space-y-3">
              {!guestCount ? (
                <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  No guests added yet. Click <span className="font-medium text-foreground">Add guest</span>.
                </div>
              ) : (
                <div className="space-y-2">
                  {guests.map((g) => (
                    <div key={g.id} className="rounded-md border border-border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground truncate">{g.fullName}</p>
                            {g.vip ? (
                              <span className="rounded-full bg-success/15 text-success border border-success/30 px-2 py-0.5 text-xs">
                                VIP
                              </span>
                            ) : null}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{g.phone}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => setDetailsGuestId(detailsGuestId === g.id ? null : g.id)}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1.5" />
                          {detailsGuestId === g.id ? "Hide" : "View"}
                        </Button>
                      </div>

                      {detailsGuestId === g.id ? (
                        <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <div><span className="font-medium text-foreground">DOB:</span> {g.dob ?? "—"}</div>
                          <div><span className="font-medium text-foreground">Email:</span> {g.email ?? "—"}</div>
                          <div><span className="font-medium text-foreground">ID:</span> {g.idType ? `${g.idType}${g.idNumber ? ` · ${g.idNumber}` : ""}` : "—"}</div>
                          <div><span className="font-medium text-foreground">GST:</span> {g.gstId ?? "—"}</div>
                          <div className="sm:col-span-2"><span className="font-medium text-foreground">Address:</span> {g.address ?? "—"}</div>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}

