"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Content } from "@/lib/supabase";
import { checkAdminAccess } from "@/lib/auth";

export default function AdminContents() {
  const router = useRouter();
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingContentId, setEditingContentId] = useState<string | null>(null);

  const [newContent, setNewContent] = useState({
    title: "",
    description: "",
    youtube_url: "",
    video_key: "",
    visible: true,
  });

  useEffect(() => {
    checkAdminStatus();
    fetchContents();
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

  const fetchContents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("contents")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setContents(data || []);
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

  const extractYoutubeId = (url: string) => {
    const regex =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
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

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">관리자 권한이 없습니다.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">콘텐츠 관리</h2>

          <div className="flex space-x-4">
            <button
              onClick={() => router.push("/admin/members")}
              className="text-gray-600 hover:text-gray-900"
            >
              회원 관리
            </button>
            <button
              onClick={() => router.push("/admin/guide")}
              className="text-gray-600 hover:text-gray-900"
            >
              관리 가이드
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 p-4 rounded-md mb-6">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2">
            <div className="bg-white shadow overflow-hidden rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b">
                <h3 className="text-lg font-medium text-gray-900">
                  콘텐츠 목록
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  각 콘텐츠를 클릭하면 수정할 수 있습니다.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        제목
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
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        관리
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {contents.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-6 py-4 text-center text-sm text-gray-500"
                        >
                          등록된 콘텐츠가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      contents.map((content) => (
                        <tr
                          key={content.id}
                          className={`cursor-pointer hover:bg-gray-50 ${
                            editingContentId === content.id
                              ? "bg-indigo-50"
                              : ""
                          }`}
                          onClick={() => handleEditContent(content)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {content.title}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {content.video_key}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                content.visible
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {content.visible ? "공개" : "비공개"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div
                              className="flex space-x-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() =>
                                  handleToggleVisibility(
                                    content.id,
                                    content.visible
                                  )
                                }
                                className={
                                  content.visible
                                    ? "text-gray-600 hover:text-gray-900"
                                    : "text-green-600 hover:text-green-900"
                                }
                              >
                                {content.visible ? "비공개" : "공개"}
                              </button>
                              <button
                                onClick={() => handleDeleteContent(content.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                삭제
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div id="content-form">
            <div
              className={`bg-white rounded-lg shadow-sm overflow-hidden ${
                isEditing ? "border-2 border-indigo-400" : ""
              }`}
            >
              <div className="px-4 py-5 sm:px-6 border-b">
                <h3 className="text-lg font-medium text-gray-900">
                  {isEditing ? "콘텐츠 수정" : "콘텐츠 추가"}
                </h3>
                {isEditing && (
                  <p className="mt-1 text-sm text-indigo-600">
                    현재 수정 모드입니다. 변경 후 저장하거나 취소할 수 있습니다.
                  </p>
                )}
              </div>
              <div className="p-4">
                <form onSubmit={handleSubmitContent}>
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="title"
                        className="block text-sm font-medium text-gray-700"
                      >
                        제목 *
                      </label>
                      <input
                        type="text"
                        name="title"
                        id="title"
                        value={newContent.title}
                        onChange={handleInputChange}
                        className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="description"
                        className="block text-sm font-medium text-gray-700"
                      >
                        설명
                      </label>
                      <textarea
                        name="description"
                        id="description"
                        rows={3}
                        value={newContent.description}
                        onChange={handleInputChange}
                        className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="youtube_url"
                        className="block text-sm font-medium text-gray-700"
                      >
                        YouTube URL *
                      </label>
                      <input
                        type="url"
                        name="youtube_url"
                        id="youtube_url"
                        value={newContent.youtube_url}
                        onChange={handleInputChange}
                        className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="video_key"
                        className="block text-sm font-medium text-gray-700"
                      >
                        비디오 키 *
                        {isEditing && (
                          <span className="text-yellow-600 ml-1 text-xs">
                            (다른 영상과 중복될 수 없습니다)
                          </span>
                        )}
                      </label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <input
                          type="text"
                          name="video_key"
                          id="video_key"
                          value={newContent.video_key}
                          onChange={handleInputChange}
                          className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300"
                          required
                          readOnly={isEditing}
                        />
                        <button
                          type="button"
                          onClick={generateVideoKey}
                          disabled={isEditing}
                          className={`inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 sm:text-sm ${
                            isEditing
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:bg-gray-100"
                          }`}
                        >
                          생성
                        </button>
                      </div>
                      {isEditing && (
                        <p className="mt-1 text-xs text-gray-500">
                          수정 중에는 비디오 키를 변경할 수 없습니다.
                        </p>
                      )}
                    </div>

                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="visible"
                          name="visible"
                          type="checkbox"
                          checked={newContent.visible}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label
                          htmlFor="visible"
                          className="font-medium text-gray-700"
                        >
                          공개 상태
                        </label>
                        <p className="text-gray-500">
                          콘텐츠를 사용자에게 공개합니다.
                        </p>
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        className={`flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                          isEditing
                            ? "bg-indigo-600 hover:bg-indigo-700"
                            : "bg-green-600 hover:bg-green-700"
                        } focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                          isEditing
                            ? "focus:ring-indigo-500"
                            : "focus:ring-green-500"
                        }`}
                      >
                        {isEditing ? "저장" : "추가"}
                      </button>

                      {isEditing && (
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        >
                          취소
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
