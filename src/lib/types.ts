import type { Category, HealthStatus } from "@/lib/constants";

export interface ServiceOption {
  id: string;
  name: string;
  active: boolean;
}

export interface ObservationDTO {
  id: string;
  customerId: string;
  text: string;
  author: string;
  createdAt: string; // ISO
}

export interface CustomerDTO {
  id: string;
  companyName: string;
  csOwner: string;
  category: Category;

  segment: string | null;
  segmentSourceTitle: string | null;
  segmentSourceUrl: string | null;
  segmentVerifiedAt: string | null;

  contactName: string | null;
  contactRole: string | null;
  contactInfo: string | null;
  technicalOwner: string | null;

  startDate: string | null;
  renewalDate: string | null;

  healthScore: number | null;
  healthStatus: HealthStatus;
  healthReason: string | null;
  attentionPoints: string | null;
  actionPlan: string | null;

  lastContact: string | null;
  nextContact: string | null;
  lastVisit: string | null;
  nextVisit: string | null;

  needs: string | null;
  currentPerception: string | null;
  expansionPlan: string | null;
  growthEstimate: string | null;
  opportunities: string | null;
  expansionNextStep: string | null;

  annualRevenue: number | null;
  fiscalYear: number | null;
  revenueMetric: string | null;
  revenuePeriod: string | null;
  revenueSourceTitle: string | null;
  revenueSourceUrl: string | null;
  revenueVerifiedAt: string | null;

  createdAt: string;
  updatedAt: string;

  services: ServiceOption[];
}

export interface CustomerDetailDTO extends CustomerDTO {
  observations: ObservationDTO[];
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CustomerFilters {
  search?: string;
  csOwner?: string;
  category?: Category;
  healthStatus?: HealthStatus;
  serviceIds?: string[];
}
