import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState, useCallback } from "react";
import { addDays, addWeeks, format, startOfWeek, subWeeks } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ArrowLeft, ArrowRight, Check, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute('/_authenticated/mini-admin/Todo/todo')({
  component: RouteComponent,
})


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



function RouteComponent() {
  const [todos, setTodos] = useState<StaffTodo[]>([]);
const [engineerName, setEngineerName] = useState("Mini Admin");
const [engineerId, setEngineerId] = useState<string | null>(null);

const [weekStart, setWeekStart] = useState<Date>(
  startOfWeek(new Date(), { weekStartsOn: 1 })
);

const [staffRowAdded, setStaffRowAdded] = useState(false);

const [editState, setEditState] = useState<TodoEditState | null>(null);

const [form, setForm] = useState({
  ...emptyTodoForm,
});

const [savingTodo, setSavingTodo] = useState(false);

const visibleDates = Array.from(
  { length: 7 },
  (_, i) => addDays(weekStart, i)
);

const todoMap = new Map(
  todos.map((todo) => [
    `${todo.staff_user_id}|${todo.todo_date}`,
    todo,
  ])
);

const doneCount = todos.filter((t) => t.is_done).length;
const notDoneCount = todos.filter((t) => !t.is_done).length;

const load = useCallback(async () => {
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) return;

  setEngineerId(userData.user.id);

 const [
  { data: profile },
  { data: todoRows, error: todoError },
] = await Promise.all([
  supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userData.user.id)
    .maybeSingle(),

  supabase
    .from("staff_todos")
    .select("*")
    .eq("staff_user_id", userData.user.id)
    .gte("todo_date", format(weekStart, "yyyy-MM-dd"))
    .lte("todo_date", format(addDays(weekStart, 6), "yyyy-MM-dd"))
    .order("todo_date"),
]);

if (todoError) {
  toast.error(todoError.message);
}

  setEngineerName(profile?.full_name ?? "Mini Admin");
  setTodos((todoRows ?? []) as StaffTodo[]);
  setStaffRowAdded((todoRows ?? []).length > 0);
}, [weekStart]);

useEffect(() => {
  load();
}, [load]);

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
    toast.error("Enter an activity.");
    return;
  }

  setSavingTodo(true);

  try {
    if (editState.todo) {
      await supabase
        .from("staff_todos")
        .update({
          activity: form.activity,
          location: form.location || null,
          is_done: form.is_done,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editState.todo.id);
    } else {
      await supabase.from("staff_todos").insert({
        staff_user_id: engineerId,
        todo_date: format(editState.date, "yyyy-MM-dd"),
        activity: form.activity,
        location: form.location || null,
        is_done: form.is_done,
        created_by: engineerId,
      });
    }

    toast.success("Task saved.");

    setStaffRowAdded(true);
    resetTodoEditor();
    load();
  } finally {
    setSavingTodo(false);
  }
}
  return <div>
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
}
