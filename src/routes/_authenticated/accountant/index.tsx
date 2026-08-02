import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/accountant/")({
  component: AccountantDashboardPage,
});

function AccountantDashboardPage() {
  const cards = [
    { title: "Cash position", value: "Coming soon" },
    { title: "Unpaid invoices", value: "Coming soon" },
    { title: "Overdue bills", value: "Coming soon" },
  ];

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Accounting overview</h1>
        <p className="text-muted-foreground">
          Review chart of accounts data and operational analysis in a read-only workspace for now.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <div key={card.title} className="rounded-lg border bg-card p-5">
            <div className="text-sm text-muted-foreground">{card.title}</div>
            <div className="mt-3 text-xl font-semibold">{card.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
