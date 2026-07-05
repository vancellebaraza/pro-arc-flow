import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { toast } from "sonner";
import { MessageCircle, Pencil, Save, Plus } from "lucide-react";

const CATEGORY_OPTIONS = [
  "Electrical",
  "Plumbing",
  "Landscaping",
  "Painting",
  "Property Management",
  "Tank Cleaning",
  "Other",
];

interface Vendor {
  id: string;
  name: string;
  contact_person: string | null;
  phone: string;
  whatsapp_phone: string | null;
  email: string | null;
  category: string;
  services_offered: string | null;
  payment_history: string | null;
  cost: number | null;
}

const emptyVendorForm = {
  name: "",
  contact_person: "",
  phone: "",
  whatsapp_phone: "",
  email: "",
  category: "",
  services_offered: "",
  payment_history: "",
  cost: "",
};

export const Route = createFileRoute("/_authenticated/admin/vendors")({
  component: VendorManagementPage,
});

function normalizePhone(phone?: string | null) {
  return phone?.replace(/\D/g, "") ?? "";
}

function VendorManagementPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [form, setForm] = useState(emptyVendorForm);
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("vendors")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error(error.message);
      return;
    }

    const normalizedVendors = (data ?? []).map((vendor: any) => ({
      ...vendor,
      cost: vendor.cost != null && vendor.cost !== "" ? Number(vendor.cost) : null,
    })) as Vendor[];

    setVendors(normalizedVendors);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function saveVendor() {
    if (!form.name || !form.contact_person || !form.phone || !form.category) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const parsedCost = form.cost.trim() === "" ? null : parseFloat(form.cost);
      const payload = {
        ...form,
        cost: Number.isFinite(parsedCost) ? parsedCost : null,
        created_by: userData?.user?.id ?? null,
      };

      if (editingVendorId) {
        const { error } = await supabase
          .from("vendors")
          .update(payload)
          .eq("id", editingVendorId);
        if (error) throw error;
        toast.success("Vendor updated");
      } else {
        const { error } = await supabase.from("vendors").insert(payload);
        if (error) throw error;
        toast.success("Vendor created");
      }
      setEditingVendorId(null);
      setForm(emptyVendorForm);
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save vendor");
    } finally {
      setSaving(false);
    }
  }

  function editVendor(vendor: Vendor) {
    setEditingVendorId(vendor.id);
    setForm({
      name: vendor.name,
      contact_person: vendor.contact_person ?? "",
      phone: vendor.phone,
      whatsapp_phone: vendor.whatsapp_phone ?? "",
      email: vendor.email ?? "",
      category: vendor.category,
      services_offered: vendor.services_offered ?? "",
      payment_history: vendor.payment_history ?? "",
      cost: vendor.cost != null ? String(vendor.cost) : "",
    });
  }

  function resetForm() {
    setEditingVendorId(null);
    setForm(emptyVendorForm);
  }

  return (
    <div className="p-4 md:p-8 fade-in max-w-6xl mx-auto">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Vendor Management</h1>
          <p className="text-muted-foreground mt-1">
            Create, edit, and review vendors available for project assignments.
          </p>
        </div>
        <Link
          to="/admin"
          className="text-sm text-primary underline hover:text-primary/80"
        >
          Back to admin dashboard
        </Link>
      </div>

      <section className="mt-8 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Vendor details</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Required fields are Vendor Name, Contact Person, Telephone, and Category of Works.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={resetForm}>
              <Plus className="h-4 w-4 mr-1" /> New vendor
            </Button>
          </div>

          <div className="mt-6 grid gap-4">
            <div>
              <Label>Vendor Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Vendor name"
              />
            </div>
            <div>
              <Label>Contact Person</Label>
              <Input
                value={form.contact_person}
                onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                placeholder="Contact person"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Telephone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Telephone"
                />
              </div>
              <div>
                <Label>WhatsApp number</Label>
                <Input
                  value={form.whatsapp_phone}
                  onChange={(e) => setForm({ ...form, whatsapp_phone: e.target.value })}
                  placeholder="WhatsApp number"
                />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Email"
              />
            </div>
            <div>
              <Label>Vendor Cost</Label>
              <Input
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label>Category of Works</Label>
              <Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Services Offered</Label>
              <Textarea
                value={form.services_offered}
                onChange={(e) => setForm({ ...form, services_offered: e.target.value })}
                rows={3}
                placeholder="Services offered"
              />
            </div>
            <div>
              <Label>Payment History</Label>
              <Textarea
                value={form.payment_history}
                onChange={(e) => setForm({ ...form, payment_history: e.target.value })}
                rows={3}
                placeholder="Payment history"
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={saveVendor} disabled={saving}>
                <Save className="h-4 w-4 mr-1" />
                {editingVendorId ? "Update vendor" : "Create vendor"}
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h2 className="text-lg font-semibold tracking-tight">Vendor list</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Tap a vendor row to load it into the form.
          </p>
          <div className="mt-5 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Services</TableHead>
                  <TableHead>Payment history</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell>{vendor.name}</TableCell>
                    <TableCell>{vendor.cost != null ? vendor.cost.toFixed(2) : "—"}</TableCell>
                    <TableCell>{vendor.contact_person ?? "—"}</TableCell>
                    <TableCell>{vendor.phone}</TableCell>
                    <TableCell>
                      {vendor.whatsapp_phone ? (
                        <a
                          href={`https://wa.me/${normalizePhone(vendor.whatsapp_phone)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-800"
                        >
                          <MessageCircle className="h-4 w-4" />
                          WhatsApp
                        </a>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>{vendor.email ?? "—"}</TableCell>
                    <TableCell>{vendor.category}</TableCell>
                    <TableCell>{vendor.services_offered ?? "—"}</TableCell>
                    <TableCell>{vendor.payment_history ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => editVendor(vendor)}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>
    </div>
  );

function RouteComponent() {
  return <div>Hello "/_authenticated/admin/vendors"!</div>
}}
