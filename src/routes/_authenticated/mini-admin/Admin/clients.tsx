import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/mini-admin/Admin/clients',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/mini-admin/Admin/clients"!</div>
}
