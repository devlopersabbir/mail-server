export type ProviderType = 'smtp' | 'aws_ses';

export interface ConfigResponse {
  provider: ProviderType;
  smtp_host?: string;
  smtp_port?: string;
  smtp_username?: string;
  sender_email: string;
  sender_name?: string;
  reply_to?: string;
  has_sender_password: boolean;
  aws_region?: string;
  aws_access_key_id?: string;
  has_aws_secret_access: boolean;
  max_workers: number;
  queue_capacity: number;
}

export interface ConfigUpdateRequest {
  provider?: ProviderType;
  smtp_host?: string;
  smtp_port?: string;
  smtp_username?: string;
  sender_email?: string;
  sender_name?: string;
  sender_password?: string;
  reply_to?: string;
  aws_region?: string;
  aws_access_key_id?: string;
  aws_secret_access_key?: string;
  max_workers?: number;
  queue_capacity?: number;
}

export interface Metrics {
  enqueued_total: number;
  sent_total: number;
  failed_total: number;
  opened_total: number;
  open_rate_percent: number;
  queue_length: number;
  max_workers: number;
}

export interface EmailMessage {
  from?: string;
  to: string[];
  subject: string;
  body: string;
  html_body?: string;
  reply_to?: string;
  tracking_base_url?: string;
}

export interface Job {
  id: string;
  message: EmailMessage;
  status: 'pending' | 'processing' | 'success' | 'failed';
  error?: string;
  created_at: string;
  opened_recipients?: string[];
  opened_at?: Record<string, string>;
}

export interface APIResponse<T = any> {
  status: 'ok' | 'success' | 'accepted' | 'error';
  message: string;
  data?: T;
}
