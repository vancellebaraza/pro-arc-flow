import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/mini-admin/Engineer/Engineer')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/mini-admin/Engineer"!</div>
}
