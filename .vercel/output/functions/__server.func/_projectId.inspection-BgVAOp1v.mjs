import { r as reactExports, j as jsxRuntimeExports } from "./_libs/react.mjs";
import { L as Link } from "./_libs/tanstack__react-router.mjs";
import { s as supabase } from "./_ssr/client-L2Z55D81.mjs";
import { B as Button } from "./_ssr/button-BC9oXVxV.mjs";
import { I as Input } from "./_ssr/input-C0QjszdI.mjs";
import { L as Label } from "./_ssr/label-JU3yqRBo.mjs";
import { T as Textarea } from "./_ssr/textarea-DSyJ1nlY.mjs";
import { S as SERVICES } from "./_ssr/services-BNXDMItn.mjs";
import { b as generateInspectionPdf } from "./_ssr/pdf-C4AXfmaR.mjs";
import { t as toast } from "./_libs/sonner.mjs";
import { e as Route$1 } from "./_ssr/router-DdPd7JgK.mjs";
import "./_libs/jspdf.mjs";
import "./_libs/jspdf-autotable.mjs";
import { i as ArrowLeft, P as Plus, T as Trash2, m as CloudUpload, F as FileDown, n as Save } from "./_libs/lucide-react.mjs";
import "./_libs/tanstack__router-core.mjs";
import "./_libs/tanstack__history.mjs";
import "./_libs/cookie-es.mjs";
import "./_libs/seroval.mjs";
import "./_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "./_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "./_libs/isbot.mjs";
import "./_libs/supabase__supabase-js.mjs";
import "./_libs/supabase__postgrest-js.mjs";
import "./_libs/supabase__realtime-js.mjs";
import "./_libs/supabase__phoenix.mjs";
import "./_libs/supabase__storage-js.mjs";
import "./_libs/iceberg-js.mjs";
import "./_libs/supabase__auth-js.mjs";
import "tslib";
import "./_libs/supabase__functions-js.mjs";
import "./_libs/radix-ui__react-slot.mjs";
import "./_libs/radix-ui__react-compose-refs.mjs";
import "./_libs/class-variance-authority.mjs";
import "./_libs/clsx.mjs";
import "./_ssr/utils-H80jjgLf.mjs";
import "./_libs/tailwind-merge.mjs";
import "./_libs/radix-ui__react-label.mjs";
import "./_libs/radix-ui__react-primitive.mjs";
import "./_libs/tanstack__query-core.mjs";
import "./_libs/tanstack__react-query.mjs";
import "fs";
import "path";
import "./_libs/fflate.mjs";
import "./_libs/fast-png.mjs";
import "./_libs/iobuffer.mjs";
import "./_libs/pako.mjs";
import "./_libs/html2canvas.mjs";
import "./_libs/dompurify.mjs";
import "./_libs/canvg.mjs";
import "./_libs/core-js.mjs";
import "./_libs/babel__runtime.mjs";
import "./_libs/raf.mjs";
import "./_libs/performance-now.mjs";
import "./_libs/rgbcolor.mjs";
import "./_libs/svg-pathdata.mjs";
import "./_libs/stackblur-canvas.mjs";
function InspectionPage() {
  const {
    projectId
  } = Route$1.useParams();
  const [projectTitle, setProjectTitle] = reactExports.useState("");
  const [projectLocation, setProjectLocation] = reactExports.useState("");
  const [projectService, setProjectService] = reactExports.useState("");
  const [workCategory, setWorkCategory] = reactExports.useState("electrical");
  const [clientName, setClientName] = reactExports.useState("");
  const [inspectionDate, setInspectionDate] = reactExports.useState((/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
  const [inspectorName, setInspectorName] = reactExports.useState("");
  const [technician, setTechnician] = reactExports.useState("");
  const [checklist, setChecklist] = reactExports.useState([{
    item: "Site safety verified",
    remark: "",
    pass: true
  }, {
    item: "Scope matches request",
    remark: "",
    pass: true
  }, {
    item: "Materials available",
    remark: "",
    pass: true
  }, {
    item: "Access confirmed",
    remark: "",
    pass: true
  }]);
  const [photos, setPhotos] = reactExports.useState([{
    before: "",
    during: "",
    after: ""
  }]);
  const [sigClient, setSigClient] = reactExports.useState("");
  const [sigInspector, setSigInspector] = reactExports.useState("");
  const [sigTechnician, setSigTechnician] = reactExports.useState("");
  const [remarks, setRemarks] = reactExports.useState("");
  const [stage, setStage] = reactExports.useState("initial");
  const [saving, setSaving] = reactExports.useState(false);
  const load = reactExports.useCallback(async () => {
    const {
      data: p
    } = await supabase.from("projects").select("title,location,service").eq("id", projectId).maybeSingle();
    if (p) {
      setProjectTitle(p.title);
      setProjectLocation(p.location ?? "");
      setProjectService(p.service);
      setWorkCategory(p.service);
    }
  }, [projectId]);
  reactExports.useEffect(() => {
    load();
  }, [load]);
  async function uploadImage(file) {
    const {
      data: u
    } = await supabase.auth.getUser();
    if (!u.user) throw new Error("Not signed in");
    const path = `${u.user.id}/insp/${projectId}/${Date.now()}-${file.name}`;
    const {
      error
    } = await supabase.storage.from("project-images").upload(path, file);
    if (error) throw error;
    const {
      data: signed
    } = await supabase.storage.from("project-images").createSignedUrl(path, 60 * 60 * 24 * 365);
    return signed?.signedUrl ?? "";
  }
  async function pickFile(field, idx) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const f = input.files?.[0];
      if (!f) return;
      try {
        const url = await uploadImage(f);
        setPhotos((arr) => arr.map((p, i) => i === idx ? {
          ...p,
          [field]: url
        } : p));
        toast.success("Image uploaded");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Upload failed");
      }
    };
    input.click();
  }
  async function save() {
    setSaving(true);
    try {
      const {
        data: u
      } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const checklistJson = checklist.map((c) => ({
        item: c.item,
        pass: c.pass,
        remark: c.remark
      }));
      const meta = {
        work_category: workCategory,
        client_name: clientName,
        inspection_date: inspectionDate,
        inspector_name: inspectorName,
        technician
      };
      const signatures = {
        client_name: sigClient,
        inspector_name: sigInspector,
        technician_name: sigTechnician
      };
      const {
        error
      } = await supabase.from("inspections").insert({
        project_id: projectId,
        engineer_id: u.user.id,
        stage,
        checklist: checklistJson,
        remarks,
        meta,
        photo_evidence: photos,
        signatures,
        image_urls: photos.flatMap((p) => [p.before, p.during, p.after].filter(Boolean))
      });
      if (error) throw error;
      await supabase.from("projects").update({
        status: "inspected"
      }).eq("id", projectId);
      toast.success("Inspection saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }
  function exportPdf() {
    generateInspectionPdf({
      workCategory: SERVICES.find((s) => s.key === workCategory)?.label ?? workCategory,
      projectName: projectTitle,
      clientName,
      siteLocation: projectLocation,
      inspectionDate,
      inspectorName,
      technician,
      checklist: checklist.map((c) => ({
        item: c.item,
        remark: c.remark,
        pass: c.pass
      })),
      photoEvidence: photos,
      signatures: {
        client_name: sigClient,
        inspector_name: sigInspector,
        technician_name: sigTechnician
      }
    });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 md:p-8 fade-in max-w-5xl mx-auto pb-24", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/engineer/$projectId", params: {
      projectId
    }, className: "inline-flex items-center text-sm text-muted-foreground hover:text-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-4 w-4 mr-1" }),
      "Back to project"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "mt-3 text-2xl md:text-3xl font-semibold tracking-tight", children: "Inspection Report" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mt-1", children: "Complete the checklist, photo evidence and sign-off." }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mt-8 grid md:grid-cols-2 gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Work Category" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("select", { value: workCategory, onChange: (e) => setWorkCategory(e.target.value), className: "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm", children: SERVICES.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: s.key, children: s.label }, s.key)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Project Name" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: projectTitle, readOnly: true })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Client Name" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: clientName, onChange: (e) => setClientName(e.target.value), placeholder: "Client full name" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Site Location" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: projectLocation, onChange: (e) => setProjectLocation(e.target.value) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Inspection Date" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "date", value: inspectionDate, onChange: (e) => setInspectionDate(e.target.value) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Inspector Name" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: inspectorName, onChange: (e) => setInspectorName(e.target.value) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Technician" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: technician, onChange: (e) => setTechnician(e.target.value) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Stage" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value: stage, onChange: (e) => setStage(e.target.value), className: "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "initial", children: "Initial" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "during", children: "During work" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "final", children: "Final" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mt-10", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold tracking-tight", children: "Inspection Checklist" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: () => setChecklist((a) => [...a, {
          item: "",
          remark: "",
          pass: true
        }]), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4 mr-1" }),
          "Add row"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 overflow-x-auto rounded-lg border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-surface text-left", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 w-1/3", children: "Work Item" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2", children: "Remarks" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 w-32 text-center", children: "Status" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "w-10" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: checklist.map((c, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t align-top", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: c.item, onChange: (e) => setChecklist((a) => a.map((x, j) => j === i ? {
            ...x,
            item: e.target.value
          } : x)) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: c.remark, onChange: (e) => setChecklist((a) => a.map((x, j) => j === i ? {
            ...x,
            remark: e.target.value
          } : x)) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-1 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setChecklist((a) => a.map((x, j) => j === i ? {
            ...x,
            pass: !x.pass
          } : x)), className: `rounded px-3 py-1 text-xs font-medium ${c.pass ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`, children: c.pass ? "PASS" : "FAIL" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "ghost", size: "icon", onClick: () => setChecklist((a) => a.filter((_, j) => j !== i)), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" }) }) })
        ] }, i)) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mt-10", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold tracking-tight", children: "Photo Evidence" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: () => setPhotos((a) => [...a, {
          before: "",
          during: "",
          after: ""
        }]), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4 mr-1" }),
          "Add row"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 space-y-2", children: photos.map((p, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-2 rounded-lg border p-2 bg-card", children: [
        ["before", "during", "after"].map((field) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs uppercase tracking-wider text-muted-foreground", children: field }),
          p[field] ? /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: p[field], target: "_blank", rel: "noreferrer", children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: p[field], alt: field, className: "rounded border h-24 w-full object-cover" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => pickFile(field, i), className: "w-full h-24 rounded border border-dashed grid place-items-center text-xs text-muted-foreground hover:bg-accent", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CloudUpload, { className: "h-3 w-3" }),
            "Upload"
          ] }) })
        ] }, field)),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "ghost", size: "icon", className: "self-center", onClick: () => setPhotos((a) => a.filter((_, j) => j !== i)), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" }) })
      ] }, i)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mt-10", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold tracking-tight", children: "Sign-off" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 grid md:grid-cols-3 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border p-4 bg-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Client Name" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: sigClient, onChange: (e) => setSigClient(e.target.value) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 text-xs text-muted-foreground", children: "Client signature collected on site." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border p-4 bg-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Inspector Name" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: sigInspector, onChange: (e) => setSigInspector(e.target.value) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 text-xs text-muted-foreground", children: "Inspector signature collected on site." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border p-4 bg-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Technician Name" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: sigTechnician, onChange: (e) => setSigTechnician(e.target.value) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 text-xs text-muted-foreground", children: "Technician signature collected on site." })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mt-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "General remarks" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { rows: 3, value: remarks, onChange: (e) => setRemarks(e.target.value) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 flex flex-wrap justify-end gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: exportPdf, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(FileDown, { className: "h-4 w-4 mr-1" }),
        "Export PDF"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: save, disabled: saving, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "h-4 w-4 mr-1" }),
        "Save inspection"
      ] })
    ] })
  ] });
}
export {
  InspectionPage as component
};
