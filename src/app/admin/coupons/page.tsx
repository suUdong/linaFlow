"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Coupon } from "@/lib/supabase";
import AdminHeader from "@/components/AdminHeader";
import AdminNavigation from "@/components/AdminNavigation";

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingCount, setPendingCount] = useState(0);
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    duration_months: 1,
    expires_at: new Date(new Date().setMonth(new Date().getMonth() + 3))
      .toISOString()
      .split("T")[0], // 기본 만료일은 3개월 후
  });

  // 쿠폰 목록 불러오기
  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setCoupons(data || []);
    } catch (error) {
      console.error("쿠폰 목록 조회 중 오류:", error);
      setError("쿠폰 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 승인 대기 회원 수 가져오기
  const fetchPendingCount = async () => {
    try {
      const { count, error } = await supabase
        .from("members")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      if (error) throw error;
      setPendingCount(count || 0);
    } catch (err) {
      console.error("승인 대기 회원 수를 가져오는 중 오류 발생:", err);
    }
  };

  // 초기 로딩
  useEffect(() => {
    fetchCoupons();
    fetchPendingCount();
  }, []);

  // 새 쿠폰 생성
  const handleCreateCoupon = async () => {
    try {
      if (!newCoupon.code) {
        setError("쿠폰 코드를 입력해주세요.");
        return;
      }

      // 쿠폰 코드 중복 확인
      const { data: existingCoupon } = await supabase
        .from("coupons")
        .select("id")
        .eq("code", newCoupon.code)
        .single();

      if (existingCoupon) {
        setError("이미 존재하는 쿠폰 코드입니다.");
        return;
      }

      setLoading(true);
      const { error } = await supabase.from("coupons").insert([
        {
          code: newCoupon.code,
          duration_months: newCoupon.duration_months,
          expires_at: new Date(newCoupon.expires_at).toISOString(),
          is_used: false,
        },
      ]);

      if (error) {
        throw error;
      }

      // 폼 초기화 및 목록 새로고침
      setNewCoupon({
        code: "",
        duration_months: 1,
        expires_at: new Date(new Date().setMonth(new Date().getMonth() + 3))
          .toISOString()
          .split("T")[0],
      });
      fetchCoupons();
      setError("");
    } catch (error) {
      console.error("쿠폰 생성 중 오류:", error);
      setError("쿠폰 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 쿠폰 삭제
  const handleDeleteCoupon = async (id: string) => {
    if (!confirm("이 쿠폰을 정말 삭제하시겠습니까?")) {
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.from("coupons").delete().eq("id", id);

      if (error) {
        throw error;
      }

      fetchCoupons();
    } catch (error) {
      console.error("쿠폰 삭제 중 오류:", error);
      setError("쿠폰 삭제에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 날짜를 YYYY-MM-DD 형식으로 변환
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // 쿠폰 상태 표시
  const renderCouponStatus = (coupon: Coupon) => {
    const now = new Date();
    const expiryDate = new Date(coupon.expires_at);

    if (coupon.is_used) {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-200 text-gray-800">
          사용됨
        </span>
      );
    } else if (expiryDate < now) {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-200 text-orange-800">
          만료됨
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-200 text-green-800">
          사용가능
        </span>
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-pink-50 to-white">
        <div className="flex flex-col items-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-pink-600 border-t-transparent"></div>
          <p className="text-pink-600 mt-3">쿠폰 정보 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between mb-4 items-start md:items-center gap-4">
          <AdminNavigation
            currentPath="/admin/coupons"
            pendingCount={pendingCount}
          />
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-7 h-7 mr-2 text-pink-600"
            >
              <path d="M9.375 3a1.875 1.875 0 000 3.75h1.875v4.5H3.375A1.875 1.875 0 011.5 9.375v-.75c0-1.036.84-1.875 1.875-1.875h3.193A3.375 3.375 0 0112 2.753a3.375 3.375 0 015.432 3.997h3.943c1.035 0 1.875.84 1.875 1.875v.75c0 1.036-.84 1.875-1.875 1.875H12.75v-4.5h1.875a1.875 1.875 0 10-1.875-1.875V6.75h-1.5V4.875C11.25 3.839 10.41 3 9.375 3z" />
              <path d="M11.25 12.75H3v6.75a2.25 2.25 0 002.25 2.25h6v-9zM12.75 12.75v9h6.75a2.25 2.25 0 002.25-2.25v-6.75h-9z" />
            </svg>
            쿠폰 관리
          </h2>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 p-4 mb-6 rounded-lg text-red-800 text-sm">
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-red-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </div>
          </div>
        )}

        {/* 쿠폰 생성 폼 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-100">
          <h3 className="text-lg font-semibold mb-6 text-gray-900 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2 text-pink-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
            </svg>
            새 쿠폰 생성
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label
                htmlFor="code"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                쿠폰 코드 *
              </label>
              <input
                type="text"
                id="code"
                value={newCoupon.code}
                onChange={(e) =>
                  setNewCoupon({ ...newCoupon, code: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                required
              />
            </div>

            <div>
              <label
                htmlFor="duration"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                적용 기간 (개월) *
              </label>
              <select
                id="duration"
                value={newCoupon.duration_months}
                onChange={(e) =>
                  setNewCoupon({
                    ...newCoupon,
                    duration_months: parseInt(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
              >
                {[1, 2, 3, 6, 12].map((month) => (
                  <option key={month} value={month}>
                    {month}개월
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="expires_at"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                쿠폰 만료일 *
              </label>
              <input
                type="date"
                id="expires_at"
                value={newCoupon.expires_at}
                onChange={(e) =>
                  setNewCoupon({ ...newCoupon, expires_at: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                required
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleCreateCoupon}
              className="px-4 py-2 text-sm font-medium text-white bg-pink-600 rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 shadow-sm transition-colors"
            >
              쿠폰 생성
            </button>
          </div>
        </div>

        {/* 쿠폰 목록 */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-pink-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
              </svg>
              쿠폰 목록
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    쿠폰 코드
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    상태
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    적용 기간
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    만료일
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    생성일
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {coupons.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      등록된 쿠폰이 없습니다.
                    </td>
                  </tr>
                ) : (
                  coupons.map((coupon) => (
                    <tr key={coupon.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {coupon.code}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderCouponStatus(coupon)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {coupon.duration_months}개월
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(coupon.expires_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(coupon.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {!coupon.is_used && (
                          <button
                            onClick={() => handleDeleteCoupon(coupon.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            삭제
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
