
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { addDays, addWeeks, format, startOfWeek, subWeeks } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { SERVICES, STATUS_LABEL } from "@/lib/services";
import { ArrowLeft, ArrowRight, Check, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/mini-admin/Engineer/")({
  component: EngineerHome,
});

interface Project {
  id: string;
  title: string;
  service: string;
  status: string;
  location: string | null;
  engineer_id: string | null;
  created_at: string;
  scheduled_date: string | null;
}

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

interface TodoEditState {
  date: Date;
  todo?: StaffTodo;
}

const emptyTodoForm = {
  activity: "",
  location: "",
  is_done: false,
};

function EngineerHome() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [todos, setTodos] = useState<StaffTodo[]>([]);
  const [engineerName, setEngineerName] = useState<string>("Engineer");
  const [engineerId, setEngineerId] = useState<string | null>(null);
  const [weekStart, setWeekStart] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [staffRowAdded, setStaffRowAdded] = useState(false);
  const [editState, setEditState] = useState<TodoEditState | null>(null);
  const [form, setForm] = useState(() => ({ ...emptyTodoForm }));
  const [loading, setLoading] = useState(true);
  const [savingTodo, setSavingTodo] = useState(false);
  const [q, setQ] = useState("");

  const visibleDates = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        toast.error("Unable to verify current engineer.");
        return;
      }

      setEngineerId(userData.user.id);

      const [{ data: projectRows }, { data: profileRows }, { data: todoRows, error: todoError }] =
        await Promise.all([
          supabase
            .from("projects")
            .select("id,title,service,status,location,engineer_id,created_at,scheduled_date")
            .order("created_at", { ascending: false }),
          supabase.from("profiles").select("full_name").eq("id", userData.user.id).maybeSingle(),
          (supabase as any)
            .from("staff_todos")
            .select("*")
            .eq("staff_user_id", userData.user.id)
            .gte("todo_date", format(weekStart, "yyyy-MM-dd"))
            .lte("todo_date", format(addDays(weekStart, 6), "yyyy-MM-dd"))
            .order("todo_date", { ascending: true }),
        ]);

      if (todoError) {
        toast.error(todoError.message);
      }

      setProjects((projectRows ?? []) as Project[]);
      setEngineerName(profileRows?.full_name ?? "Engineer");
      setTodos((todoRows ?? []) as StaffTodo[]);
      setStaffRowAdded((todoRows ?? []).length > 0);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load engineer dashboard");
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = projects.filter(
    (p) =>
      !q ||
      p.title.toLowerCase().includes(q.toLowerCase()) ||
      (p.location ?? "").toLowerCase().includes(q.toLowerCase()),
  );

  const todoMap = new Map(todos.map((todo) => [`${todo.staff_user_id}|${todo.todo_date}`, todo]));
  const doneCount = todos.filter((todo) => todo.is_done).length;
  const notDoneCount = todos.filter((todo) => !todo.is_done).length;

  function openTodoEditor(date: Date, todo?: StaffTodo) {
    setEditState({ date, todo });
    setForm({
      activity: todo?.activity ?? "",
      location: todo?.location ?? "",
      is_done: todo?.is_done ?? false,
    });
  }

  function resetTodoEditor() {
    setEditState(null);
    setForm({ ...emptyTodoForm });
  }

  async function saveTodo() {
    if (!editState || !engineerId) return;
    if (!form.activity.trim()) {
      toast.error("Please enter an activity before saving.");
      return;
    }

    setSavingTodo(true);
    try {
      if (editState.todo) {
        const { error } = await (supabase as any)
          .from("staff_todos")
          .update({
            activity: form.activity,
            location: form.location || null,
            is_done: form.is_done,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editState.todo.id)
          .eq("staff_user_id", engineerId);

        if (error) throw error;
        toast.success("Task updated.");
      } else {
        const { error } = await (supabase as any).from("staff_todos").insert([
          {
            staff_user_id: engineerId,
            todo_date: format(editState.date, "yyyy-MM-dd"),
            activity: form.activity,
            location: form.location || null,
            is_done: form.is_done,
            created_by: engineerId,
          },
        ]);

        if (error) throw error;
        toast.success("Task created.");
      }

      setStaffRowAdded(true);
      resetTodoEditor();
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save task");
    } finally {
      setSavingTodo(false);
    }
  }

  return (
    <div className="p-4 md:p-8 fade-in">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Engineer dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Pick a project to open inspection, quotation, worksheet and more.
          </p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search projects…"
            className="pl-8"
          />
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground mb-8">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground mb-8">
          No projects found.
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          {filtered.map((p) => {
            const svc = SERVICES.find((s) => s.key === p.service);
            return (
              <li key={p.id}>
                <Link
                  to="/mini-admin/Engineer/projectId"
                  params={{ projectId: p.id }}
                  className="block h-full rounded-xl border bg-card p-5 hover:border-foreground/40 hover:shadow-sm transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">
                      {svc?.label ?? p.service}
                    </span>
                    <span className="text-xs rounded-full bg-foreground/5 px-2 py-0.5">
                      {STATUS_LABEL[p.status] ?? p.status}
                    </span>
                  </div>
                  <h3 className="mt-2 font-medium truncate">{p.title}</h3>
                  <p className="text-xs text-muted-foreground truncate">{p.location ?? "—"}</p>
                  <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {p.scheduled_date ? `Scheduled ${p.scheduled_date}` : "Unscheduled"}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <section className="mb-8 rounded-xl border bg-card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">My Staff To Do Row</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Add your weekly activity row here. Admin will see these entries in Staff To Do.
            </p>
            <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span>Week starting: {format(weekStart, "MMM d, yyyy")}</span>
<div className="flex gap-2">
  <span className="bg-green-500 text-white px-3 py-1 rounded-md">
    Done: {doneCount}
  </span>

  <span className="bg-red-500 text-white px-3 py-1 rounded-md">
    Not done: {notDoneCount}
  </span>
</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setWeekStart((current) => subWeeks(current, 1))}
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Previous week
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setWeekStart((current) => addWeeks(current, 1))}
            >
              Next week <ArrowRight className="h-4 w-4 ml-1" />
            </Button>

          </div>
        </div>

        {staffRowAdded ? (
          <div className="mt-5 overflow-x-auto rounded-xl border">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr className="bg-background">
                  <th className="sticky left-0 z-10 border-b border-border bg-background px-4 py-3 text-left text-sm font-semibold">
                    Staff
                  </th>
                  {visibleDates.map((date) => (
                    <th
                      key={format(date, "yyyy-MM-dd")}
                      className="border-b border-border px-4 py-3 text-left text-sm font-semibold"
                    >
                      {format(date, "EEE d MMM")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="odd:bg-surface even:bg-card">
                  <td className="sticky left-0 z-10 border-r border-border bg-background px-4 py-3 font-medium">
                    {engineerName}
                  </td>
                  {visibleDates.map((date) => {
                    const todo = engineerId
                      ? todoMap.get(`${engineerId}|${format(date, "yyyy-MM-dd")}`)
                      : undefined;
                    const statusClasses = todo
                      ? todo.is_done
                        ? "border-emerald-200 bg-emerald-500/10 text-emerald-900"
                        : "border-rose-200 bg-rose-500/10 text-rose-900"
                      : "border-border bg-muted/40 text-muted-foreground";

                    return (
                      <td
                        key={format(date, "yyyy-MM-dd")}
                        className="border-b border-border px-3 py-3 align-top"
                      >
                        <button
                          type="button"
                          onClick={() => openTodoEditor(date, todo)}
                          className={`w-full rounded-xl border p-3 text-left transition hover:shadow-sm ${statusClasses}`}
                        >
                          {todo ? (
                            <>
                              <div className="text-sm font-semibold">{todo.activity}</div>
                              <div className="mt-1 text-xs text-muted-foreground">
                                {todo.location ?? "No location"}
                              </div>
                              <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/80 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-700">
                                <span
                                  className={todo.is_done ? "text-emerald-700" : "text-rose-700"}
                                >
                                  {todo.is_done ? "Done" : "Not done"}
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="text-sm text-muted-foreground">No entry</div>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            Add your staff row to start creating activity entries for this week.
          </div>
        )}
      </section>

      <Dialog
        open={Boolean(editState)}
        onOpenChange={(open) => {
          if (!open) resetTodoEditor();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editState?.todo ? "Edit task" : "Add task"}</DialogTitle>
            <DialogDescription>
              {editState
                ? `Date: ${format(editState.date, "EEEE, MMM d")}`
                : "Choose the activity and location for this task."}
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
                {form.is_done ? (
                  <Check className="mr-2 h-4 w-4" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                {form.is_done ? "Done" : "Not done"}
              </Button>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => resetTodoEditor()}>
              Cancel
            </Button>
            <Button type="button" onClick={saveTodo} disabled={savingTodo}>
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
