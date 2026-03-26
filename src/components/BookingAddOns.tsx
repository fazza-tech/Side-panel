import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type AddTarget = "addons" | "meal" | "bed";
type BookingPrintInfo = {
  bookingId: string;
  invoiceId: string;
  guestName: string;
  phone: string;
  roomNumber: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  total: number;
  discount: number;
  taxAmount: number;
  totalPaid: number;
  balanceDue: number;
  paymentHistory?: Array<{
    id: string;
    amount: number;
    method: string;
    paidAt: string;
    receiptNo?: string;
    notes?: string;
  }>;
};

type MealPlanName = "Breakfast" | "Lunch" | "Dinner" | "Half Board" | "Full Board";
type MealPlanGuestType = "Adult" | "Child";

export type MealPlanDay = {
  id: string;
  date: string; // YYYY-MM-DD
  plan: MealPlanName;
  guestType: MealPlanGuestType;
  qty: number;
  price: number;
  complimentary: boolean;
  createdAt: number;
};

type ExtraBedType = "Extra Bed" | "Extra Mattress" | "Baby Cot";

export type ExtraBedDay = {
  id: string;
  date: string; // YYYY-MM-DD
  bedType: ExtraBedType;
  qty: number;
  price: number;
  complimentary: boolean;
  createdAt: number;
};

type CustomChargeType = "Custom Activity" | "Laundry" | "Spa" | "Restaurant" | "Damage" | "Other";
type PricingMode = "Per day" | "Per unit" | "One time";

export type CustomAddon = {
  id: string;
  activity: CustomChargeType;
  serviceName: string;
  chargeType: "Service" | "Damage" | "Other";
  date: string; // YYYY-MM-DD
  description?: string;
  pricingMode: PricingMode;
  amount: number;
  discountAmount: number;
  taxPercent: number;
  complimentary: boolean;
  createdAt: number;
};

type AddOnsState = {
  customAddOns: CustomAddon[];
  mealPlans: MealPlanDay[];
  extraBeds: ExtraBedDay[];
};

const MEAL_PLANS: MealPlanName[] = ["Breakfast", "Lunch", "Dinner", "Half Board", "Full Board"];
const GUEST_TYPES: MealPlanGuestType[] = ["Adult", "Child"];
const EXTRA_BEDS: ExtraBedType[] = ["Extra Bed", "Extra Mattress", "Baby Cot"];
const CUSTOM_ACTIVITIES: CustomChargeType[] = ["Custom Activity", "Laundry", "Spa", "Restaurant", "Damage", "Other"];
const PRICING_MODES: PricingMode[] = ["Per day", "Per unit", "One time"];

function storageKey(bookingId: string) {
  return `bookingAddOns:${bookingId}`;
}

function newId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function safeParse(raw: string | null): AddOnsState {
  if (!raw) return { customAddOns: [], mealPlans: [], extraBeds: [] };
  try {
    const parsed = JSON.parse(raw) as Partial<AddOnsState> | undefined;
    return {
      customAddOns: Array.isArray(parsed?.customAddOns) ? (parsed!.customAddOns as CustomAddon[]) : [],
      mealPlans: Array.isArray(parsed?.mealPlans) ? (parsed!.mealPlans as MealPlanDay[]) : [],
      extraBeds: Array.isArray(parsed?.extraBeds) ? (parsed!.extraBeds as ExtraBedDay[]) : [],
    };
  } catch {
    return { customAddOns: [], mealPlans: [], extraBeds: [] };
  }
}

export function getBookingAddOns(bookingId: string): AddOnsState {
  if (typeof window === "undefined") return { customAddOns: [], mealPlans: [], extraBeds: [] };
  return safeParse(localStorage.getItem(storageKey(bookingId)));
}

function todayYmd() {
  return new Date().toISOString().slice(0, 10);
}

export function BookingAddOns({
  bookingId,
  openTarget,
  onOpenTargetHandled,
  onCrudOpenChange,
}: {
  bookingId: string;
  openTarget?: AddTarget | null;
  onOpenTargetHandled?: () => void;
  onCrudOpenChange?: (open: boolean) => void;
}) {
  const [state, setState] = useState<AddOnsState>({ customAddOns: [], mealPlans: [], extraBeds: [] });

  const [tab, setTab] = useState<AddTarget>("meal");
  const [addonOpen, setAddonOpen] = useState(false);
  const [mealOpen, setMealOpen] = useState(false);
  const [bedOpen, setBedOpen] = useState(false);

  const [addonDraft, setAddonDraft] = useState<Omit<CustomAddon, "id" | "createdAt">>({
    activity: "Custom Activity",
    chargeType: "Service",
    serviceName: "",
    date: "",
    description: "",
    pricingMode: "One time",
    amount: 0,
    discountAmount: 0,
    taxPercent: 0,
    complimentary: false,
  });

  const [mealDraft, setMealDraft] = useState<Omit<MealPlanDay, "id" | "createdAt">>({
    date: "",
    plan: "Breakfast",
    guestType: "Adult",
    qty: 1,
    price: 0,
    complimentary: false,
  });

  const [bedDraft, setBedDraft] = useState<Omit<ExtraBedDay, "id" | "createdAt">>({
    date: "",
    bedType: "Extra Bed",
    qty: 1,
    price: 0,
    complimentary: false,
  });

  useEffect(() => {
    setState(safeParse(localStorage.getItem(storageKey(bookingId))));
  }, [bookingId]);

  useEffect(() => {
    localStorage.setItem(storageKey(bookingId), JSON.stringify(state));
  }, [bookingId, state]);

  useEffect(() => {
    if (!openTarget) return;
    onCrudOpenChange?.(true);
    setTab(openTarget);
    setAddonOpen(openTarget === "addons");
    setMealOpen(openTarget === "meal");
    setBedOpen(openTarget === "bed");
    if (openTarget === "addons") {
      setAddonDraft((d) => ({ ...d, date: d.date?.trim().length ? d.date : todayYmd() }));
    }
    if (openTarget === "meal") {
      setMealDraft((d) => ({ ...d, date: d.date?.trim().length ? d.date : todayYmd() }));
    }
    if (openTarget === "bed") {
      setBedDraft((d) => ({ ...d, date: d.date?.trim().length ? d.date : todayYmd() }));
    }
    onOpenTargetHandled?.();
  }, [openTarget, onOpenTargetHandled]);

  useEffect(() => {
    onCrudOpenChange?.(addonOpen || mealOpen || bedOpen);
  }, [addonOpen, bedOpen, mealOpen, onCrudOpenChange]);

  const addonCount = state.customAddOns.length;
  const mealCount = state.mealPlans.length;
  const bedCount = state.extraBeds.length;

  const canAddAddon = useMemo(() => addonDraft.date.trim().length > 0 && (addonDraft.serviceName.trim().length > 0 || addonDraft.activity !== "Custom Activity"), [addonDraft.date, addonDraft.serviceName, addonDraft.activity]);
  const canAddMeal = useMemo(() => mealDraft.date.trim().length > 0 && mealDraft.qty > 0, [mealDraft.date, mealDraft.qty]);
  const canAddBed = useMemo(() => bedDraft.date.trim().length > 0 && bedDraft.qty > 0, [bedDraft.date, bedDraft.qty]);

  const addAddon = () => {
    if (!canAddAddon) return;
    const next: CustomAddon = { id: newId(), createdAt: Date.now(), ...addonDraft, serviceName: addonDraft.serviceName.trim() };
    setState((s) => ({ ...s, customAddOns: [next, ...s.customAddOns].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)) }));
    setAddonOpen(false);
    setAddonDraft((d) => ({ ...d, date: "", serviceName: "", description: "", amount: 0, discountAmount: 0, taxPercent: 0, complimentary: false }));
  };

  const addMeal = () => {
    if (!canAddMeal) return;
    const next: MealPlanDay = { id: newId(), createdAt: Date.now(), ...mealDraft };
    setState((s) => ({ ...s, mealPlans: [next, ...s.mealPlans].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)) }));
    setMealOpen(false);
    setMealDraft((d) => ({ ...d, date: "", qty: 1, price: 0, complimentary: false }));
  };

  const addBed = () => {
    if (!canAddBed) return;
    const next: ExtraBedDay = { id: newId(), createdAt: Date.now(), ...bedDraft };
    setState((s) => ({ ...s, extraBeds: [next, ...s.extraBeds].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)) }));
    setBedOpen(false);
    setBedDraft((d) => ({ ...d, date: "", qty: 1, price: 0, complimentary: false }));
  };

  const removeAddon = (id: string) => setState((s) => ({ ...s, customAddOns: s.customAddOns.filter((a) => a.id !== id) }));
  const removeMeal = (id: string) => setState((s) => ({ ...s, mealPlans: s.mealPlans.filter((m) => m.id !== id) }));
  const removeBed = (id: string) => setState((s) => ({ ...s, extraBeds: s.extraBeds.filter((b) => b.id !== id) }));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Add-ons</p>
          <p className="text-xs text-muted-foreground">Charges, meal plans & extra beds for specific days</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as AddTarget)}>
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="addons">Add-ons{addonCount ? ` (${addonCount})` : ""}</TabsTrigger>
          <TabsTrigger value="meal">Meal plan{mealCount ? ` (${mealCount})` : ""}</TabsTrigger>
          <TabsTrigger value="bed">Extra bed{bedCount ? ` (${bedCount})` : ""}</TabsTrigger>
        </TabsList>

        <TabsContent value="addons" className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Custom add-ons</p>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => {
                setTab("addons");
                setAddonOpen(true);
                setMealOpen(false);
                setBedOpen(false);
                setAddonDraft((d) => ({ ...d, date: d.date?.trim().length ? d.date : todayYmd() }));
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add add-on
            </Button>
          </div>

          {addonOpen ? (
            <div className="rounded-lg border border-border bg-background p-3 space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Select activity</Label>
                  <Select value={addonDraft.activity} onValueChange={(v) => setAddonDraft((d) => ({ ...d, activity: v as CustomChargeType }))}>
                    <SelectTrigger><SelectValue placeholder="Select activity" /></SelectTrigger>
                    <SelectContent>
                      {CUSTOM_ACTIVITIES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Charge type</Label>
                  <Select value={addonDraft.chargeType} onValueChange={(v) => setAddonDraft((d) => ({ ...d, chargeType: v as CustomAddon["chargeType"] }))}>
                    <SelectTrigger><SelectValue placeholder="Charge type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Service">Service</SelectItem>
                      <SelectItem value="Damage">Damage</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="addonServiceName">Service name</Label>
                  <Input
                    id="addonServiceName"
                    placeholder="e.g., Laundry, Spa, Restaurant"
                    value={addonDraft.serviceName}
                    onChange={(e) => setAddonDraft((d) => ({ ...d, serviceName: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="addonDate">Select date</Label>
                  <Input id="addonDate" type="date" value={addonDraft.date} onChange={(e) => setAddonDraft((d) => ({ ...d, date: e.target.value }))} />
                </div>

                <div className="space-y-1.5">
                  <Label>Pricing mode</Label>
                  <Select value={addonDraft.pricingMode} onValueChange={(v) => setAddonDraft((d) => ({ ...d, pricingMode: v as PricingMode }))}>
                    <SelectTrigger><SelectValue placeholder="-- Select --" /></SelectTrigger>
                    <SelectContent>
                      {PRICING_MODES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="addonDesc">Description</Label>
                  <Input id="addonDesc" placeholder="Notes" value={addonDraft.description ?? ""} onChange={(e) => setAddonDraft((d) => ({ ...d, description: e.target.value }))} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="addonAmount">Amount (₹)</Label>
                  <Input id="addonAmount" type="number" min={0} value={addonDraft.amount} onChange={(e) => setAddonDraft((d) => ({ ...d, amount: Number(e.target.value) }))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="addonDiscount">Discount amount (₹)</Label>
                  <Input id="addonDiscount" type="number" min={0} value={addonDraft.discountAmount} onChange={(e) => setAddonDraft((d) => ({ ...d, discountAmount: Number(e.target.value) }))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="addonTax">Tax percentage (%)</Label>
                  <Input id="addonTax" type="number" min={0} value={addonDraft.taxPercent} onChange={(e) => setAddonDraft((d) => ({ ...d, taxPercent: Number(e.target.value) }))} />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Checkbox id="addonComplimentary" checked={addonDraft.complimentary} onCheckedChange={(v) => setAddonDraft((d) => ({ ...d, complimentary: Boolean(v) }))} />
                  <Label htmlFor="addonComplimentary" className="text-sm">Complimentary</Label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" onClick={() => setAddonOpen(false)}>Cancel</Button>
                <Button onClick={addAddon} disabled={!canAddAddon}>Add</Button>
              </div>
            </div>
          ) : null}

          <Separator />

          {addonCount ? (
            <div className="space-y-2">
              {state.customAddOns.map((a) => (
                <div key={a.id} className="rounded-md border border-border p-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {a.serviceName || a.activity} · ₹{a.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {a.date} · {a.chargeType}{a.complimentary ? " · Complimentary" : ""}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 text-destructive hover:text-destructive" onClick={() => removeAddon(a.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              No add-ons added.
            </div>
          )}
        </TabsContent>

        <TabsContent value="meal" className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Meal plan days</p>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => {
                setTab("meal");
                setMealOpen(true);
                setAddonOpen(false);
                setBedOpen(false);
                setMealDraft((d) => ({ ...d, date: d.date?.trim().length ? d.date : todayYmd() }));
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add meal plan
            </Button>
          </div>

          {mealOpen ? (
            <div className="rounded-lg border border-border bg-background p-3 space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="mealDate">Select date</Label>
                  <Input id="mealDate" type="date" value={mealDraft.date} onChange={(e) => setMealDraft((d) => ({ ...d, date: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Meal plan</Label>
                  <Select value={mealDraft.plan} onValueChange={(v) => setMealDraft((d) => ({ ...d, plan: v as MealPlanName }))}>
                    <SelectTrigger><SelectValue placeholder="Select meal plan" /></SelectTrigger>
                    <SelectContent>
                      {MEAL_PLANS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Guest type</Label>
                  <Select value={mealDraft.guestType} onValueChange={(v) => setMealDraft((d) => ({ ...d, guestType: v as MealPlanGuestType }))}>
                    <SelectTrigger><SelectValue placeholder="Adult/Child" /></SelectTrigger>
                    <SelectContent>
                      {GUEST_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 sm:col-span-1">
                  <Label htmlFor="mealQty">Qty</Label>
                  <Input id="mealQty" type="number" min={1} value={mealDraft.qty} onChange={(e) => setMealDraft((d) => ({ ...d, qty: Number(e.target.value) }))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="mealPrice">Price (₹)</Label>
                  <Input id="mealPrice" type="number" min={0} value={mealDraft.price} onChange={(e) => setMealDraft((d) => ({ ...d, price: Number(e.target.value) }))} />
                </div>
                <div className="flex items-center gap-2 sm:col-span-2 pt-6">
                  <Checkbox id="mealComplimentary" checked={mealDraft.complimentary} onCheckedChange={(v) => setMealDraft((d) => ({ ...d, complimentary: Boolean(v) }))} />
                  <Label htmlFor="mealComplimentary" className="text-sm">Complimentary</Label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" onClick={() => setMealOpen(false)}>Cancel</Button>
                <Button onClick={addMeal} disabled={!canAddMeal}>Add</Button>
              </div>
            </div>
          ) : null}

          <Separator />

          {mealCount ? (
            <div className="space-y-2">
              {state.mealPlans.map((m) => (
                <div key={m.id} className="rounded-md border border-border p-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{m.plan} · {m.guestType} × {m.qty}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{m.date}{m.complimentary ? " · Complimentary" : ""}</p>
                  </div>
                  <span className="text-sm font-semibold text-foreground tabular-nums">
                    ₹{(m.price ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                  <Button variant="ghost" size="sm" className="h-8 text-destructive hover:text-destructive" onClick={() => removeMeal(m.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              No meal plans added.
            </div>
          )}
        </TabsContent>

        <TabsContent value="bed" className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Extra bed days</p>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => {
                setTab("bed");
                setBedOpen(true);
                setAddonOpen(false);
                setMealOpen(false);
                setBedDraft((d) => ({ ...d, date: d.date?.trim().length ? d.date : todayYmd() }));
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add extra bed
            </Button>
          </div>

          {bedOpen ? (
            <div className="rounded-lg border border-border bg-background p-3 space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="bedDate">Select date</Label>
                  <Input id="bedDate" type="date" value={bedDraft.date} onChange={(e) => setBedDraft((d) => ({ ...d, date: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Extra bed</Label>
                  <Select value={bedDraft.bedType} onValueChange={(v) => setBedDraft((d) => ({ ...d, bedType: v as ExtraBedType }))}>
                    <SelectTrigger><SelectValue placeholder="Select extra bed" /></SelectTrigger>
                    <SelectContent>
                      {EXTRA_BEDS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bedQty">Qty</Label>
                  <Input id="bedQty" type="number" min={1} value={bedDraft.qty} onChange={(e) => setBedDraft((d) => ({ ...d, qty: Number(e.target.value) }))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bedPrice">Price (₹)</Label>
                  <Input id="bedPrice" type="number" min={0} value={bedDraft.price} onChange={(e) => setBedDraft((d) => ({ ...d, price: Number(e.target.value) }))} />
                </div>
                <div className="flex items-center gap-2 sm:col-span-3 pt-1">
                  <Checkbox id="bedComplimentary" checked={bedDraft.complimentary} onCheckedChange={(v) => setBedDraft((d) => ({ ...d, complimentary: Boolean(v) }))} />
                  <Label htmlFor="bedComplimentary" className="text-sm">Complimentary</Label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" onClick={() => setBedOpen(false)}>Cancel</Button>
                <Button onClick={addBed} disabled={!canAddBed}>Add</Button>
              </div>
            </div>
          ) : null}

          <Separator />

          {bedCount ? (
            <div className="space-y-2">
              {state.extraBeds.map((b) => (
                <div key={b.id} className="rounded-md border border-border p-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{b.bedType} × {b.qty}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{b.date}{b.complimentary ? " · Complimentary" : ""}</p>
                  </div>
                  <span className="text-sm font-semibold text-foreground tabular-nums">
                    ₹{(b.price ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                  <Button variant="ghost" size="sm" className="h-8 text-destructive hover:text-destructive" onClick={() => removeBed(b.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              No extra beds added.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function BookingAddOnsSummary({
  bookingId,
  booking,
  openPrintSignal,
}: {
  bookingId: string;
  booking: BookingPrintInfo;
  openPrintSignal?: number;
}) {
  const [state, setState] = useState<AddOnsState>({ customAddOns: [], mealPlans: [], extraBeds: [] });
  const printRef = useRef<HTMLDivElement>(null);
  const singlePrintRef = useRef<HTMLDivElement>(null);
  const [printOpen, setPrintOpen] = useState(false);
  const [singlePrintOpen, setSinglePrintOpen] = useState(false);
  const [showAllAddOns, setShowAllAddOns] = useState(false);
  const [showAllMeals, setShowAllMeals] = useState(false);
  const [showAllBeds, setShowAllBeds] = useState(false);
  const [singleBillTitle, setSingleBillTitle] = useState("");
  const [singleBillSubTitle, setSingleBillSubTitle] = useState("");
  const [singleBillAmount, setSingleBillAmount] = useState(0);
  const [propertyName, setPropertyName] = useState("Sunrise Residency");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedPrintOpen, setSelectedPrintOpen] = useState(false);
  const selectedPrintRef = useRef<HTMLDivElement>(null);
  const lastHandledPrintSignal = useRef<number>(openPrintSignal ?? 0);
  const hasInitializedPrintSignal = useRef(false);

  useEffect(() => {
    setState(getBookingAddOns(bookingId));
  }, [bookingId]);

  useEffect(() => {
    if (!hasInitializedPrintSignal.current) {
      hasInitializedPrintSignal.current = true;
      lastHandledPrintSignal.current = openPrintSignal ?? 0;
      return;
    }
    if (!openPrintSignal) return;
    if (openPrintSignal === lastHandledPrintSignal.current) return;
    lastHandledPrintSignal.current = openPrintSignal;
    setPrintOpen(true);
  }, [openPrintSignal]);

  const addonCount = state.customAddOns.length;
  const mealCount = state.mealPlans.length;
  const bedCount = state.extraBeds.length;

  if (!addonCount && !mealCount && !bedCount) return null;

  const addOnTotal =
    state.customAddOns.reduce((sum, a) => sum + (a.complimentary ? 0 : a.amount), 0) +
    state.mealPlans.reduce((sum, m) => sum + (m.complimentary ? 0 : (m.price ?? 0) * m.qty), 0) +
    state.extraBeds.reduce((sum, b) => sum + (b.complimentary ? 0 : (b.price ?? 0) * b.qty), 0);
  const roomTotal = booking.total - booking.discount + booking.taxAmount;
  const grandTotal = roomTotal + addOnTotal;

  const handleModalPrint = () => {
    const html = printRef.current?.innerHTML;
    if (!html) return;
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(`
      <html>
      <head>
        <title>Booking Add-ons</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #111827; }
          h1 { margin: 0 0 4px 0; font-size: 22px; }
          h2 { margin: 0 0 6px 0; font-size: 18px; }
          .muted { color: #6b7280; font-size: 12px; margin-bottom: 12px; }
          .section { margin-top: 16px; }
          .section-title { font-size: 13px; font-weight: 600; color: #4b5563; margin-bottom: 8px; }
          .row { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 12px; margin-bottom: 8px; display: flex; justify-content: space-between; gap: 12px; }
          .meta { margin: 10px 0 14px 0; display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 6px 16px; font-size: 13px; }
          .totals { margin-top: 14px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 12px; }
          .totals .line { display: flex; justify-content: space-between; margin: 5px 0; font-size: 14px; }
          .totals .grand { font-size: 16px; font-weight: 700; border-top: 1px dashed #d1d5db; padding-top: 8px; margin-top: 8px; }
          .line1 { font-size: 15px; font-weight: 600; }
          .line2 { font-size: 12px; color: #6b7280; margin-top: 4px; }
          .price { font-size: 15px; font-weight: 700; white-space: nowrap; }
        </style>
      </head>
      <body>${html}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  const openSingleBillPrint = (title: string, subtitle: string, amount: number) => {
    setSingleBillTitle(title);
    setSingleBillSubTitle(subtitle);
    setSingleBillAmount(amount);
    setSinglePrintOpen(true);
  };

  const handleSingleBillPrint = () => {
    const html = singlePrintRef.current?.innerHTML;
    if (!html) return;
    const win = window.open("", "_blank", "width=780,height=620");
    if (!win) return;
    win.document.write(`
      <html>
      <head>
        <title>Bill - ${singleBillTitle}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #111827; }
          h1 { margin: 0 0 4px 0; font-size: 22px; }
          h2 { margin: 0 0 8px 0; font-size: 18px; }
          .muted { color: #6b7280; font-size: 12px; margin-bottom: 12px; }
          .meta { margin: 10px 0 14px 0; display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 6px 16px; font-size: 13px; }
          .row { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 14px; display: flex; justify-content: space-between; gap: 12px; margin-top: 8px; }
          .line1 { font-size: 16px; font-weight: 600; margin: 0; }
          .line2 { font-size: 12px; color: #6b7280; margin: 6px 0 0 0; }
          .price { font-size: 18px; font-weight: 700; white-space: nowrap; }
        </style>
      </head>
      <body>${html}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selAddons = state.customAddOns.filter((a) => selectedIds.has(a.id));
  const selMeals = state.mealPlans.filter((m) => selectedIds.has(m.id));
  const selBeds = state.extraBeds.filter((b) => selectedIds.has(b.id));
  const selectedTotal =
    selAddons.reduce((s, a) => s + (a.complimentary ? 0 : a.amount), 0) +
    selMeals.reduce((s, m) => s + (m.complimentary ? 0 : (m.price ?? 0) * m.qty), 0) +
    selBeds.reduce((s, b) => s + (b.complimentary ? 0 : (b.price ?? 0) * b.qty), 0);
  const selectedCount = selectedIds.size;

  const handleSelectedPrint = () => {
    const html = selectedPrintRef.current?.innerHTML;
    if (!html) return;
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(`
      <html>
      <head>
        <title>Selected Charges</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #111827; }
          h1 { margin: 0 0 4px 0; font-size: 22px; }
          h2 { margin: 0 0 6px 0; font-size: 18px; }
          .muted { color: #6b7280; font-size: 12px; margin-bottom: 12px; }
          .section { margin-top: 16px; }
          .section-title { font-size: 13px; font-weight: 600; color: #4b5563; margin-bottom: 8px; }
          .row { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 12px; margin-bottom: 8px; display: flex; justify-content: space-between; gap: 12px; }
          .meta { margin: 10px 0 14px 0; display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 6px 16px; font-size: 13px; }
          .totals { margin-top: 14px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 12px; }
          .totals .line { display: flex; justify-content: space-between; margin: 5px 0; font-size: 14px; }
          .totals .grand { font-size: 16px; font-weight: 700; border-top: 1px dashed #d1d5db; padding-top: 8px; margin-top: 8px; }
          .line1 { font-size: 15px; font-weight: 600; }
          .line2 { font-size: 12px; color: #6b7280; margin-top: 4px; }
          .price { font-size: 15px; font-weight: 700; white-space: nowrap; }
        </style>
      </head>
      <body>${html}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">Additional Charges</p>
          <p className="text-xs text-muted-foreground">Saved items</p>
        </div>
        {selectedCount > 0 && (
          <Button
            size="sm"
            className="h-7 text-xs gap-1.5"
            onClick={() => setSelectedPrintOpen(true)}
          >
            <Printer className="h-3.5 w-3.5" />
            Print {selectedCount} selected · ₹{selectedTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </Button>
        )}
      </div>

      <Dialog open={printOpen} onOpenChange={setPrintOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Print booking invoice</DialogTitle>
            <DialogDescription>Review details, then print.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="propertyName">Property name</Label>
            <Input id="propertyName" value={propertyName} onChange={(e) => setPropertyName(e.target.value)} />
          </div>

          <div ref={printRef} className="max-h-[55vh] overflow-auto rounded-md border border-border p-4">
            <h1>{propertyName || "Property"}</h1>
            <h2>Guest invoice</h2>
            <div className="meta">
              <div><strong>Guest:</strong> {booking.guestName}</div>
              <div><strong>Phone:</strong> {booking.phone}</div>
              <div><strong>Booking ID:</strong> {booking.bookingId}</div>
              <div><strong>Invoice ID:</strong> {booking.invoiceId}</div>
              <div><strong>Room:</strong> {booking.roomNumber} · {booking.roomType}</div>
              <div><strong>Stay:</strong> {booking.checkIn} → {booking.checkOut}</div>
            </div>

            {addonCount ? (
              <div className="space-y-2 section">
                <p className="text-xs font-medium text-muted-foreground section-title">Add-ons ({addonCount})</p>
                {state.customAddOns.slice(0, 3).map((a) => (
                  <div key={a.id} className="rounded-md border border-border p-3 flex items-start justify-between gap-3 row">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate line1">{a.serviceName || a.activity}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line2">{a.date}{a.complimentary ? " · Complimentary" : ""}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground tabular-nums price">
                        ₹{a.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {mealCount ? (
              <div className="space-y-2 section">
                <p className="text-xs font-medium text-muted-foreground section-title">Meal plans ({mealCount})</p>
                {state.mealPlans.slice(0, 3).map((m) => (
                  <div key={m.id} className="rounded-md border border-border p-3 flex items-start justify-between gap-3 row">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate line1">{m.plan} · {m.guestType} × {m.qty}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line2">{m.date}{m.complimentary ? " · Complimentary" : ""}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground tabular-nums price">
                        ₹{(m.price ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {bedCount ? (
              <div className="space-y-2 section">
                <p className="text-xs font-medium text-muted-foreground section-title">Extra beds ({bedCount})</p>
                {state.extraBeds.slice(0, 3).map((b) => (
                  <div key={b.id} className="rounded-md border border-border p-3 flex items-start justify-between gap-3 row">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate line1">{b.bedType} × {b.qty}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line2">{b.date}{b.complimentary ? " · Complimentary" : ""}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground tabular-nums price">
                        ₹{(b.price ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="totals">
              <div className="line"><span>Room total (after discount + tax)</span><strong>₹{roomTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong></div>
              <div className="line"><span>Add-ons total</span><strong>₹{addOnTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong></div>
              <div className="line"><span>Total paid</span><strong>₹{booking.totalPaid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong></div>
              <div className="line grand"><span>Guest total bill amount</span><strong>₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong></div>
              <div className="line"><span>Balance due</span><strong>₹{Math.max(0, booking.balanceDue).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong></div>
            </div>

            {booking.paymentHistory?.length ? (
              <div className="space-y-2 section">
                <p className="text-xs font-medium text-muted-foreground section-title">Payment history</p>
                {booking.paymentHistory.map((p) => (
                  <div key={p.id} className="rounded-md border border-border p-3 flex items-start justify-between gap-3 row">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate line1">{p.method}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line2">
                        {new Date(p.paidAt).toLocaleString("en-IN")}
                        {p.receiptNo ? ` · ${p.receiptNo}` : ""}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-foreground tabular-nums price">
                      ₹{p.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPrintOpen(false)}>Close</Button>
            <Button onClick={handleModalPrint}>Print</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={singlePrintOpen} onOpenChange={setSinglePrintOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Print single bill item</DialogTitle>
            <DialogDescription>Optimized layout for one bill item.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="singlePropertyName">Property name</Label>
            <Input id="singlePropertyName" value={propertyName} onChange={(e) => setPropertyName(e.target.value)} />
          </div>

          <div ref={singlePrintRef} className="rounded-md border border-border p-4">
            <h1>{propertyName || "Property"}</h1>
            <h2>Single bill invoice</h2>
            <div className="meta">
              <div><strong>Guest:</strong> {booking.guestName}</div>
              <div><strong>Phone:</strong> {booking.phone}</div>
              <div><strong>Booking ID:</strong> {booking.bookingId}</div>
              <div><strong>Invoice ID:</strong> {booking.invoiceId}</div>
            </div>
            <div className="row">
              <div>
                <p className="line1">{singleBillTitle}</p>
                <p className="line2">{singleBillSubTitle}</p>
              </div>
              <div className="price">
                ₹{singleBillAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSinglePrintOpen(false)}>Close</Button>
            <Button onClick={handleSingleBillPrint}>Print</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="max-h-[45vh] overflow-y-auto space-y-3 pr-1">
        {addonCount ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-muted-foreground">Add-ons ({addonCount})</p>
              {addonCount > 2 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setShowAllAddOns((v) => !v)}
                >
                  {showAllAddOns ? "Hide add-ons" : "View full add-ons"}
                </Button>
              ) : null}
            </div>
            <div className="rounded-md border border-border divide-y divide-border">
              {(showAllAddOns ? state.customAddOns : state.customAddOns.slice(0, 2)).map((a) => (
                <div key={a.id} className="flex items-center gap-3 px-3 py-2">
                  <Checkbox
                    checked={selectedIds.has(a.id)}
                    onCheckedChange={() => toggleSelected(a.id)}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{a.serviceName || a.activity}</p>
                    <p className="text-xs text-muted-foreground">{a.date}{a.complimentary ? " · Complimentary" : ""}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground tabular-nums">
                      ₹{a.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        openSingleBillPrint(
                          a.serviceName || a.activity,
                          `${a.date}${a.complimentary ? " · Complimentary" : ""}`,
                          a.amount,
                        )
                      }
                      aria-label="Print bill"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {mealCount ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-muted-foreground">Meal plans ({mealCount})</p>
              {mealCount > 2 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setShowAllMeals((v) => !v)}
                >
                  {showAllMeals ? "Hide meal plans" : "View full meal plans"}
                </Button>
              ) : null}
            </div>
            <div className="rounded-md border border-border divide-y divide-border">
              {(showAllMeals ? state.mealPlans : state.mealPlans.slice(0, 2)).map((m) => (
                <div key={m.id} className="flex items-center gap-3 px-3 py-2">
                  <Checkbox
                    checked={selectedIds.has(m.id)}
                    onCheckedChange={() => toggleSelected(m.id)}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{m.plan} · {m.guestType} × {m.qty}</p>
                    <p className="text-xs text-muted-foreground">{m.date}{m.complimentary ? " · Complimentary" : ""}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground tabular-nums">
                      ₹{(m.price ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        openSingleBillPrint(
                          `${m.plan} · ${m.guestType} × ${m.qty}`,
                          `${m.date}${m.complimentary ? " · Complimentary" : ""}`,
                          m.price ?? 0,
                        )
                      }
                      aria-label="Print bill"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {bedCount ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-muted-foreground">Extra beds ({bedCount})</p>
              {bedCount > 2 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setShowAllBeds((v) => !v)}
                >
                  {showAllBeds ? "Hide extra beds" : "View full extra beds"}
                </Button>
              ) : null}
            </div>
            <div className="rounded-md border border-border divide-y divide-border">
              {(showAllBeds ? state.extraBeds : state.extraBeds.slice(0, 2)).map((b) => (
                <div key={b.id} className="flex items-center gap-3 px-3 py-2">
                  <Checkbox
                    checked={selectedIds.has(b.id)}
                    onCheckedChange={() => toggleSelected(b.id)}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{b.bedType} × {b.qty}</p>
                    <p className="text-xs text-muted-foreground">{b.date}{b.complimentary ? " · Complimentary" : ""}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground tabular-nums">
                      ₹{(b.price ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        openSingleBillPrint(
                          `${b.bedType} × ${b.qty}`,
                          `${b.date}${b.complimentary ? " · Complimentary" : ""}`,
                          b.price ?? 0,
                        )
                      }
                      aria-label="Print bill"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* Selected items print modal */}
      <Dialog open={selectedPrintOpen} onOpenChange={setSelectedPrintOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Print selected charges</DialogTitle>
            <DialogDescription>{selectedCount} item{selectedCount !== 1 ? "s" : ""} selected · Total: ₹{selectedTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="selPropertyName">Property name</Label>
            <Input id="selPropertyName" value={propertyName} onChange={(e) => setPropertyName(e.target.value)} />
          </div>

          <div ref={selectedPrintRef} className="max-h-[55vh] overflow-auto rounded-md border border-border p-4">
            <h1>{propertyName || "Property"}</h1>
            <h2>Selected charges invoice</h2>
            <div className="meta">
              <div><strong>Guest:</strong> {booking.guestName}</div>
              <div><strong>Phone:</strong> {booking.phone}</div>
              <div><strong>Booking ID:</strong> {booking.bookingId}</div>
              <div><strong>Invoice ID:</strong> {booking.invoiceId}</div>
              <div><strong>Room:</strong> {booking.roomNumber} · {booking.roomType}</div>
              <div><strong>Stay:</strong> {booking.checkIn} → {booking.checkOut}</div>
            </div>

            {selAddons.length ? (
              <div className="space-y-2 section">
                <p className="text-xs font-medium text-muted-foreground section-title">Add-ons ({selAddons.length})</p>
                {selAddons.map((a) => (
                  <div key={a.id} className="rounded-md border border-border p-3 flex items-start justify-between gap-3 row">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate line1">{a.serviceName || a.activity}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line2">{a.date}{a.complimentary ? " · Complimentary" : ""}</p>
                    </div>
                    <span className="text-sm font-semibold text-foreground tabular-nums price">
                      ₹{a.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}

            {selMeals.length ? (
              <div className="space-y-2 section">
                <p className="text-xs font-medium text-muted-foreground section-title">Meal plans ({selMeals.length})</p>
                {selMeals.map((m) => (
                  <div key={m.id} className="rounded-md border border-border p-3 flex items-start justify-between gap-3 row">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate line1">{m.plan} · {m.guestType} × {m.qty}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line2">{m.date}{m.complimentary ? " · Complimentary" : ""}</p>
                    </div>
                    <span className="text-sm font-semibold text-foreground tabular-nums price">
                      ₹{(m.price ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}

            {selBeds.length ? (
              <div className="space-y-2 section">
                <p className="text-xs font-medium text-muted-foreground section-title">Extra beds ({selBeds.length})</p>
                {selBeds.map((b) => (
                  <div key={b.id} className="rounded-md border border-border p-3 flex items-start justify-between gap-3 row">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate line1">{b.bedType} × {b.qty}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line2">{b.date}{b.complimentary ? " · Complimentary" : ""}</p>
                    </div>
                    <span className="text-sm font-semibold text-foreground tabular-nums price">
                      ₹{(b.price ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="totals">
              <div className="line grand"><span>Selected charges total</span><strong>₹{selectedTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedPrintOpen(false)}>Close</Button>
            <Button onClick={handleSelectedPrint}>Print</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

