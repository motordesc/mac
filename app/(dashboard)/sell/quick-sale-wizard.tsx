"use client";

import { useState, useTransition, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { processQuickSale, type SaleItem } from "@/app/actions/sell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  User, Car, ShoppingCart, CreditCard,
  Plus, Minus, Search, ChevronRight, Check, Zap,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
type CatalogService = { id: string; name: string; defaultPrice: { toString(): string } };
type CatalogPart    = { id: string; name: string; sku: string | null; sellingPrice: { toString(): string }; quantity: number };
type StaffMember    = { id: string; name: string; role: string };

type CartItem = SaleItem & { key: string };

type CustomerDraft = {
  mode: "new" | "existing";
  customerId?: string;
  name: string; phone: string; address: string;
};

type VehicleDraft = {
  mode: "new" | "existing";
  vehicleId?: string;
  numberPlate: string; make: string; model: string; year: string;
};

const STEPS = [
  { id: 1, label: "Customer & Vehicle", icon: User },
  { id: 2, label: "Services & Parts",   icon: ShoppingCart },
  { id: 3, label: "Payment",            icon: CreditCard },
];

// ── Helpers ────────────────────────────────────────────────────────────────
function fmtPrice(v: { toString(): string } | number) {
  return `₹${parseFloat(v.toString()).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

let keyCounter = 0;
function nextKey() { return String(++keyCounter); }

// ══════════════════════════════════════════════════════════════════════════
export function QuickSaleWizard({
  services, inventory, staff, defaultTaxRate,
}: {
  services: CatalogService[];
  inventory: CatalogPart[];
  staff: StaffMember[];
  defaultTaxRate: number;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();

  // ── Step 1 state ──────────────────────────────────────────────────────
  const [customer, setCustomer] = useState<CustomerDraft>({ mode: "new", name: "", phone: "", address: "" });
  const [vehicle,  setVehicle]  = useState<VehicleDraft>({ mode: "new", numberPlate: "", make: "", model: "", year: "" });
  const [technicianId, setTechnicianId] = useState<string>("__none__");
  const [notes, setNotes] = useState("");

  // Phone-based customer lookup
  const phoneRef = useRef<HTMLInputElement>(null);
  const [lookingUp, setLookingUp] = useState(false);

  async function lookupByPhone() {
    const phone = customer.phone.trim();
    if (!phone) return;
    setLookingUp(true);
    try {
      const res = await fetch(`/api/customers/lookup?phone=${encodeURIComponent(phone)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.id) {
          setCustomer({ mode: "existing", customerId: data.id, name: data.name, phone: data.phone, address: data.address ?? "" });
          toast.success(`Found: ${data.name}`);
          // Also pre-fill most recent vehicle
          if (data.latestVehicle) {
            setVehicle({ mode: "existing", vehicleId: data.latestVehicle.id, numberPlate: data.latestVehicle.numberPlate, make: data.latestVehicle.make ?? "", model: data.latestVehicle.model ?? "", year: String(data.latestVehicle.year ?? "") });
          }
        }
      }
    } finally { setLookingUp(false); }
  }

  // ── Step 2 state ──────────────────────────────────────────────────────
  const [cart, setCart] = useState<CartItem[]>([]);
  const [serviceSearch, setServiceSearch] = useState("");
  const [partSearch,    setPartSearch]    = useState("");
  const [activeTab, setActiveTab] = useState<"service" | "part">("service");

  const filteredServices = services.filter(
    (s) => !serviceSearch || s.name.toLowerCase().includes(serviceSearch.toLowerCase())
  );
  const filteredParts = inventory.filter(
    (p) => !partSearch || p.name.toLowerCase().includes(partSearch.toLowerCase()) || (p.sku ?? "").toLowerCase().includes(partSearch.toLowerCase())
  );

  function addService(svc: CatalogService) {
    const price = parseFloat(svc.defaultPrice.toString());
    const existing = cart.find((c) => c.refId === svc.id && c.type === "SERVICE");
    if (existing) {
      setCart((prev) => prev.map((c) => c.key === existing.key ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart((prev) => [...prev, { key: nextKey(), type: "SERVICE", refId: svc.id, description: svc.name, quantity: 1, unitPrice: price }]);
    }
  }

  function addPart(part: CatalogPart) {
    const price = parseFloat(part.sellingPrice.toString());
    const existing = cart.find((c) => c.refId === part.id && c.type === "PART");
    if (existing) {
      setCart((prev) => prev.map((c) => c.key === existing.key ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart((prev) => [...prev, { key: nextKey(), type: "PART", refId: part.id, description: part.name, quantity: 1, unitPrice: price }]);
    }
  }

  function removeItem(key: string) { setCart((prev) => prev.filter((c) => c.key !== key)); }
  function updateQty(key: string, delta: number) {
    setCart((prev) => prev.map((c) => {
      if (c.key !== key) return c;
      const q = Math.max(1, c.quantity + delta);
      return { ...c, quantity: q };
    }));
  }
  function updatePrice(key: string, val: string) {
    const n = parseFloat(val);
    if (!isNaN(n)) setCart((prev) => prev.map((c) => c.key === key ? { ...c, unitPrice: n } : c));
  }

  // ── Step 3 state ──────────────────────────────────────────────────────
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "UPI" | "BANK_TRANSFER" | "OTHER">("CASH");
  const [taxPercent, setTaxPercent] = useState(defaultTaxRate);

  const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const taxAmount = parseFloat(((subtotal * taxPercent) / 100).toFixed(2));
  const total = subtotal + taxAmount;

  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const paidAmt = parseFloat(paymentAmount) || 0;
  const change = paidAmt - total;

  // ── Validate steps ────────────────────────────────────────────────────
  function step1Valid() {
    if (customer.mode === "new" && (!customer.name.trim() || !customer.phone.trim())) return false;
    if (customer.mode === "existing" && !customer.customerId) return false;
    if (vehicle.mode === "new" && !vehicle.numberPlate.trim()) return false;
    if (vehicle.mode === "existing" && !vehicle.vehicleId) return false;
    return true;
  }
  function step2Valid() { return cart.length > 0; }

  // ── Submit ─────────────────────────────────────────────────────────────
  function handleSubmit() {
    startTransition(async () => {
      try {
        const result = await processQuickSale({
          customerId: customer.customerId,
          customerName: customer.name,
          customerPhone: customer.phone,
          customerAddress: customer.address || undefined,
          vehicleId: vehicle.vehicleId,
          vehicleNumberPlate: vehicle.numberPlate,
          vehicleMake: vehicle.make || undefined,
          vehicleModel: vehicle.model || undefined,
          vehicleYear: vehicle.year ? parseInt(vehicle.year) : undefined,
          technicianId: technicianId === "__none__" ? null : technicianId,
          notes: notes || undefined,
          items: cart,
          taxPercent,
          paymentMethod,
          paymentAmount: paidAmt > 0 ? paidAmt : total,
        });
        toast.success("Sale completed! Redirecting to invoice…");
        router.push(`/invoices/${result.invoice.id}`);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to process sale");
      }
    });
  }

  // ══════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-4">
      {/* ── Step indicator ────────────────────────────────────────────── */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, idx) => {
          const done = step > s.id;
          const active = step === s.id;
          const Icon = s.icon;
          return (
            <div key={s.id} className="flex items-center gap-1 flex-1 last:flex-none">
              <button
                onClick={() => done && setStep(s.id)}
                disabled={!done}
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  active ? "bg-primary text-primary-foreground"
                  : done ? "bg-primary/10 text-primary hover:bg-primary/20"
                  : "bg-muted text-muted-foreground"
                }`}
              >
                {done ? <Check className="size-3.5" /> : <Icon className="size-3.5" />}
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{s.id}</span>
              </button>
              {idx < STEPS.length - 1 && (
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              )}
            </div>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          STEP 1 — Customer & Vehicle
      ══════════════════════════════════════════════════════════════════ */}
      {step === 1 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="size-4" /> Customer & Vehicle
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Phone lookup */}
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <div className="flex gap-2">
                <Input
                  ref={phoneRef}
                  value={customer.phone}
                  onChange={(e) => setCustomer((p) => ({ ...p, phone: e.target.value, mode: "new" }))}
                  placeholder="+91 98765 43210"
                  className="flex-1"
                  onKeyDown={(e) => e.key === "Enter" && lookupByPhone()}
                />
                <Button variant="outline" size="icon" onClick={lookupByPhone} disabled={lookingUp} title="Search customer by phone">
                  <Search className="size-4" />
                </Button>
              </div>
              {customer.mode === "existing" && (
                <div className="flex items-center gap-2 text-sm text-primary">
                  <Check className="size-3.5" />
                  <span>Existing customer: <strong>{customer.name}</strong></span>
                  <button className="text-muted-foreground underline" onClick={() => setCustomer({ mode: "new", name: "", phone: customer.phone, address: "" })}>clear</button>
                </div>
              )}
            </div>

            {/* Name & address — only shown for new customers */}
            {customer.mode === "new" && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Customer Name *</Label>
                  <Input
                    value={customer.name}
                    onChange={(e) => setCustomer((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Ravi Kumar"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input
                    value={customer.address}
                    onChange={(e) => setCustomer((p) => ({ ...p, address: e.target.value }))}
                    placeholder="Optional"
                  />
                </div>
              </div>
            )}

            <Separator />

            {/* Vehicle */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Car className="size-4" /> Vehicle
              </Label>
              {vehicle.mode === "existing" && (
                <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
                  <Check className="size-3.5 text-primary" />
                  <span>Using: <strong>{vehicle.numberPlate}</strong> {vehicle.make} {vehicle.model}</span>
                  <button className="ml-auto text-xs text-muted-foreground underline" onClick={() => setVehicle({ mode: "new", numberPlate: vehicle.numberPlate, make: "", model: "", year: "" })}>change</button>
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Number Plate *</Label>
                  <Input
                    value={vehicle.numberPlate}
                    onChange={(e) => setVehicle((p) => ({ ...p, numberPlate: e.target.value.toUpperCase(), mode: "new", vehicleId: undefined }))}
                    placeholder="KA01AB1234"
                    className="uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Make</Label>
                  <Input value={vehicle.make} onChange={(e) => setVehicle((p) => ({ ...p, make: e.target.value }))} placeholder="Maruti" />
                </div>
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Input value={vehicle.model} onChange={(e) => setVehicle((p) => ({ ...p, model: e.target.value }))} placeholder="Swift" />
                </div>
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Input value={vehicle.year} onChange={(e) => setVehicle((p) => ({ ...p, year: e.target.value }))} placeholder="2020" type="number" />
                </div>
              </div>
            </div>

            <Separator />

            {/* Technician + Notes */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Technician</Label>
                <Select value={technicianId} onValueChange={setTechnicianId}>
                  <SelectTrigger><SelectValue placeholder="Assign technician" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— None —</SelectItem>
                    {staff.map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>{s.name} ({s.role})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional service notes" />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button onClick={() => setStep(2)} disabled={!step1Valid()} size="lg">
                Next: Add Services <ChevronRight className="ml-1 size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          STEP 2 — Services & Parts
      ══════════════════════════════════════════════════════════════════ */}
      {step === 2 && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="flex rounded-lg border border-border overflow-hidden">
                  <button
                    onClick={() => setActiveTab("service")}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === "service" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                  >
                    Services
                  </button>
                  <button
                    onClick={() => setActiveTab("part")}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === "part" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                  >
                    Parts
                  </button>
                </div>
                <Input
                  className="h-8 flex-1"
                  placeholder={activeTab === "service" ? "Search services…" : "Search parts by name / SKU…"}
                  value={activeTab === "service" ? serviceSearch : partSearch}
                  onChange={(e) => activeTab === "service" ? setServiceSearch(e.target.value) : setPartSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              {activeTab === "service" ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {filteredServices.length === 0 && (
                    <p className="col-span-2 py-4 text-center text-sm text-muted-foreground">No services found.</p>
                  )}
                  {filteredServices.map((svc: any) => {
                    const inCart = cart.find((c) => c.refId === svc.id && c.type === "SERVICE");
                    return (
                      <button
                        key={svc.id}
                        onClick={() => addService(svc)}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted ${inCart ? "border-primary/50 bg-primary/5" : "border-border"}`}
                      >
                        <div>
                          <p className="font-medium">{svc.name}</p>
                          <p className="text-muted-foreground">{fmtPrice(svc.defaultPrice)}</p>
                        </div>
                        {inCart ? (
                          <Badge variant="secondary" className="ml-2">{inCart.quantity}</Badge>
                        ) : (
                          <Plus className="size-4 shrink-0 text-muted-foreground" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {filteredParts.length === 0 && (
                    <p className="col-span-2 py-4 text-center text-sm text-muted-foreground">No parts found.</p>
                  )}
                  {filteredParts.map((part: any) => {
                    const inCart = cart.find((c) => c.refId === part.id && c.type === "PART");
                    const lowStock = part.quantity <= 0;
                    return (
                      <button
                        key={part.id}
                        onClick={() => !lowStock && addPart(part)}
                        disabled={lowStock}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${lowStock ? "opacity-40 cursor-not-allowed" : "hover:bg-muted"} ${inCart ? "border-primary/50 bg-primary/5" : "border-border"}`}
                      >
                        <div>
                          <p className="font-medium">{part.name}</p>
                          <p className="text-muted-foreground">
                            {fmtPrice(part.sellingPrice)} · Qty: {part.quantity}
                            {part.sku && <span className="ml-1 text-xs text-muted-foreground">({part.sku})</span>}
                          </p>
                        </div>
                        {inCart ? (
                          <Badge variant="secondary" className="ml-2">{inCart.quantity}</Badge>
                        ) : lowStock ? (
                          <span className="text-xs text-destructive">Out of stock</span>
                        ) : (
                          <Plus className="size-4 shrink-0 text-muted-foreground" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cart */}
          {cart.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2"><ShoppingCart className="size-4" /> Cart ({cart.length} item{cart.length !== 1 ? "s" : ""})</span>
                  <span className="text-muted-foreground font-normal text-sm">{fmtPrice(subtotal)}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {cart.map((item: any) => (
                  <div key={item.key} className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2">
                    <Badge variant="outline" className="text-xs shrink-0">{item.type}</Badge>
                    <span className="flex-1 text-sm font-medium truncate">{item.description}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQty(item.key, -1)} className="flex size-6 items-center justify-center rounded border hover:bg-muted">
                        <Minus className="size-3" />
                      </button>
                      <span className="w-6 text-center text-sm">{item.quantity}</span>
                      <button onClick={() => updateQty(item.key, +1)} className="flex size-6 items-center justify-center rounded border hover:bg-muted">
                        <Plus className="size-3" />
                      </button>
                    </div>
                    <Input
                      type="number"
                      className="h-7 w-20 text-right text-sm"
                      value={item.unitPrice}
                      onChange={(e) => updatePrice(item.key, e.target.value)}
                    />
                    <button onClick={() => removeItem(item.key)} className="ml-1 text-muted-foreground hover:text-destructive">
                      <Minus className="size-4" />
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between pt-1">
            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
            <Button onClick={() => { setPaymentAmount(total.toFixed(2)); setStep(3); }} disabled={!step2Valid()} size="lg">
              Next: Payment <ChevronRight className="ml-1 size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          STEP 3 — Payment
      ══════════════════════════════════════════════════════════════════ */}
      {step === 3 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="size-4" /> Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Order summary */}
            <div className="rounded-lg bg-muted/40 px-4 py-3 space-y-1.5 text-sm">
              <p className="font-medium mb-2">Order Summary</p>
              {cart.map((item: any) => (
                <div key={item.key} className="flex justify-between text-muted-foreground">
                  <span>{item.description} × {item.quantity}</span>
                  <span>{fmtPrice(item.unitPrice * item.quantity)}</span>
                </div>
              ))}
              <Separator className="my-2" />
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span><span>{fmtPrice(subtotal)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Tax (%)</span>
                <Input
                  type="number" min={0} max={100} step={0.5}
                  className="h-7 w-16 text-center text-sm ml-auto"
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                />
                <span className="w-20 text-right">{fmtPrice(taxAmount)}</span>
              </div>
              <div className="flex justify-between font-semibold text-base pt-1">
                <span>Total</span><span className="text-primary">{fmtPrice(total)}</span>
              </div>
            </div>

            {/* Payment method */}
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <div className="flex flex-wrap gap-2">
                {(["CASH", "CARD", "UPI", "BANK_TRANSFER", "OTHER"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setPaymentMethod(m)}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium border transition-colors ${paymentMethod === m ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
                  >
                    {m.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount received */}
            <div className="space-y-2">
              <Label>Amount Received (₹)</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="text-xl font-semibold h-12"
                placeholder={total.toFixed(2)}
              />
              {paidAmt > 0 && change > 0 && (
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  Change to return: {fmtPrice(change)}
                </p>
              )}
              {paidAmt > 0 && paidAmt < total && (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  Balance due: {fmtPrice(total - paidAmt)} — invoice will be marked PENDING
                </p>
              )}
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button
                size="lg"
                onClick={handleSubmit}
                disabled={isPending}
                className="gap-2 min-w-[160px]"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Processing…
                  </span>
                ) : (
                  <>
                    <Zap className="size-4" />
                    Complete Sale
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
