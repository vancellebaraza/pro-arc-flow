import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/mini-admin/todo')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/mini-admin/todo"!</div>
}
