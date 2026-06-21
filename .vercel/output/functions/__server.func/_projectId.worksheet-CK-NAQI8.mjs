import { r as reactExports, j as jsxRuntimeExports } from "./_libs/react.mjs";
import { L as Link } from "./_libs/tanstack__react-router.mjs";
import { s as supabase } from "./_ssr/client-L2Z55D81.mjs";
import { B as Button } from "./_ssr/button-BC9oXVxV.mjs";
import { I as Input } from "./_ssr/input-C0QjszdI.mjs";
import { L as Label } from "./_ssr/label-JU3yqRBo.mjs";
import { T as Textarea } from "./_ssr/textarea-DSyJ1nlY.mjs";
import { a as generateWorksheetPdf } from "./_ssr/pdf-C4AXfmaR.mjs";
import { t as toast } from "./_libs/sonner.mjs";
import { b as Route$4 } from "./_ssr/router-DdPd7JgK.mjs";
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
import "./_ssr/services-BNXDMItn.mjs";
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
function WorksheetPage() {
  const {
    projectId
  } = Route$4.useParams();
  const [worksheetId, setWorksheetId] = reactExports.useState(null);
  const [clientName, setClientName] = reactExports.useState("");
  const [jobNo, setJobNo] = reactExports.useState("");
  const [jobLocation, setJobLocation] = reactExports.useState("");
  const [jobDate, setJobDate] = reactExports.useState((/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
  const [jobType, setJobType] = reactExports.useState("");
  const [technician, setTechnician] = reactExports.useState("");
  const [personInCharge, setPersonInCharge] = reactExports.useState("");
  const [jobDescription, setJobDescription] = reactExports.useState("");
  const [observations, setObservations] = reactExports.useState([{
    observation: "",
    action: ""
  }]);
  const [imagesBefore, setImagesBefore] = reactExports.useState([]);
  const [sigTech, setSigTech] = reactExports.useState("");
  const [sigSup, setSigSup] = reactExports.useState("");
  const [sigClient, setSigClient] = reactExports.useState("");
  const [saving, setSaving] = reactExports.useState(false);
  const load = reactExports.useCallback(async () => {
    const {
      data: p
    } = await supabase.from("projects").select("title,location,service").eq("id", projectId).maybeSingle();
    if (p) {
      setJobLocation(p.location ?? "");
      setJobType(p.service);
      if (!jobNo) setJobNo(`JOB-${projectId.slice(0, 6).toUpperCase()}`);
    }
    const {
      data: ws
    } = await supabase.from("worksheets").select("*").eq("project_id", projectId).order("created_at", {
      ascending: false
    }).maybeSingle();
    if (ws) {
      setWorksheetId(ws.id);
      setClientName(ws.client_name ?? "");
      setJobNo(ws.job_no ?? "");
      setJobLocation(ws.job_location ?? "");
      setJobDate(ws.job_date ?? (/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
      setJobType(ws.job_type ?? "");
      setTechnician(ws.technician ?? "");
      setPersonInCharge(ws.person_in_charge ?? "");
      setJobDescription(ws.job_description ?? "");
      setObservations(ws.observations ?? [{
        observation: "",
        action: ""
      }]);
      setImagesBefore(ws.images_before ?? []);
      const s = ws.signatures ?? {};
      setSigTech(s.technician_name ?? "");
      setSigSup(s.supervisor_name ?? "");
      setSigClient(s.client_name ?? "");
    }
  }, [projectId]);
  reactExports.useEffect(() => {
    load();
  }, [load]);
  async function uploadImages(files) {
    if (!files) return;
    const {
      data: u
    } = await supabase.auth.getUser();
    if (!u.user) return;
    for (const file of Array.from(files)) {
      const path = `${u.user.id}/ws/${projectId}/${Date.now()}-${file.name}`;
      const {
        error
      } = await supabase.storage.from("project-images").upload(path, file);
      if (error) {
        toast.error(error.message);
        continue;
      }
      const {
        data: signed
      } = await supabase.storage.from("project-images").createSignedUrl(path, 60 * 60 * 24 * 365);
      if (signed?.signedUrl) setImagesBefore((a) => [...a, signed.signedUrl]);
    }
  }
  async function save() {
    setSaving(true);
    try {
      const {
        data: u
      } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const payload = {
        project_id: projectId,
        engineer_id: u.user.id,
        client_name: clientName,
        job_no: jobNo,
        job_location: jobLocation,
        job_date: jobDate,
        job_type: jobType,
        technician,
        person_in_charge: personInCharge,
        job_description: jobDescription,
        observations,
        images_before: imagesBefore,
        signatures: {
          technician_name: sigTech,
          supervisor_name: sigSup,
          client_name: sigClient
        }
      };
      if (worksheetId) {
        const {
          error
        } = await supabase.from("worksheets").update(payload).eq("id", worksheetId);
        if (error) throw error;
      } else {
        const {
          data,
          error
        } = await supabase.from("worksheets").insert(payload).select("id").single();
        if (error) throw error;
        setWorksheetId(data.id);
      }
      toast.success("Worksheet saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }
  function exportPdf() {
    generateWorksheetPdf({
      clientName,
      jobNo,
      jobLocation,
      jobDate,
      jobType,
      technician,
      personInCharge,
      jobDescription,
      observations,
      imagesBefore,
      signatures: {
        technician_name: sigTech,
        supervisor_name: sigSup,
        client_name: sigClient
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
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "mt-3 text-2xl md:text-3xl font-semibold tracking-tight", children: "Fusionpro Limited Worksheet" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mt-1", children: "Document 2 — site assessment & sign-off." }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mt-6 grid md:grid-cols-2 gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Client Name" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: clientName, onChange: (e) => setClientName(e.target.value) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Job No." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: jobNo, onChange: (e) => setJobNo(e.target.value) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Job Location" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: jobLocation, onChange: (e) => setJobLocation(e.target.value) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Job Date" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "date", value: jobDate, onChange: (e) => setJobDate(e.target.value) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Job Type" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: jobType, onChange: (e) => setJobType(e.target.value) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Technician" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: technician, onChange: (e) => setTechnician(e.target.value) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Person in Charge" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: personInCharge, onChange: (e) => setPersonInCharge(e.target.value) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mt-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Job Description" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { rows: 4, value: jobDescription, onChange: (e) => setJobDescription(e.target.value) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mt-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold tracking-tight", children: "Site Visit & Scope Assessment" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: () => setObservations((a) => [...a, {
          observation: "",
          action: ""
        }]), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4 mr-1" }),
          "Add row"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 overflow-x-auto rounded-lg border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-surface text-left", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 w-1/2", children: "Technician's Observation" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2", children: "Action to Be Taken" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "w-10" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: observations.map((o, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { rows: 2, value: o.observation, onChange: (e) => setObservations((a) => a.map((x, j) => j === i ? {
            ...x,
            observation: e.target.value
          } : x)) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { rows: 2, value: o.action, onChange: (e) => setObservations((a) => a.map((x, j) => j === i ? {
            ...x,
            action: e.target.value
          } : x)) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-1 align-top", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "ghost", size: "icon", onClick: () => setObservations((a) => a.filter((_, j) => j !== i)), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" }) }) })
        ] }, i)) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mt-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold tracking-tight", children: "Images Before" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "mt-3 flex items-center justify-center rounded-md border border-dashed bg-surface px-4 py-6 text-sm text-muted-foreground cursor-pointer hover:bg-accent transition", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CloudUpload, { className: "h-4 w-4 mr-2" }),
        " Click to upload before-images",
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "file", accept: "image/*", multiple: true, className: "hidden", onChange: (e) => uploadImages(e.target.files) })
      ] }),
      imagesBefore.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 grid grid-cols-2 md:grid-cols-4 gap-2", children: imagesBefore.map((u, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: u, alt: `Before ${i + 1}`, className: "rounded border h-28 w-full object-cover" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setImagesBefore((a) => a.filter((_, j) => j !== i)), className: "absolute top-1 right-1 rounded-full bg-black/60 text-white p-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3 w-3" }) })
      ] }, i)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mt-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold tracking-tight", children: "Signatures" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 grid md:grid-cols-3 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border p-4 bg-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Technician Signature (Name)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: sigTech, onChange: (e) => setSigTech(e.target.value) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border p-4 bg-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Supervisor Signature (Name)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: sigSup, onChange: (e) => setSigSup(e.target.value) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border p-4 bg-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Client Approval (Name)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: sigClient, onChange: (e) => setSigClient(e.target.value) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 flex flex-wrap justify-end gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: exportPdf, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(FileDown, { className: "h-4 w-4 mr-1" }),
        "Export PDF"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: save, disabled: saving, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "h-4 w-4 mr-1" }),
        "Save worksheet"
      ] })
    ] })
  ] });
}
export {
  WorksheetPage as component
};
