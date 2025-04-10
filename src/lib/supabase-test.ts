import { supabase } from "./supabase";

/**
 * Supabase 연결을 테스트하는 함수
 * 콘솔에 결과를 출력합니다
 */
export async function testSupabaseConnection() {
  try {
    console.log("Supabase 연결 테스트 시작...");

    // 데이터베이스 연결 테스트
    const { data, error } = await supabase
      .from("members")
      .select("id, name, email")
      .limit(1);

    if (error) {
      console.error("Supabase 연결 오류:", error.message);
      return false;
    }

    console.log("Supabase 연결 성공!");
    console.log("테스트 데이터:", data);
    return true;
  } catch (err) {
    console.error("Supabase 연결 중 예외 발생:", err);
    return false;
  }
}

/**
 * 모든 회원 정보를 가져옵니다
 */
export async function getAllMembers() {
  try {
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("회원 정보 조회 오류:", error);
    return { data: null, error };
  }
}

/**
 * 모든 콘텐츠 정보를 가져옵니다
 */
export async function getAllContents() {
  try {
    const { data, error } = await supabase
      .from("contents")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("콘텐츠 정보 조회 오류:", error);
    return { data: null, error };
  }
}
