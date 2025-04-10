"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Member } from "@/lib/supabase";
import { checkAdminAccess } from "@/lib/auth";
import AdminNavigation from "@/components/AdminNavigation";
import AdminHeader from "@/components/AdminHeader";

export default function AdminMembers() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "all" | "active" | "pending" | "expired" | "cancelled"
  >("all");
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editExpiredAt, setEditExpiredAt] = useState<string>("");
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);

  // 시스템 설정값 상태 추가
  const [systemSettings, setSystemSettings] = useState<{
    default_expiration_months: number;
    auto_approve_signup: boolean;
  }>({
    default_expiration_months: 3,
    auto_approve_signup: false,
  });

  // 페이지네이션 관련 상태 추가
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // 선택된 회원 관리를 위한 상태 추가
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [bulkAction, setBulkAction] = useState<
    "active" | "expired" | "cancelled" | ""
  >("");

  // 만료 기간 입력 방식 상태
  const [expirationType, setExpirationType] = useState<"select" | "custom">(
    "select"
  );
  const [expirationMonths, setExpirationMonths] = useState<number | string>(3);
  const [customExpirationMonths, setCustomExpirationMonths] = useState<
    number | string
  >("");

  const [newMember, setNewMember] = useState({
    name: "",
    nickname: "",
    birth_date: "",
    email: "",
    password: "",
    expired_at: "",
  });

  useEffect(() => {
    checkAdminStatus();
    fetchMembers();
    fetchPendingCount();
    fetchSystemSettings();
  }, [activeTab, itemsPerPage, currentPage]);

  // 시스템 설정 가져오기
  const fetchSystemSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .single();

      if (error) throw error;

      if (data) {
        setSystemSettings({
          default_expiration_months: data.default_expiration_months || 3,
          auto_approve_signup: data.auto_approve_signup,
        });
        setExpirationMonths(data.default_expiration_months || 3);
      }
    } catch (err) {
      console.error("시스템 설정을 가져오는 중 오류 발생:", err);
    }
  };

  // 만료일 계산 함수
  const calculateExpiryDate = (months: number): string => {
    const today = new Date();
    today.setMonth(today.getMonth() + months);
    return today.toISOString().split("T")[0]; // YYYY-MM-DD 형식
  };

  // 만료 개월 선택 시 자동으로 만료일 업데이트
  useEffect(() => {
    if (expirationType === "select" && typeof expirationMonths === "number") {
      const newExpiryDate = calculateExpiryDate(expirationMonths);
      setNewMember((prev) => ({ ...prev, expired_at: newExpiryDate }));
    } else if (
      expirationType === "custom" &&
      typeof customExpirationMonths === "number"
    ) {
      const newExpiryDate = calculateExpiryDate(customExpirationMonths);
      setNewMember((prev) => ({ ...prev, expired_at: newExpiryDate }));
    }
  }, [expirationType, expirationMonths, customExpirationMonths]);

  // 만료 개월 수 변경 핸들러
  const handleExpirationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "custom") {
      setExpirationType("custom");
    } else {
      setExpirationType("select");
      setExpirationMonths(parseInt(value));
    }
  };

  // 사용자 정의 만료 개월 수 변경 핸들러
  const handleCustomExpirationChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setCustomExpirationMonths(value === "" ? "" : parseInt(value));

    if (value !== "" && !isNaN(parseInt(value))) {
      const newExpiryDate = calculateExpiryDate(parseInt(value));
      setNewMember((prev) => ({ ...prev, expired_at: newExpiryDate }));
    }
  };

  // 편집 중인 회원의 만료 개월 설정
  const [editExpirationType, setEditExpirationType] = useState<
    "select" | "custom"
  >("select");
  const [editExpirationMonths, setEditExpirationMonths] = useState<
    number | string
  >(3);
  const [editCustomExpirationMonths, setEditCustomExpirationMonths] = useState<
    number | string
  >("");

  // 만료일이 지난 회원 자동 만료 처리
  useEffect(() => {
    const checkExpiredMembers = async () => {
      try {
        // 현재 날짜
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 만료일이 지났지만 아직 active 상태인 회원 가져오기
        const { data, error } = await supabase
          .from("members")
          .select("id")
          .eq("status", "active")
          .lt("expired_at", today.toISOString());

        if (error) throw error;

        if (data && data.length > 0) {
          // 만료일이 지난 회원을 expired 상태로 변경
          const { error: updateError } = await supabase
            .from("members")
            .update({ status: "expired" })
            .in(
              "id",
              data.map((member) => member.id)
            );

          if (updateError) throw updateError;

          // 목록 다시 로드
          fetchMembers();
        }
      } catch (err) {
        console.error("자동 만료 처리 중 오류 발생:", err);
      }
    };

    // 페이지 로드 시 자동 만료 처리 실행
    checkExpiredMembers();

    // 24시간마다 실행 (실제 운영에서는 서버 측에서 처리하는 것이 더 적합)
    const intervalId = setInterval(checkExpiredMembers, 24 * 60 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  const checkAdminStatus = () => {
    // 관리자 권한 체크
    const hasAccess = checkAdminAccess();
    setIsAdmin(hasAccess);

    // 관리자가 아닌 경우 로그인 페이지로 리디렉션
    if (!hasAccess) {
      router.push("/login");
    }
  };

  const fetchMembers = async () => {
    try {
      setLoading(true);

      // 전체 개수 먼저 조회
      let countQuery = supabase
        .from("members")
        .select("*", { count: "exact", head: true });

      // 탭에 따라 쿼리 조건 변경
      if (activeTab === "active") {
        countQuery = countQuery.eq("status", "active");
      } else if (activeTab === "pending") {
        countQuery = countQuery.eq("status", "pending");
      } else if (activeTab === "expired") {
        countQuery = countQuery.eq("status", "expired");
      } else if (activeTab === "cancelled") {
        countQuery = countQuery.eq("status", "cancelled");
      }

      const { count, error: countError } = await countQuery;

      if (countError) throw countError;

      setTotalCount(count || 0);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));

      // 현재 페이지가 총 페이지수보다 크면 1페이지로 리셋
      if (currentPage > Math.ceil((count || 0) / itemsPerPage)) {
        setCurrentPage(1);
      }

      // 페이지네이션 적용하여 데이터 조회
      const startIndex = (currentPage - 1) * itemsPerPage;
      let query = supabase
        .from("members")
        .select("*")
        .order("created_at", { ascending: false })
        .range(startIndex, startIndex + itemsPerPage - 1);

      // 탭에 따라 쿼리 조건 변경
      if (activeTab === "active") {
        query = query.eq("status", "active");
      } else if (activeTab === "pending") {
        query = query.eq("status", "pending");
      } else if (activeTab === "expired") {
        query = query.eq("status", "expired");
      } else if (activeTab === "cancelled") {
        query = query.eq("status", "cancelled");
      }

      const { data, error } = await query;

      if (error) throw error;

      setMembers(data || []);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "회원 정보를 가져오는 중 오류가 발생했습니다.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewMember((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // 간단한 유효성 검사
      if (!newMember.name || !newMember.email || !newMember.password) {
        setError("필수 항목을 모두 입력해주세요.");
        return;
      }

      // 비밀번호 검증 (6자리 숫자)
      if (!/^\d{6}$/.test(newMember.password)) {
        setError("비밀번호는 6자리 숫자여야 합니다.");
        return;
      }

      const { error } = await supabase.from("members").insert([
        {
          name: newMember.name,
          nickname: newMember.nickname || newMember.name,
          birth_date: newMember.birth_date,
          email: newMember.email,
          password_hash: newMember.password, // 실제 구현에서는 bcrypt로 해시 필요
          status: "active",
          expired_at: newMember.expired_at || null,
        },
      ]);

      if (error) throw error;

      // 폼 초기화
      setNewMember({
        name: "",
        nickname: "",
        birth_date: "",
        email: "",
        password: "",
        expired_at: "",
      });

      // 목록 다시 로드
      fetchMembers();

      // 승인 대기 숫자 다시 로드 (다른 상태와의 일관성을 위해)
      fetchPendingCount();

      setError("");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "회원 추가 중 오류가 발생했습니다.";
      setError(errorMessage);
    }
  };

  const handleUpdateStatus = async (
    id: string,
    status: "active" | "expired" | "cancelled" | "pending"
  ) => {
    try {
      // pending에서 active로 변경하는 경우 만료일도 설정
      if (status === "active") {
        // 회원 정보 조회
        const { data: memberData, error: fetchError } = await supabase
          .from("members")
          .select("status, expired_at")
          .eq("id", id)
          .single();

        if (fetchError) throw fetchError;

        // pending에서 active로 변경하는 경우에만 만료일 설정
        if (memberData?.status === "pending") {
          // 현재 날짜에 기본 만료 기간을 더한 날짜 계산
          const expiryDate = new Date();
          expiryDate.setMonth(
            expiryDate.getMonth() + systemSettings.default_expiration_months
          );

          // 상태와 만료일 함께 업데이트
          const { error } = await supabase
            .from("members")
            .update({
              status,
              expired_at: expiryDate.toISOString(),
            })
            .eq("id", id);

          if (error) throw error;
        } else {
          // 그 외 경우는 상태만 업데이트
          const { error } = await supabase
            .from("members")
            .update({ status })
            .eq("id", id);

          if (error) throw error;
        }
      } else {
        // active 외 상태로 변경하는 경우는 상태만 업데이트
        const { error } = await supabase
          .from("members")
          .update({ status })
          .eq("id", id);

        if (error) throw error;
      }

      // 목록 다시 로드
      fetchMembers();

      // 승인 대기 숫자 다시 로드
      fetchPendingCount();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "회원 상태 변경 중 오류가 발생했습니다.";
      setError(errorMessage);
    }
  };

  // 편집 모드 시작 함수 수정
  const handleStartEditExpiredAt = (member: Member) => {
    setEditingMemberId(member.id);

    // 기존 만료일이 있으면 설정
    if (member.expired_at) {
      const expiryDate = new Date(member.expired_at);
      const today = new Date();
      const diffMonths =
        (expiryDate.getFullYear() - today.getFullYear()) * 12 +
        (expiryDate.getMonth() - today.getMonth());

      // 미리 정의된 개월 수에 맞는지 확인
      const standardMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      if (standardMonths.includes(diffMonths)) {
        setEditExpirationType("select");
        setEditExpirationMonths(diffMonths);
      } else {
        setEditExpirationType("custom");
        setEditCustomExpirationMonths(diffMonths > 0 ? diffMonths : "");
      }

      // yyyy-MM-dd 형식으로 변환
      setEditExpiredAt(expiryDate.toISOString().split("T")[0]);
    } else {
      setEditExpirationType("select");
      setEditExpirationMonths(systemSettings.default_expiration_months);
      setEditCustomExpirationMonths("");
      setEditExpiredAt("");
    }
  };

  // 편집 모드 만료 개월 수 변경 핸들러
  const handleEditExpirationChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value = e.target.value;
    if (value === "custom") {
      setEditExpirationType("custom");
    } else {
      setEditExpirationType("select");
      setEditExpirationMonths(parseInt(value));
      const newExpiryDate = calculateExpiryDate(parseInt(value));
      setEditExpiredAt(newExpiryDate);
    }
  };

  // 편집 모드 사용자 정의 만료 개월 수 변경 핸들러
  const handleEditCustomExpirationChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setEditCustomExpirationMonths(value === "" ? "" : parseInt(value));

    if (value !== "" && !isNaN(parseInt(value))) {
      const newExpiryDate = calculateExpiryDate(parseInt(value));
      setEditExpiredAt(newExpiryDate);
    }
  };

  // 만료일 업데이트 함수 수정 - 개월 정보도 함께 저장
  const handleUpdateExpiredAt = async (id: string) => {
    if (!editExpiredAt) {
      setError("만료일을 선택해주세요.");
      return;
    }

    try {
      const { error } = await supabase
        .from("members")
        .update({ expired_at: editExpiredAt })
        .eq("id", id);

      if (error) throw error;

      // 편집 모드 종료
      setEditingMemberId(null);
      setEditExpiredAt("");
      setEditExpirationType("select");
      setEditExpirationMonths(systemSettings.default_expiration_months);
      setEditCustomExpirationMonths("");

      // 목록 다시 로드
      fetchMembers();
      fetchPendingCount();

      setError("");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "만료일 변경 중 오류가 발생했습니다.";
      setError(errorMessage);
    }
  };

  // 날짜 포맷팅 함수
  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // 회원 상태에 따른 뱃지 표시
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
            활성
          </span>
        );
      case "pending":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-pink-100 text-pink-800">
            승인대기
          </span>
        );
      case "expired":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
            만료됨
          </span>
        );
      case "cancelled":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
            해지됨
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 다음 페이지로 이동
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // 이전 페이지로 이동
  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // 페이지당 표시 개수 변경 핸들러
  const handleItemsPerPageChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newItemsPerPage = parseInt(e.target.value);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // 페이지 수 변경 시 첫 페이지로 이동
  };

  // 체크박스 전체 선택/해제 핸들러
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(members.map((member) => member.id));
    }
    setSelectAll(!selectAll);
  };

  // 개별 회원 선택/해제 핸들러
  const handleSelectMember = (id: string) => {
    if (selectedMembers.includes(id)) {
      setSelectedMembers(selectedMembers.filter((memberId) => memberId !== id));
      setSelectAll(false);
    } else {
      setSelectedMembers([...selectedMembers, id]);
      // 모든 회원이 선택되었는지 확인
      if (selectedMembers.length + 1 === members.length) {
        setSelectAll(true);
      }
    }
  };

  // 일괄 상태 변경 핸들러
  const handleBulkStatusUpdate = async () => {
    if (!bulkAction || selectedMembers.length === 0) {
      setError("상태를 선택하고 회원을 선택해주세요.");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from("members")
        .update({ status: bulkAction })
        .in("id", selectedMembers);

      if (error) throw error;

      // 목록 다시 로드
      fetchMembers();
      // 승인 대기 숫자 다시 로드
      fetchPendingCount();
      // 선택 초기화
      setSelectedMembers([]);
      setSelectAll(false);
      setBulkAction("");
      setError("");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "회원 상태를 일괄 변경하는 중 오류가 발생했습니다.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-pink-50 to-white">
        <div className="flex flex-col items-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-pink-600 border-t-transparent"></div>
          <p className="text-pink-600 mt-3">회원 정보 로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-pink-50 to-white">
        <p className="text-red-500">관리자 권한이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between mb-4 items-start md:items-center gap-4">
          <AdminNavigation
            currentPath="/admin/members"
            pendingCount={pendingCount}
          />
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">회원 관리</h2>
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

        {/* 회원 추가 섹션 - 접을 수 있는 형태로 변경 */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-8 border border-gray-100">
          <button
            onClick={() => setShowAddMemberForm(!showAddMemberForm)}
            className="w-full flex items-center justify-between text-lg font-semibold text-gray-900 py-2"
          >
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-pink-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
              </svg>
              신규 회원 추가
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 text-gray-500 transition-transform ${
                showAddMemberForm ? "rotate-180" : ""
              }`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {showAddMemberForm && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <form
                onSubmit={handleAddMember}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    이름 *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={newMember.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="nickname"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    닉네임
                  </label>
                  <input
                    type="text"
                    id="nickname"
                    name="nickname"
                    value={newMember.nickname}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    이메일 *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={newMember.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="birth_date"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    생년월일
                  </label>
                  <input
                    type="date"
                    id="birth_date"
                    name="birth_date"
                    value={newMember.birth_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    비밀번호 (6자리 숫자) *
                  </label>
                  <input
                    type="text"
                    id="password"
                    name="password"
                    value={newMember.password}
                    onChange={handleInputChange}
                    pattern="[0-9]{6}"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                    required
                    maxLength={6}
                  />
                </div>

                <div>
                  <label
                    htmlFor="expiration_months"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    멤버십 만료 기간 *
                  </label>
                  <div className="flex items-center space-x-2">
                    <select
                      id="expiration_months"
                      value={
                        expirationType === "select"
                          ? expirationMonths
                          : "custom"
                      }
                      onChange={handleExpirationChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                    >
                      <option value="1">1개월</option>
                      <option value="2">2개월</option>
                      <option value="3">3개월</option>
                      <option value="4">4개월</option>
                      <option value="5">5개월</option>
                      <option value="6">6개월</option>
                      <option value="7">7개월</option>
                      <option value="8">8개월</option>
                      <option value="9">9개월</option>
                      <option value="10">10개월</option>
                      <option value="11">11개월</option>
                      <option value="12">12개월</option>
                      <option value="custom">직접 입력</option>
                    </select>

                    {expirationType === "custom" && (
                      <div className="flex items-center">
                        <input
                          type="number"
                          value={customExpirationMonths}
                          onChange={handleCustomExpirationChange}
                          min="1"
                          className="w-20 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                          placeholder="개월"
                        />
                        <span className="ml-2 text-sm text-gray-500">개월</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-2">
                    <label
                      htmlFor="expired_at"
                      className="block text-sm font-medium text-gray-500 mb-1"
                    >
                      만료일:{" "}
                      {newMember.expired_at
                        ? formatDate(newMember.expired_at)
                        : "-"}
                    </label>
                  </div>
                </div>

                <div className="md:col-span-2 mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowAddMemberForm(false)}
                    className="px-4 py-2 mr-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 shadow-sm transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-pink-600 rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 shadow-sm transition-colors"
                  >
                    회원 추가
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* 회원 목록 */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              <button
                className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                  activeTab === "all"
                    ? "bg-pink-100 text-pink-700"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                } shadow-sm border border-gray-200 transition-colors`}
                onClick={() => setActiveTab("all")}
              >
                전체
              </button>
              <button
                className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                  activeTab === "active"
                    ? "bg-pink-100 text-pink-700"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                } shadow-sm border border-gray-200 transition-colors`}
                onClick={() => setActiveTab("active")}
              >
                활성 회원
              </button>
              <button
                className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                  activeTab === "pending"
                    ? "bg-pink-100 text-pink-700"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                } shadow-sm border border-gray-200 transition-colors relative`}
                onClick={() => setActiveTab("pending")}
              >
                승인 대기
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-pink-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </button>
              <button
                className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                  activeTab === "expired"
                    ? "bg-pink-100 text-pink-700"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                } shadow-sm border border-gray-200 transition-colors`}
                onClick={() => setActiveTab("expired")}
              >
                만료됨
              </button>
              <button
                className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                  activeTab === "cancelled"
                    ? "bg-pink-100 text-pink-700"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                } shadow-sm border border-gray-200 transition-colors`}
                onClick={() => setActiveTab("cancelled")}
              >
                해지됨
              </button>
            </div>
          </div>

          {/* 표시 개수 설정 및 일괄 변경 컨트롤 추가 */}
          <div className="p-4 border-b border-gray-100 bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center space-x-3">
              <label
                htmlFor="itemsPerPage"
                className="text-sm font-medium text-gray-700"
              >
                표시 개수:
              </label>
              <select
                id="itemsPerPage"
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="px-3 py-1 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 text-sm"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>

            {selectedMembers.length > 0 && (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-700">
                  {selectedMembers.length}명 선택됨
                </span>
                <select
                  value={bulkAction}
                  onChange={(e) =>
                    setBulkAction(
                      e.target.value as "active" | "expired" | "cancelled" | ""
                    )
                  }
                  className="px-3 py-1 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 text-sm"
                >
                  <option value="">상태 변경</option>
                  <option value="active">활성화</option>
                  <option value="expired">만료</option>
                  <option value="cancelled">해지</option>
                </select>
                <button
                  onClick={handleBulkStatusUpdate}
                  disabled={!bulkAction}
                  className={`px-3 py-1 text-sm font-medium rounded-md ${
                    bulkAction
                      ? "bg-pink-100 text-pink-700 hover:bg-pink-200"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  } shadow-sm border border-gray-200 transition-colors`}
                >
                  적용
                </button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                      />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    회원정보
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
                    가입일
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    만료일
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
                {members.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      {activeTab === "all"
                        ? "등록된 회원이 없습니다."
                        : activeTab === "active"
                        ? "활성 회원이 없습니다."
                        : activeTab === "pending"
                        ? "승인 대기 중인 회원이 없습니다."
                        : activeTab === "expired"
                        ? "만료된 회원이 없습니다."
                        : "해지된 회원이 없습니다."}
                    </td>
                  </tr>
                ) : (
                  members.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedMembers.includes(member.id)}
                            onChange={() => handleSelectMember(member.id)}
                            className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold">
                            {member.name.charAt(0)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 flex items-center">
                              {member.name}
                              {member.role === "admin" && (
                                <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                                  관리자
                                </span>
                              )}
                              {member.nickname &&
                                member.nickname !== member.name && (
                                  <span className="ml-2 text-xs text-gray-500">
                                    ({member.nickname})
                                  </span>
                                )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {member.email}
                              {member.birth_date && (
                                <span className="ml-2 text-xs">
                                  {new Date(
                                    member.birth_date
                                  ).toLocaleDateString("ko-KR", {
                                    year: "numeric",
                                    month: "numeric",
                                    day: "numeric",
                                  })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderStatusBadge(member.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(member.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {editingMemberId === member.id ? (
                          <div className="flex flex-col space-y-2">
                            <div className="flex items-center space-x-2">
                              <select
                                value={
                                  editExpirationType === "select"
                                    ? editExpirationMonths
                                    : "custom"
                                }
                                onChange={handleEditExpirationChange}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                              >
                                <option value="1">1개월</option>
                                <option value="2">2개월</option>
                                <option value="3">3개월</option>
                                <option value="4">4개월</option>
                                <option value="5">5개월</option>
                                <option value="6">6개월</option>
                                <option value="7">7개월</option>
                                <option value="8">8개월</option>
                                <option value="9">9개월</option>
                                <option value="10">10개월</option>
                                <option value="11">11개월</option>
                                <option value="12">12개월</option>
                                <option value="custom">직접 입력</option>
                              </select>

                              {editExpirationType === "custom" && (
                                <div className="flex items-center">
                                  <input
                                    type="number"
                                    value={editCustomExpirationMonths}
                                    onChange={handleEditCustomExpirationChange}
                                    min="1"
                                    className="w-16 px-2 py-1 text-sm border border-gray-300 rounded-md"
                                    placeholder="개월"
                                  />
                                  <span className="ml-1 text-xs text-gray-500">
                                    개월
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="text-xs text-gray-500">
                              만료일:{" "}
                              {editExpiredAt ? formatDate(editExpiredAt) : "-"}
                            </div>

                            <div className="flex space-x-2 mt-1">
                              <button
                                onClick={() => handleUpdateExpiredAt(member.id)}
                                className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-md hover:bg-green-200"
                              >
                                저장
                              </button>
                              <button
                                onClick={() => {
                                  setEditingMemberId(null);
                                  setEditExpiredAt("");
                                }}
                                className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
                              >
                                취소
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="flex items-center cursor-pointer hover:text-pink-600"
                            onClick={() => handleStartEditExpiredAt(member)}
                          >
                            {formatDate(member.expired_at)}
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 ml-1 text-gray-400"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          {member.status === "pending" && (
                            <button
                              onClick={() =>
                                handleUpdateStatus(member.id, "active")
                              }
                              className="px-2 py-1 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                              승인
                            </button>
                          )}
                          {member.status === "active" && (
                            <button
                              onClick={() =>
                                handleUpdateStatus(member.id, "cancelled")
                              }
                              className="px-2 py-1 text-xs font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                            >
                              해지
                            </button>
                          )}
                          {(member.status === "expired" ||
                            member.status === "cancelled") && (
                            <button
                              onClick={() =>
                                handleUpdateStatus(member.id, "active")
                              }
                              className="px-2 py-1 text-xs font-medium text-white bg-pink-600 rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                            >
                              활성화
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 UI 추가 */}
          {members.length > 0 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    전체 <span className="font-medium">{totalCount}</span> 건 중{" "}
                    <span className="font-medium">
                      {(currentPage - 1) * itemsPerPage + 1}
                    </span>
                    -
                    <span className="font-medium">
                      {Math.min(currentPage * itemsPerPage, totalCount)}
                    </span>{" "}
                    표시
                  </p>
                </div>
                <div>
                  <nav
                    className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                    aria-label="Pagination"
                  >
                    <button
                      onClick={goToPrevPage}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === 1
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      <span className="sr-only">이전</span>
                      <svg
                        className="h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>

                    {/* 페이지 번호 버튼 */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      // 현재 페이지 주변의 페이지 번호만 표시
                      let pageNum;
                      if (totalPages <= 5) {
                        // 전체 페이지가 5개 이하면 모든 페이지 표시
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        // 현재 페이지가 앞쪽이면 1~5 표시
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        // 현재 페이지가 뒤쪽이면 마지막 5개 표시
                        pageNum = totalPages - 4 + i;
                      } else {
                        // 그 외에는 현재 페이지 중심으로 2개씩 표시
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === pageNum
                              ? "z-10 bg-pink-50 border-pink-500 text-pink-600"
                              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === totalPages
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      <span className="sr-only">다음</span>
                      <svg
                        className="h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>

              {/* 모바일용 페이지네이션 */}
              <div className="flex items-center justify-between w-full sm:hidden">
                <button
                  onClick={goToPrevPage}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    currentPage === 1
                      ? "text-gray-300 bg-gray-50 cursor-not-allowed"
                      : "text-gray-700 bg-white hover:bg-gray-50"
                  }`}
                >
                  이전
                </button>
                <div className="text-sm text-gray-700">
                  <span className="font-medium">{currentPage}</span> /{" "}
                  {totalPages} 페이지
                </div>
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    currentPage === totalPages
                      ? "text-gray-300 bg-gray-50 cursor-not-allowed"
                      : "text-gray-700 bg-white hover:bg-gray-50"
                  }`}
                >
                  다음
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
