import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Member = {
  id: string;
  name: string;
  nickname: string;
  birth_date: string;
  email: string;
  password_hash: string;
  status: "active" | "expired" | "cancelled" | "pending";
  created_at: string;
  expired_at: string | null;
  role: "admin" | "user";
};

export type Content = {
  id: string;
  title: string;
  description: string;
  video_key: string;
  youtube_url: string;
  created_at: string;
  updated_at: string;
  visible: boolean;
};
