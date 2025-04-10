import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY ?? "";

// 디버깅을 위한 로그
console.log("Supabase URL:", supabaseUrl);
console.log("Supabase Key (첫 10자):", supabaseKey.substring(0, 10) + "...");

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Member = {
  id: string;
  name: string;
  nickname: string | null;
  birth_date: string | null;
  email: string;
  password_hash: string;
  status: "active" | "expired" | "cancelled" | "pending";
  created_at: string;
  expired_at: string | null;
  role: "admin" | "user";
  coupon_code: string | null;
};

export type Content = {
  id: string;
  title: string;
  description: string | null;
  video_key: string;
  youtube_url: string;
  created_at: string;
  updated_at: string;
  visible: boolean;
  category: string | null;
  duration: string | null;
  formatted_duration: string | null;
};

export type WatchLog = {
  id: string;
  member_id: string;
  content_id: string;
  watched_at: string;
};

export type Coupon = {
  id: string;
  code: string;
  created_at: string;
  expires_at: string;
  duration_months: number;
  is_used: boolean;
  used_by: string | null;
  used_at: string | null;
  created_by: string | null;
};

export type SystemSettings = {
  id: string;
  auto_approve_signup: boolean;
  default_expiration_months: number;
  created_at: string;
  updated_at: string;
};

export default supabase;
