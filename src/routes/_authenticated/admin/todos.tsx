import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { addDays, format, startOfWeek, subWeeks, addWeeks } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Calendar, Plus, Check } from "lucide-react";

interface StaffTodo {
  id: string;
  staff_user_id: string;
  todo_date: string;
  activity: string;
  location: string | null;
  is_done: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface StaffMember {
  id: string;
  full_name: string | null;
}

interface TodoEditState {
  staff: StaffMember;
  date: Date;
  todo?: StaffTodo;
}

const emptyTodoForm = {
  activity: "",
  location: "",
  is_done: false,
};

export const Route = createFileRoute("/_authenticated/admin/todos")({
  component: StaffTodosPage,
  beforeLoad: async () => {
    const { data: userData, error } = await supabase.auth.getUser();
    if (error || !userData.user) throw redirect({ to: "/auth" });

    const { data: rolesData, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id);

    if (rolesError) throw redirect({ to: "/dashboard" });
    const isAdmin = (rolesData ?? []).some((role) => role.role === "admin");
    if (!isAdmin) throw redirect({ to: "/dashboard" });

    return { user: userData.user };
  },
});

function StaffTodosPage() {
  const [todos, setTodos] = useState<StaffTodo[]>([]);
  const [engineers, setEngineers] = useState<StaffMember[]>([]);
  const [addedStaffIds, setAddedStaffIds] = useState<string[]>([]);
  const [weekStart, setWeekStart] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [selectedEngineerId, setSelectedEngineerId] = useState<string>("");
  const [editState, setEditState] = useState<TodoEditState | null>(null);
  const [form, setForm] = useState(() => ({ ...emptyTodoForm }));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const visibleDates = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart],
  );

  const dateKey = (staffId: string, date: Date) => `${staffId}|${format(date, "yyyy-MM-dd")}`;

  const todoMap = useMemo(() => {
    const map = new Map<string, StaffTodo>();
    todos.forEach((todo) => {
      map.set(`${todo.staff_user_id}|${todo.todo_date}`, todo);
    });
    return map;
  }, [todos]);

  const dailyTodos = useMemo(() => {
    const day = format(selectedDate, "yyyy-MM-dd");

    return todos.filter(todo => todo.todo_date === day);
  }   , [todos, selectedDate]);

  const staffMap = useMemo(
    () => engineers.reduce<Record<string, StaffMember>>((acc, staff) => {
      acc[staff.id] = staff;
      return acc;
    }, {}),
    [engineers],
  );

  const visibleStaffIds = useMemo(() => {
    const ids = new Set(todos.map((todo) => todo.staff_user_id));
    addedStaffIds.forEach((id) => ids.add(id));
    return Array.from(ids);
  }, [todos, addedStaffIds]);

  const visibleStaffRows = useMemo(
    () => visibleStaffIds.map((id) => staffMap[id] ?? { id, full_name: "Unknown staff" }),
    [visibleStaffIds, staffMap],
  );

  const availableEngineers = useMemo(
    () => engineers.filter((engineer) => !visibleStaffIds.includes(engineer.id)),
    [engineers, visibleStaffIds],
  );

  const doneCount = todos.filter((todo) => todo.is_done).length;
  const notDoneCount = todos.filter((todo) => !todo.is_done).length;

  const loadTodos = useCallback(async () => {
    setLoading(true);
    try {
      const { data: engineerRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "engineer");

      if (rolesError) {
        toast.error(rolesError.message);
        return;
      }

      const engineerIds = (engineerRoles ?? []).map((row) => row.user_id);
      const { data: engineerRows, error: profilesError } = engineerIds.length
        ? await supabase
            .from("profiles")
            .select("id,full_name")
            .in("id", engineerIds)
            .order("full_name", { ascending: true })
        : { data: [] as StaffMember[] };

      if (profilesError) {
        toast.error(profilesError.message);
        return;
      }

      setEngineers((engineerRows ?? []) as StaffMember[]);

      const startDate = format(weekStart, "yyyy-MM-dd");
      const endDate = format(addDays(weekStart, 6), "yyyy-MM-dd");

      const { data: todoRows, error: todoError } = await supabase
        .from<StaffTodo>("staff_todos")
        .select("*")
        .gte("todo_date", startDate)
        .lte("todo_date", endDate)
        .order("todo_date", { ascending: true });

      if (todoError) {
        toast.error(todoError.message);
        return;
      }
      const staffIds = [...new Set((todoRows ?? []).map(todo => todo.staff_user_id))];

const { data: profiles, error: profilesError2 } = await supabase
  .from("profiles")
  .select("id, full_name")
  .in("id", staffIds);

if (profilesError2) {
  toast.error(profilesError2.message);
  return;
}

setEngineers(profiles as StaffMember[]);

      setTodos((todoRows ?? []) as StaffTodo[]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load staff todos");
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  function openCellEditor(staff: StaffMember, date: Date, todo?: StaffTodo) {
    setEditState({ staff, date, todo });
    setForm({
      activity: todo?.activity ?? "",
      location: todo?.location ?? "",
      is_done: todo?.is_done ?? false,
    });
  }

  async function saveTodo() {
    if (!editState) return;
    if (!form.activity.trim()) {
      toast.error("Please enter an activity before saving.");
      return;
    }

    setSaving(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        toast.error("Unable to verify current user.");
        return;
      }

      if (editState.todo) {
        const { error } = await supabase
          .from("staff_todos")
          .update({
            activity: form.activity,
            location: form.location || null,
            is_done: form.is_done,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editState.todo.id);

        if (error) throw error;
        toast.success("Task updated.");
      } else {
        const { error } = await supabase.from("staff_todos").insert([
          {
            staff_user_id: editState.staff.id,
            todo_date: format(editState.date, "yyyy-MM-dd"),
            activity: form.activity,
            location: form.location || null,
            is_done: form.is_done,
            created_by: userData.user.id,
          },
        ]);

        if (error) throw error;
        toast.success("Task created.");
      }

      setEditState(null);
      setForm({ ...emptyTodoForm });
      loadTodos();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save task");
    } finally {
      setSaving(false);
    }
  }

  function addStaffRow() {
    if (!selectedEngineerId) return;
    if (visibleStaffIds.includes(selectedEngineerId)) {
      toast.error("This staff member is already visible in the week.");
      return;
    }
    setAddedStaffIds((current) => [...current, selectedEngineerId]);
    setSelectedEngineerId("");
  }

  function resetEditor() {
    setEditState(null);
    setForm({ ...emptyTodoForm });
  }

  if (loading) {
    return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="p-4 md:p-8 fade-in max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Staff To Do List</h1>
          <p className="text-muted-foreground mt-1">
            Track field staff activities by date. Only admins can view and manage these entries.
          </p>
        </div>
        <Link to="/admin" className="text-sm text-primary underline hover:text-primary/80">
          Back to admin dashboard
        </Link>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Week view</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Use the controls to move between weeks and edit tasks for each staff member.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setWeekStart((current) => subWeeks(current, 1))}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Previous week
              </Button>
              <Button size="sm" variant="outline" onClick={() => setWeekStart((current) => addWeeks(current, 1))}>
                Next week <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted-foreground">
            <div>Week starting: {format(weekStart, "MMM d, yyyy")}</div>
            <div>Visible staff: {visibleStaffRows.length}</div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-200 bg-emerald-500/10 p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Done</div>
            <div className="mt-1 text-3xl font-semibold text-emerald-900">{doneCount}</div>
          </div>
          <div className="rounded-xl border border-rose-200 bg-rose-500/10 p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Not done</div>
            <div className="mt-1 text-3xl font-semibold text-rose-900">{notDoneCount}</div>
          </div>
        </div>
      </div>

      {/* <section className="mt-6 rounded-xl border bg-card p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Add staff row</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Select an engineer to include in the grid for this week.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1.8fr_1fr]">
            <div>
              <Label>Engineer</Label>
              <Select value={selectedEngineerId} onValueChange={setSelectedEngineerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose engineer" />
                </SelectTrigger>
                <SelectContent>
                  {availableEngineers.map((engineer) => (
                    <SelectItem key={engineer.id} value={engineer.id}>
                      {engineer.full_name ?? engineer.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={addStaffRow} disabled={!selectedEngineerId} className="w-full">
                <Plus className="h-4 w-4 mr-2" /> Add row
              </Button>
            </div>
          </div>
        </div>
      </section> */}

      <section className="mt-6 overflow-x-auto rounded-xl border bg-card">
        <table className="min-w-full border-separate border-spacing-0">
          <thead>
            <tr className="bg-background">
              <th className="sticky left-0 z-10 border-b border-border bg-background px-4 py-3 text-left text-sm font-semibold">
                Staff
              </th>
              {visibleDates.map((date) => (
                <th key={format(date, "yyyy-MM-dd")} className="border-b border-border px-4 py-3 text-left text-sm font-semibold">
                  {format(date, "EEE d MMM")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleStaffRows.length > 0 ? (
              visibleStaffRows.map((staff) => (
                <tr key={staff.id} className="odd:bg-surface even:bg-card">
                  <td className="sticky left-0 z-10 border-r border-border bg-background px-4 py-3 font-medium">
                    {staff.full_name ?? "Unnamed staff"}
                  </td>
                  {visibleDates.map((date) => {
                    const todo = todoMap.get(dateKey(staff.id, date));
                    const statusClasses = todo
                    ? todo.is_done
                    ? "border-emerald-700 bg-emerald-600 text-white"
                    : "border-rose-700 bg-rose-600 text-white"
                    : "border-border bg-muted/40 text-muted-foreground";
                    return (
                      <td key={format(date, "yyyy-MM-dd")} className="border-b border-border px-3 py-3 align-top">
                        <button
                          type="button"
                          onClick={() => openCellEditor(staff, date, todo)}
                          className={`w-full rounded-xl border p-3 text-left transition hover:shadow-sm ${statusClasses}`}
                        >
                          {todo ? (
    <div className="flex h-full items-center justify-center">
      {/* Intentionally left blank.
          The background color indicates the task status.
          Click the cell to view/edit the details. */}
    </div>
  ) : (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      No entry
    </div>
  )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={visibleDates.length + 1} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No staff rows are visible yet. Add an engineer row to begin tracking this week.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    <section className="mt-6 rounded-xl border bg-card p-5">
  <div className="flex items-center gap-3 mb-4">
    <Calendar className="h-5 w-5" />
    <h2 className="text-lg font-semibold">
      Daily Calendar
    </h2>
  </div>

  <Input
    type="date"
    value={format(selectedDate, "yyyy-MM-dd")}
    onChange={(e) => setSelectedDate(new Date(e.target.value))}
    className="max-w-xs"
  />

  <div className="mt-6 space-y-3">
    {dailyTodos.length === 0 ? (
      <div className="text-muted-foreground">
        No tasks scheduled for this day.
      </div>
    ) : (
      dailyTodos.map(todo => {
        const staff = staffMap[todo.staff_user_id];
          console.log("Todo staff id:", todo.staff_user_id);
  console.log("Engineers:", engineers);
  console.log("Staff map:", staffMap);
  console.log("Matched staff:", staff);

        return (
          <button
            key={todo.id}
            onClick={() =>
              openCellEditor(
                staff ?? {
                  id: todo.staff_user_id,
                  full_name: "Unknown staff",
                },
                new Date(todo.todo_date),
                todo,
              )
            }
            className={`w-full rounded-xl border p-4 text-left ${
              todo.is_done
                ? "border-emerald-700 bg-emerald-100"
                : "border-rose-700 bg-rose-100"
            }`}
          >
            <div className="font-semibold">
              {staff?.full_name ?? "Unknown staff"}
            </div>

            <div className="mt-2">
              {todo.activity}
            </div>

            <div className="text-sm text-muted-foreground">
              {todo.location ?? "No location"}
            </div>
          </button>
          );
        })
      )}
     </div>
     </section>
      <Dialog open={Boolean(editState)} onOpenChange={(open) => {
        if (!open) resetEditor();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editState?.todo ? "Edit task" : "Add task"} — {editState?.staff.full_name ?? "Staff"}
            </DialogTitle>
            <DialogDescription>
              {editState
                ? `Date: ${format(editState.date, "EEEE, MMM d")}`
                : "Choose the activity and location for this staff member."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div>
              <Label>Activity</Label>
              <Textarea
                value={form.activity}
                onChange={(event) => setForm({ ...form, activity: event.target.value })}
                rows={4}
                placeholder="Describe the activity"
              />
            </div>
            <div>
              <Label>Location</Label>
              <Input
                value={form.location}
                onChange={(event) => setForm({ ...form, location: event.target.value })}
                placeholder="Location or site"
              />
            </div>
            <div className="flex items-center gap-3">
              <Label className="mb-0">Status</Label>
              <Button
                variant={form.is_done ? "secondary" : "outline"}
                size="sm"
                onClick={() => setForm((current) => ({ ...current, is_done: !current.is_done }))}
              >
                {form.is_done ? <Check className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                {form.is_done ? "Done" : "Not done"}
              </Button>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => resetEditor()}>
              Cancel
            </Button>
            <Button type="button" onClick={saveTodo} disabled={saving}>
              Save task
            </Button>
          </DialogFooter>
          <DialogClose className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
            Close
          </DialogClose>
        </DialogContent>
      </Dialog>
    </div>
  );
}
