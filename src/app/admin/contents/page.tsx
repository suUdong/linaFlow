"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Content } from "@/lib/supabase";
import { checkAdminAccess } from "@/lib/auth";
import AdminNavigation from "@/components/AdminNavigation";
import AdminHeader from "@/components/AdminHeader";
import { extractYoutubeId, getVideoDetails } from "@/lib/youtube";

export default function AdminContents() {
  const router = useRouter();
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingContentId, setEditingContentId] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [showAddContentForm, setShowAddContentForm] = useState(false);

  // 페이지네이션 관련 상태 추가
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // 선택된 콘텐츠 관리를 위한 상태 추가
  const [selectedContents, setSelectedContents] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [bulkAction, setBulkAction] = useState<"visible" | "hidden" | "">("");

  const [newContent, setNewContent] = useState({
    title: "",
    description: "",
    youtube_url: "",
    video_key: "",
    visible: true,
    category: "",
    duration: "",
    formatted_duration: "",
  });

  // 카테고리 목록
  const categories = [
    "기초",
    "중급",
    "고급",
    "스트레칭",
    "코어",
    "전신",
    "상체",
    "하체",
    "기타",
  ];

  useEffect(() => {
    checkAdminStatus();
    fetchContents();
    fetchPendingCount();
  }, [currentPage, itemsPerPage]);

  // 체크박스 전체 선택/해제 처리 함수
  useEffect(() => {
    if (selectAll) {
      const allContentIds = contents.map((content) => content.id);
      setSelectedContents(allContentIds);
    } else if (selectedContents.length === contents.length) {
      // 모든 항목이 선택된 상태에서 selectAll이 false로 변경되면 선택 해제
      setSelectedContents([]);
    }
  }, [selectAll, contents]);

  // 선택된 콘텐츠 체크박스 처리 함수
  const handleSelectContent = (id: string) => {
    setSelectedContents((prev) => {
      const isSelected = prev.includes(id);
      if (isSelected) {
        return prev.filter((contentId) => contentId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // 전체 선택/해제 토글 함수
  const handleSelectAllToggle = () => {
    setSelectAll(!selectAll);
  };

  // 일괄 상태 변경 액션 선택 함수
  const handleBulkActionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBulkAction(e.target.value as "visible" | "hidden" | "");
  };

  // 일괄 상태 변경 적용 함수
  const handleApplyBulkAction = async () => {
    if (!bulkAction || selectedContents.length === 0) return;

    try {
      setLoading(true);
      const isVisible = bulkAction === "visible";

      // 선택된 모든 콘텐츠의 상태 변경
      const { error } = await supabase
        .from("contents")
        .update({ visible: isVisible })
        .in("id", selectedContents);

      if (error) throw error;

      // 성공 후 목록 새로고침 및 상태 초기화
      fetchContents();
      setSelectedContents([]);
      setSelectAll(false);
      setBulkAction("");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "콘텐츠 일괄 상태 변경 중 오류가 발생했습니다.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const checkAdminStatus = () => {
    // 관리자 권한 체크
    const hasAccess = checkAdminAccess();
    setIsAdmin(hasAccess);

    // 관리자가 아닌 경우 로그인 페이지로 리디렉션
    if (!hasAccess) {
      router.push("/login");
    }
  };

  const fetchContents = async () => {
    try {
      setLoading(true);

      // 전체 콘텐츠 수 조회
      const { count: totalItems, error: countError } = await supabase
        .from("contents")
        .select("*", { count: "exact", head: true });

      if (countError) throw countError;

      // 페이지네이션 계산
      const total = totalItems || 0;
      setTotalCount(total);
      setTotalPages(Math.ceil(total / itemsPerPage));

      // 현재 페이지 데이터 조회
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const { data, error } = await supabase
        .from("contents")
        .select("*")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      setContents(data || []);

      // 페이지 변경 시 선택된 항목 초기화
      setSelectedContents([]);
      setSelectAll(false);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "콘텐츠를 가져오는 중 오류가 발생했습니다.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 표시 개수 변경 핸들러
  const handleItemsPerPageChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newItemsPerPage = parseInt(e.target.value);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // 페이지 수 변경 시 첫 페이지로 이동
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

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setNewContent((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setNewContent((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const generateVideoKey = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewContent((prev) => ({ ...prev, video_key: result }));
  };

  const handleURLChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const youtubeUrl = e.target.value;
    setNewContent({ ...newContent, youtube_url: youtubeUrl });

    // YouTube URL이 변경되었을 때 비디오 정보 가져오기
    if (youtubeUrl) {
      const videoId = extractYoutubeId(youtubeUrl);
      if (videoId) {
        try {
          const details = await getVideoDetails(videoId);
          if (details) {
            setNewContent((prev) => ({
              ...prev,
              duration: details.duration || "",
              formatted_duration: details.formattedDuration || "",
            }));
          }
        } catch (error) {
          console.error("비디오 세부 정보를 가져오는 중 오류 발생:", error);
        }
      }
    }
  };

  const handleEditContent = (content: Content) => {
    setEditingContentId(content.id);
    setIsEditing(true);
    setNewContent({
      title: content.title,
      description: content.description || "",
      youtube_url: content.youtube_url,
      video_key: content.video_key,
      visible: content.visible,
      category: content.category || "",
      duration: content.duration || "",
      formatted_duration: content.formatted_duration || "",
    });

    // 폼 영역으로 부드럽게 스크롤
    const formElement = document.getElementById("content-form");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleCancelEdit = () => {
    setEditingContentId(null);
    setIsEditing(false);
    setNewContent({
      title: "",
      description: "",
      youtube_url: "",
      video_key: "",
      visible: true,
      category: "",
      duration: "",
      formatted_duration: "",
    });
    setError("");
  };

  const handleSubmitContent = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // 간단한 유효성 검사
      if (
        !newContent.title ||
        !newContent.youtube_url ||
        !newContent.video_key
      ) {
        setError("필수 항목을 모두 입력해주세요.");
        return;
      }

      // YouTube URL 검증
      const youtubeId = extractYoutubeId(newContent.youtube_url);
      if (!youtubeId) {
        setError("유효한 YouTube URL을 입력해주세요.");
        return;
      }

      if (isEditing && editingContentId) {
        // 수정 모드: 기존 콘텐츠 업데이트
        const { error: updateError } = await supabase
          .from("contents")
          .update({
            title: newContent.title,
            description: newContent.description,
            youtube_url: newContent.youtube_url,
            video_key: newContent.video_key,
            visible: newContent.visible,
            category: newContent.category || null,
            duration: newContent.duration || null,
            formatted_duration: newContent.formatted_duration || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingContentId);

        if (updateError) throw updateError;
      } else {
        // 추가 모드: 중복 비디오 키 확인
        const { data: existingKey, error: keyCheckError } = await supabase
          .from("contents")
          .select("id")
          .eq("video_key", newContent.video_key)
          .maybeSingle();

        if (keyCheckError) throw keyCheckError;

        if (existingKey) {
          setError("이미 사용 중인 비디오 키입니다. 다시 생성해주세요.");
          return;
        }

        // 새 콘텐츠 추가
        const { error: insertError } = await supabase.from("contents").insert([
          {
            title: newContent.title,
            description: newContent.description,
            youtube_url: newContent.youtube_url,
            video_key: newContent.video_key,
            visible: newContent.visible,
            category: newContent.category || null,
            duration: newContent.duration || null,
            formatted_duration: newContent.formatted_duration || null,
          },
        ]);

        if (insertError) throw insertError;
      }

      // 폼 초기화
      setNewContent({
        title: "",
        description: "",
        youtube_url: "",
        video_key: "",
        visible: true,
        category: "",
        duration: "",
        formatted_duration: "",
      });
      setIsEditing(false);
      setEditingContentId(null);

      // 목록 다시 로드
      fetchContents();

      setError("");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : isEditing
          ? "콘텐츠 수정 중 오류가 발생했습니다."
          : "콘텐츠 추가 중 오류가 발생했습니다.";
      setError(errorMessage);
    }
  };

  const handleToggleVisibility = async (
    id: string,
    currentVisibility: boolean
  ) => {
    try {
      const { error } = await supabase
        .from("contents")
        .update({ visible: !currentVisibility })
        .eq("id", id);

      if (error) throw error;

      // 목록 다시 로드
      fetchContents();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "콘텐츠 상태 변경 중 오류가 발생했습니다.";
      setError(errorMessage);
    }
  };

  const handleDeleteContent = async (id: string) => {
    if (!confirm("정말로 이 콘텐츠를 삭제하시겠습니까?")) {
      return;
    }

    try {
      const { error } = await supabase.from("contents").delete().eq("id", id);

      if (error) throw error;

      // 목록 다시 로드
      fetchContents();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "콘텐츠 삭제 중 오류가 발생했습니다.";
      setError(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-pink-50 to-white">
        <div className="flex flex-col items-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-pink-600 border-t-transparent"></div>
          <p className="text-pink-600 mt-3">콘텐츠 정보 로딩 중...</p>
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
        <div className="flex flex-col md:flex-row justify-between mb-6 items-start md:items-center gap-4">
          <AdminNavigation
            currentPath="/admin/contents"
            pendingCount={pendingCount}
          />
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            콘텐츠 관리
            <span className="ml-2 text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              총 {totalCount}개
            </span>
          </h2>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 p-4 mb-6 rounded-lg">
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
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* 콘텐츠 추가 섹션 - 접을 수 있는 형태로 변경 */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-8 border border-gray-100">
          <button
            onClick={() => setShowAddContentForm(!showAddContentForm)}
            className="w-full flex items-center justify-between text-lg font-semibold text-gray-900 py-2"
          >
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-pink-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              신규 콘텐츠 추가
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 text-gray-500 transition-transform ${
                showAddContentForm ? "rotate-180" : ""
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

          {(showAddContentForm || isEditing) && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h3 className="text-lg font-semibold mb-6 text-gray-900 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2 text-pink-600"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  {isEditing ? (
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  ) : (
                    <path
                      fillRule="evenodd"
                      d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  )}
                </svg>
                {isEditing ? "콘텐츠 수정" : "새 콘텐츠 추가"}
              </h3>

              <form
                onSubmit={handleSubmitContent}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <div className="md:col-span-2">
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    제목 *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={newContent.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    설명
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={newContent.description}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label
                    htmlFor="youtube_url"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    YouTube URL *
                  </label>
                  <input
                    type="text"
                    id="youtube_url"
                    name="youtube_url"
                    value={newContent.youtube_url}
                    onChange={handleURLChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                    required
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>

                <div>
                  <label
                    htmlFor="video_key"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    비디오 키 *
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      id="video_key"
                      name="video_key"
                      value={newContent.video_key}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                      required
                      readOnly={isEditing}
                    />
                    {!isEditing && (
                      <button
                        type="button"
                        onClick={generateVideoKey}
                        className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 whitespace-nowrap"
                      >
                        키 생성
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="category"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    카테고리
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={newContent.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                  >
                    <option value="">카테고리 선택</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    id="visible"
                    name="visible"
                    type="checkbox"
                    checked={newContent.visible}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="visible"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    콘텐츠 노출 (체크 해제시 비공개)
                  </label>
                </div>

                <div className="mt-4">
                  <label
                    htmlFor="formatted_duration"
                    className="block text-sm font-medium text-gray-700"
                  >
                    재생 시간
                  </label>
                  <div className="mt-1 flex items-center">
                    <input
                      type="text"
                      id="formatted_duration"
                      name="formatted_duration"
                      value={newContent.formatted_duration}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                      placeholder="00:00 (자동으로 가져옵니다)"
                      readOnly
                    />
                    <input
                      type="hidden"
                      id="duration"
                      name="duration"
                      value={newContent.duration}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    YouTube URL이 올바르게 입력되면 자동으로 가져옵니다
                  </p>
                </div>

                <div className="md:col-span-2 flex justify-end space-x-3">
                  {isEditing && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                    >
                      취소
                    </button>
                  )}
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => setShowAddContentForm(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 shadow-sm transition-colors"
                    >
                      취소
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-pink-600 rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 shadow-sm transition-colors"
                  >
                    {isEditing ? "콘텐츠 수정" : "콘텐츠 추가"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* 일괄 작업 컨트롤러 */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4 border border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center">
              <span className="text-sm text-gray-700 mr-4">
                {selectedContents.length > 0
                  ? `${selectedContents.length}개 선택됨`
                  : "항목을 선택하세요"}
              </span>

              {selectedContents.length > 0 && (
                <div className="flex items-center space-x-2">
                  <select
                    value={bulkAction}
                    onChange={handleBulkActionChange}
                    className="rounded-md border-gray-300 shadow-sm focus:border-pink-300 focus:ring focus:ring-pink-200 focus:ring-opacity-50 text-sm"
                  >
                    <option value="">작업 선택</option>
                    <option value="visible">공개로 변경</option>
                    <option value="hidden">비공개로 변경</option>
                  </select>
                  <button
                    onClick={handleApplyBulkAction}
                    disabled={!bulkAction || selectedContents.length === 0}
                    className={`px-3 py-1 text-xs font-medium text-white rounded-md focus:outline-none ${
                      !bulkAction || selectedContents.length === 0
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-pink-600 hover:bg-pink-700 focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                    }`}
                  >
                    적용
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <label htmlFor="itemsPerPage" className="text-sm text-gray-700">
                표시:
              </label>
              <select
                id="itemsPerPage"
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="rounded-md border-gray-300 shadow-sm focus:border-pink-300 focus:ring focus:ring-pink-200 focus:ring-opacity-50 text-sm"
              >
                <option value="5">5개</option>
                <option value="10">10개</option>
                <option value="20">20개</option>
                <option value="50">50개</option>
                <option value="100">100개</option>
              </select>
            </div>
          </div>
        </div>

        {/* 콘텐츠 목록 */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-3 py-3 text-left text-xs font-medium text-gray-500"
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAllToggle}
                        className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                      />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    콘텐츠 정보
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    카테고리
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    비디오 키
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    상태
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
                {contents.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      등록된 콘텐츠가 없습니다.
                    </td>
                  </tr>
                ) : (
                  contents.map((content) => {
                    const youtubeId = extractYoutubeId(content.youtube_url);
                    return (
                      <tr key={content.id} className="hover:bg-gray-50">
                        <td className="px-3 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedContents.includes(content.id)}
                            onChange={() => handleSelectContent(content.id)}
                            className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-16 w-24 bg-gray-200 rounded overflow-hidden">
                              {youtubeId ? (
                                <img
                                  src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
                                  alt={content.title}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <svg
                                  className="h-full w-full text-gray-400"
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                                </svg>
                              )}
                            </div>
                            <div className="ml-4 max-w-lg">
                              <div className="text-sm font-medium text-gray-900 line-clamp-1">
                                {content.title}
                              </div>
                              {content.description && (
                                <div className="text-sm text-gray-500 line-clamp-2">
                                  {content.description}
                                </div>
                              )}
                              <div className="text-xs text-gray-400 mt-1">
                                {new Date(
                                  content.created_at
                                ).toLocaleDateString("ko-KR", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {content.category ? (
                            <span className="px-2 py-1 rounded-full bg-pink-100 text-pink-800 text-xs">
                              {content.category}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">
                              미분류
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                            {content.video_key}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {content.visible ? (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              공개
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                              비공개
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() =>
                                handleToggleVisibility(
                                  content.id,
                                  content.visible
                                )
                              }
                              className={`px-2 py-1 text-xs font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                content.visible
                                  ? "bg-gray-600 hover:bg-gray-700 focus:ring-gray-500"
                                  : "bg-green-600 hover:bg-green-700 focus:ring-green-500"
                              }`}
                            >
                              {content.visible ? "숨기기" : "공개"}
                            </button>
                            <button
                              onClick={() => handleEditContent(content)}
                              className="px-2 py-1 text-xs font-medium text-white bg-pink-600 rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleDeleteContent(content.id)}
                              className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              삭제
                            </button>
                            <a
                              href={`/watch/${content.video_key}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              보기
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-white border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-700">
                  {totalCount === 0 ? (
                    <span>0개 항목</span>
                  ) : (
                    <span>
                      {(currentPage - 1) * itemsPerPage + 1}–
                      {Math.min(currentPage * itemsPerPage, totalCount)} /{" "}
                      {totalCount}개 항목
                    </span>
                  )}
                </div>

                <nav className="flex justify-center">
                  <ul className="flex space-x-1">
                    <li>
                      <button
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                        className={`px-3 py-1 rounded-md text-sm ${
                          currentPage === 1
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        처음
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`px-3 py-1 rounded-md text-sm ${
                          currentPage === 1
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        이전
                      </button>
                    </li>

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      // 5페이지 이상일 때 현재 페이지 중심으로 표시
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else {
                        const startPage = Math.max(1, currentPage - 2);
                        const endPage = Math.min(totalPages, startPage + 4);
                        pageNum = startPage + i;

                        // 범위를 벗어나면 표시하지 않음
                        if (pageNum > endPage) return null;
                      }

                      return (
                        <li key={pageNum}>
                          <button
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-3 py-1 rounded-md text-sm ${
                              currentPage === pageNum
                                ? "bg-pink-600 text-white"
                                : "text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            {pageNum}
                          </button>
                        </li>
                      );
                    }).filter(Boolean)}

                    <li>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1 rounded-md text-sm ${
                          currentPage === totalPages
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        다음
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => handlePageChange(totalPages)}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1 rounded-md text-sm ${
                          currentPage === totalPages
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        마지막
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
