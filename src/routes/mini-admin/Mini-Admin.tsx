import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/mini-admin/Mini-Admin')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/mini-admin/Mini-Admin"!</div>
}
