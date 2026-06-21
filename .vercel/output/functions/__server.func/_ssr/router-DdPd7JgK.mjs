import { Q as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { Q as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
import { c as createRouter, a as createRootRouteWithContext, u as useRouter, L as Link, O as Outlet, H as HeadContent, S as Scripts, b as createFileRoute, l as lazyRouteComponent } from "../_libs/tanstack__react-router.mjs";
import { I as redirect } from "../_libs/tanstack__router-core.mjs";
import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { T as Toaster$1 } from "../_libs/sonner.mjs";
import { s as supabase } from "./client-L2Z55D81.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "node:stream";
import "../_libs/isbot.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
const appCss = "/assets/styles-DwyE8wZG.css";
const Toaster = ({ ...props }) => {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Toaster$1,
    {
      className: "toaster group",
      toastOptions: {
        classNames: {
          toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
        }
      },
      ...props
    }
  );
};
function NotFoundComponent() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-7xl font-bold", children: "404" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-4 text-xl font-semibold", children: "Page not found" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "This page doesn't exist." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      Link,
      {
        to: "/",
        className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90",
        children: "Go home"
      }
    ) })
  ] }) });
}
function ErrorComponent({ error, reset }) {
  console.error(error);
  const router2 = useRouter();
  reactExports.useEffect(() => {
    console.error(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-semibold tracking-tight", children: "Something went wrong" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Please try again." }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex flex-wrap justify-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => {
            router2.invalidate();
            reset();
          },
          className: "rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90",
          children: "Try again"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "a",
        {
          href: "/",
          className: "rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent",
          children: "Go home"
        }
      )
    ] })
  ] }) });
}
const Route$f = createRootRouteWithContext()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "FusionPro — RealArc Estates Operations" },
      {
        name: "description",
        content: "FusionPro: enterprise property service operations for RealArc Estates — requests, inspections, quotations, scheduling, reporting."
      },
      { property: "og:title", content: "FusionPro — RealArc Estates Operations" },
      {
        property: "og:description",
        content: "FusionPro: enterprise property service operations for RealArc Estates — requests, inspections, quotations, scheduling, reporting."
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "FusionPro — RealArc Estates Operations" },
      {
        name: "twitter:description",
        content: "FusionPro: enterprise property service operations for RealArc Estates — requests, inspections, quotations, scheduling, reporting."
      },
      {
        property: "og:image",
        content: "https://storage.googleapis.com/gpt-engineer-file-uploads/H0AuwLi0ReeN0sI0S5IeRJInPap1/social-images/social-1781753746095-Screenshot_2026-06-14_025530.webp"
      },
      {
        name: "twitter:image",
        content: "https://storage.googleapis.com/gpt-engineer-file-uploads/H0AuwLi0ReeN0sI0S5IeRJInPap1/social-images/social-1781753746095-Screenshot_2026-06-14_025530.webp"
      }
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
      }
    ]
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent
});
function RootShell({ children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("html", { lang: "en", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("head", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("body", { children: [
      children,
      /* @__PURE__ */ jsxRuntimeExports.jsx(Scripts, {})
    ] })
  ] });
}
function RootComponent() {
  const { queryClient } = Route$f.useRouteContext();
  const router2 = useRouter();
  reactExports.useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router2.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [router2, queryClient]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(QueryClientProvider, { client: queryClient, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Outlet, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Toaster, { richColors: true, position: "top-right" })
  ] });
}
const $$splitComponentImporter$e = () => import("./auth-CJpuuEj-.mjs");
const Route$e = createFileRoute("/auth")({
  head: () => ({
    meta: [{
      title: "Sign in — FusionPro"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$e, "component")
});
const $$splitComponentImporter$d = () => import("./route-Bc-6ibXe.mjs");
const Route$d = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const {
      data,
      error
    } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({
      to: "/auth"
    });
    return {
      user: data.user
    };
  },
  component: lazyRouteComponent($$splitComponentImporter$d, "component")
});
const $$splitComponentImporter$c = () => import("./index-CtLfR7GA.mjs");
const Route$c = createFileRoute("/")({
  head: () => ({
    meta: [{
      title: "FusionPro — RealArc Estates Operations"
    }, {
      name: "description",
      content: "Property service operations for RealArc Estates: electrical, plumbing, landscaping, painting, property management, tank cleaning."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$c, "component")
});
const $$splitComponentImporter$b = () => import("./dashboard-DHcHLNsK.mjs");
const Route$b = createFileRoute("/_authenticated/dashboard")({
  component: lazyRouteComponent($$splitComponentImporter$b, "component")
});
const $$splitComponentImporter$a = () => import("./index-B_AxFIH5.mjs");
const Route$a = createFileRoute("/_authenticated/engineer/")({
  component: lazyRouteComponent($$splitComponentImporter$a, "component")
});
const $$splitComponentImporter$9 = () => import("./index-rs9Z0cFG.mjs");
const Route$9 = createFileRoute("/_authenticated/client/")({
  component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
const $$splitComponentImporter$8 = () => import("./index-CayPy0Zu.mjs");
const Route$8 = createFileRoute("/_authenticated/admin/")({
  component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
const $$splitComponentImporter$7 = () => import("../_projectId-Dse-5-G_.mjs");
const Route$7 = createFileRoute("/_authenticated/engineer/$projectId")({
  component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
const $$splitComponentImporter$6 = () => import("./new-XRW9r-H-.mjs");
const Route$6 = createFileRoute("/_authenticated/client/new")({
  component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
const $$splitComponentImporter$5 = () => import("../_projectId-B5A6B8GI.mjs");
const Route$5 = createFileRoute("/_authenticated/client/$projectId")({
  component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
const $$splitComponentImporter$4 = () => import("../_projectId.worksheet-CK-NAQI8.mjs");
const Route$4 = createFileRoute("/_authenticated/engineer/$projectId/worksheet")({
  component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
const $$splitComponentImporter$3 = () => import("../_projectId.quotation-D7XYZGtr.mjs");
const Route$3 = createFileRoute("/_authenticated/engineer/$projectId/quotation")({
  component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
const $$splitComponentImporter$2 = () => import("../_projectId.messages-DphIvMJW.mjs");
const Route$2 = createFileRoute("/_authenticated/engineer/$projectId/messages")({
  component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
const $$splitComponentImporter$1 = () => import("../_projectId.inspection-BgVAOp1v.mjs");
const Route$1 = createFileRoute("/_authenticated/engineer/$projectId/inspection")({
  component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
const $$splitComponentImporter = () => import("../_projectId.compare-U2xSk0CZ.mjs");
const Route = createFileRoute("/_authenticated/engineer/$projectId/compare")({
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const AuthRoute = Route$e.update({
  id: "/auth",
  path: "/auth",
  getParentRoute: () => Route$f
});
const AuthenticatedRouteRoute = Route$d.update({
  id: "/_authenticated",
  getParentRoute: () => Route$f
});
const IndexRoute = Route$c.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$f
});
const AuthenticatedDashboardRoute = Route$b.update({
  id: "/dashboard",
  path: "/dashboard",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedEngineerIndexRoute = Route$a.update({
  id: "/engineer/",
  path: "/engineer/",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedClientIndexRoute = Route$9.update({
  id: "/client/",
  path: "/client/",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedAdminIndexRoute = Route$8.update({
  id: "/admin/",
  path: "/admin/",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedEngineerProjectIdRoute = Route$7.update({
  id: "/engineer/$projectId",
  path: "/engineer/$projectId",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedClientNewRoute = Route$6.update({
  id: "/client/new",
  path: "/client/new",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedClientProjectIdRoute = Route$5.update({
  id: "/client/$projectId",
  path: "/client/$projectId",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedEngineerProjectIdWorksheetRoute = Route$4.update({
  id: "/worksheet",
  path: "/worksheet",
  getParentRoute: () => AuthenticatedEngineerProjectIdRoute
});
const AuthenticatedEngineerProjectIdQuotationRoute = Route$3.update({
  id: "/quotation",
  path: "/quotation",
  getParentRoute: () => AuthenticatedEngineerProjectIdRoute
});
const AuthenticatedEngineerProjectIdMessagesRoute = Route$2.update({
  id: "/messages",
  path: "/messages",
  getParentRoute: () => AuthenticatedEngineerProjectIdRoute
});
const AuthenticatedEngineerProjectIdInspectionRoute = Route$1.update({
  id: "/inspection",
  path: "/inspection",
  getParentRoute: () => AuthenticatedEngineerProjectIdRoute
});
const AuthenticatedEngineerProjectIdCompareRoute = Route.update({
  id: "/compare",
  path: "/compare",
  getParentRoute: () => AuthenticatedEngineerProjectIdRoute
});
const AuthenticatedEngineerProjectIdRouteChildren = {
  AuthenticatedEngineerProjectIdCompareRoute,
  AuthenticatedEngineerProjectIdInspectionRoute,
  AuthenticatedEngineerProjectIdMessagesRoute,
  AuthenticatedEngineerProjectIdQuotationRoute,
  AuthenticatedEngineerProjectIdWorksheetRoute
};
const AuthenticatedEngineerProjectIdRouteWithChildren = AuthenticatedEngineerProjectIdRoute._addFileChildren(
  AuthenticatedEngineerProjectIdRouteChildren
);
const AuthenticatedRouteRouteChildren = {
  AuthenticatedDashboardRoute,
  AuthenticatedClientProjectIdRoute,
  AuthenticatedClientNewRoute,
  AuthenticatedEngineerProjectIdRoute: AuthenticatedEngineerProjectIdRouteWithChildren,
  AuthenticatedAdminIndexRoute,
  AuthenticatedClientIndexRoute,
  AuthenticatedEngineerIndexRoute
};
const AuthenticatedRouteRouteWithChildren = AuthenticatedRouteRoute._addFileChildren(AuthenticatedRouteRouteChildren);
const rootRouteChildren = {
  IndexRoute,
  AuthenticatedRouteRoute: AuthenticatedRouteRouteWithChildren,
  AuthRoute
};
const routeTree = Route$f._addFileChildren(rootRouteChildren)._addFileTypes();
const getRouter = () => {
  const queryClient = new QueryClient();
  const router2 = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0
  });
  return router2;
};
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));
export {
  Route$7 as R,
  Route$5 as a,
  Route$4 as b,
  Route$3 as c,
  Route$2 as d,
  Route$1 as e,
  Route as f,
  router as r
};
