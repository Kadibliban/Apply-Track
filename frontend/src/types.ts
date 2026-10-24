export const applicationStatuses = [
  "APPLIED",
  "ASSESSMENT",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "WITHDRAWN",
] as const;

export type ApplicationStatus = (typeof applicationStatuses)[number];

export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export interface Application {
  id: number;
  user_id: number;
  company: string;
  job_title: string;
  job_url: string | null;
  location: string | null;
  employment_type: string | null;
  salary_min: number | null;
  salary_max: number | null;
  application_date: string;
  status: ApplicationStatus;
  job_description: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApplicationPayload {
  company: string;
  job_title: string;
  job_url?: string | null;
  location?: string | null;
  employment_type?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  application_date: string;
  status: ApplicationStatus;
  job_description?: string | null;
  notes?: string | null;
}

export interface Interview {
  id: number;
  application_id: number;
  interview_at: string;
  interview_type: string;
  meeting_link: string | null;
  notes: string | null;
}

export interface FollowUp {
  id: number;
  application_id: number;
  due_at: string;
  notes: string | null;
  is_completed: boolean;
}

export interface DashboardStats {
  total_applications: number;
  applications_by_status: Record<ApplicationStatus, number>;
  total_interviews: number;
  total_offers: number;
  total_rejections: number;
  upcoming_interviews: number;
  overdue_follow_ups: number;
}
