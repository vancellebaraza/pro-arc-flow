import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { d as useNavigate } from "../_libs/tanstack__react-router.mjs";
import { u as useMyRoles } from "./auth-wNEK1Bir.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "./client-L2Z55D81.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
function DashboardRedirect() {
  const {
    primaryRole,
    loading
  } = useMyRoles();
  const navigate = useNavigate();
  reactExports.useEffect(() => {
    if (loading) return;
    if (primaryRole === "admin") navigate({
      to: "/admin",
      replace: true
    });
    else if (primaryRole === "engineer") navigate({
      to: "/engineer",
      replace: true
    });
    else navigate({
      to: "/client",
      replace: true
    });
  }, [primaryRole, loading, navigate]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-8 text-sm text-muted-foreground", children: "Redirecting…" });
}
export {
  DashboardRedirect as component
};
