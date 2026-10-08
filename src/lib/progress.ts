// The progress labels the mini admin can pick for a project. These exact strings
// are also enforced by a check constraint in the database.
export const PROGRESS_CATEGORIES = [
  "Awaiting approval",
  "Awaiting quotation",
  "Awaiting funds",
  "Work in progress",
  "Complete fully paid",
  "Complete with balance",
] as const;

export type ProgressCategory = (typeof PROGRESS_CATEGORIES)[number];
