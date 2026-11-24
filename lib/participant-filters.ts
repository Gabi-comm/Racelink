// tabs on Manage Participants; the export uses the same list so a CSV always matches a tab
export const PARTICIPANT_TABS = [
  { value: "pending", label: "Payment status" },
  { value: "approved", label: "Confirmed" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
  { value: "all", label: "All" },
] as const;

export type ParticipantTab = (typeof PARTICIPANT_TABS)[number]["value"];

export function isParticipantTab(v: unknown): v is ParticipantTab {
  return PARTICIPANT_TABS.some((t) => t.value === v);
}

export function inTab(p: { status: string }, tab: ParticipantTab) {
  return tab === "all" || p.status === tab;
}
