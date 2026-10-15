import type { CustomerStatus, QuoteStatus } from "../api";
import { customerStatusLabel, quoteStatusLabel } from "../utils";
import { Badge } from "./ui";

const customerTone: Record<CustomerStatus, string> = { Lead: "amber", Active: "green", Passive: "gray" };
const quoteTone: Record<QuoteStatus, string> = { Draft: "gray", Sent: "blue", Accepted: "green", Rejected: "red" };

export const CustomerStatusBadge = ({ status }: { status: CustomerStatus }) => (
  <Badge tone={customerTone[status]}>{customerStatusLabel[status]}</Badge>
);

export const QuoteStatusBadge = ({ status }: { status: QuoteStatus }) => (
  <Badge tone={quoteTone[status]}>{quoteStatusLabel[status]}</Badge>
);
