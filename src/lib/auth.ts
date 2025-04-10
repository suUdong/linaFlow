import { supabase } from "./supabase";
import { Member } from "./supabase";

// 관리자 이메일 목록
const ADMIN_EMAILS = ["admin@example.com"];

export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .eq("email", email)
      .single();

    if (error) throw error;
    if (!data) throw new Error("사용자를 찾을 수 없습니다.");

    // 계정 상태 확인
    if (data.status === "pending") {
      throw new Error(
        "회원가입 승인 대기 중입니다. 관리자 승인 후 로그인이 가능합니다."
      );
    }

    if (data.status !== "active") {
      throw new Error("비활성화된 계정입니다. 관리자에게 문의하세요.");
    }

    // 실제 구현에서는 bcrypt로 비밀번호 비교 필요
    if (data.password_hash !== password)
      throw new Error("비밀번호가 일치하지 않습니다.");

    // 관리자 여부 확인
    const isAdmin = ADMIN_EMAILS.includes(data.email);

    return { user: data, isAdmin, error: null };
  } catch (error) {
    return { user: null, isAdmin: false, error };
  }
}

export async function signOut() {
  localStorage.removeItem("user");
  window.location.href = "/login";
}

export function getCurrentUser() {
  if (typeof window === "undefined") return null;

  const user = localStorage.getItem("user");
  if (!user) return null;

  try {
    return JSON.parse(user);
  } catch (error) {
    return null;
  }
}

export function setCurrentUser(user: Member) {
  if (typeof window === "undefined") return;
  localStorage.setItem("user", JSON.stringify(user));
}

export function isAdmin(email: string): boolean {
  return ADMIN_EMAILS.includes(email);
}

export function checkAdminAccess(): boolean {
  const user = getCurrentUser();
  if (!user) return false;
  return isAdmin(user.email);
}
