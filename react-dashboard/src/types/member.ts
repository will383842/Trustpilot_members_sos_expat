export type MessageStatus = 'not_sent' | 'sent' | 'replied';

export interface Group {
  id: number;
  name: string;
  language: string;
  country: string | null;
  joined_at?: string;
  left_at?: string | null;
}

export interface Member {
  id: number;
  phone_number: string;
  display_name: string | null;
  primary_language: string;
  primary_country: string | null;
  primary_continent: string | null;
  message_status: MessageStatus;
  message_sent_at: string | null;
  replied_at: string | null;
  generated_at: string | null;
  first_seen_at: string;
  is_new: boolean;
  has_message: boolean;
  whatsapp_link: string | null;
  groups: Group[];
  // Only present in detail view
  whatsapp_message?: string;
  notes?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface Stats {
  total_members: number;
  not_sent: number;
  sent: number;
  replied: number;
  sent_today: number;
  new_this_week: number;
  reply_rate: number;
  by_language: { primary_language: string; count: number }[];
  by_continent: { primary_continent: string; count: number }[];
  top_groups: { name: string; country: string; language: string; member_count: number }[];
  baileys_connected: boolean;
  baileys_last_ping: string | null;
}

export interface MemberFilters {
  status?: MessageStatus | '';
  language?: string;
  country?: string;
  group_id?: number | '';
  search?: string;
  sort?: 'recent' | 'name' | 'status';
  page?: number;
}
