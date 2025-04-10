"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
import { Content } from "@/lib/supabase";
import {
  extractYoutubeId,
  getYoutubeThumbnail,
  getVideoDetails,
} from "@/lib/youtube";

// no-scrollbar 클래스를 위한 스타일 룰
// 이 방식은 클라이언트 컴포넌트에서만 작동합니다
if (typeof window !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `;
  document.head.appendChild(style);
}

export default function Videos() {
  const router = useRouter();
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categories, setCategories] = useState<string[]>([]);
  const [categorizedContents, setCategorizedContents] = useState<
    Record<string, Content[]>
  >({});
  const [videoDetails, setVideoDetails] = useState<
    Record<
      string,
      {
        formattedDuration?: string;
        title?: string;
        description?: string;
        publishedAt?: string;
        viewCount?: number;
      }
    >
  >({});

  useEffect(() => {
    const user = getCurrentUser();

    if (!user) {
      router.push("/login");
      return;
    }

    fetchContents();

    // 이미지 로딩 테스트
    const testImg = document.createElement("img");
    testImg.onload = () => console.log("테스트 이미지 로드 성공");
    testImg.onerror = () => console.error("테스트 이미지 로드 실패");
    testImg.src = "https://img.youtube.com/vi/iiLgKKJJVy4/default.jpg";
  }, [router, sortOrder, selectedCategory]);

  // YouTube 비디오 상세 정보 가져오기
  useEffect(() => {
    const fetchVideoDetails = async () => {
      if (contents.length === 0) return;

      const newDetails: Record<
        string,
        {
          formattedDuration?: string;
          title?: string;
          description?: string;
          publishedAt?: string;
          viewCount?: number;
        }
      > = {};

      for (const content of contents) {
        const videoId = extractYoutubeId(content.youtube_url);
        if (!videoId) continue;

        try {
          const details = await getVideoDetails(videoId);
          if (details) {
            newDetails[videoId] = details;
          }
        } catch (error) {
          console.error(`Video ${videoId} details 가져오기 오류:`, error);
        }
      }

      setVideoDetails(newDetails);
    };

    fetchVideoDetails();
  }, [contents]);

  // 카테고리로 콘텐츠 분류하기
  useEffect(() => {
    if (contents.length === 0) return;

    // 모든 카테고리 추출 (중복 제거)
    const uniqueCategories = Array.from(
      new Set(
        contents
          .map((content) => content.category || "미분류")
          .filter((category) => category)
      )
    );
    setCategories(uniqueCategories);

    // 카테고리별로 콘텐츠 그룹화
    const grouped: Record<string, Content[]> = {};

    // 선택된 카테고리에 따라 다르게 처리
    if (selectedCategory === "all") {
      // '전체' 선택 시 카테고리별로 그룹화
      contents.forEach((content) => {
        const category = content.category || "미분류";
        if (!grouped[category]) {
          grouped[category] = [];
        }
        grouped[category].push(content);
      });
    } else {
      // 특정 카테고리 선택 시 해당 카테고리만 표시
      const filteredContents = contents.filter(
        (content) => (content.category || "미분류") === selectedCategory
      );
      grouped[selectedCategory] = filteredContents;
    }

    setCategorizedContents(grouped);
  }, [contents, selectedCategory]);

  const fetchContents = async () => {
    try {
      setLoading(true);

      let query = supabase.from("contents").select("*").eq("visible", true);

      if (sortOrder === "newest") {
        query = query.order("created_at", { ascending: false });
      } else {
        query = query.order("created_at", { ascending: true });
      }

      const { data, error } = await query;

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

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOrder(e.target.value as "newest" | "oldest");
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/login");
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="py-4 px-2 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 영역 리디자인 */}
        <div className="flex flex-col mb-6">
          {/* 헤더 상단: 로고와 제목 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-14 sm:w-20 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/rena-pilates-logo.png"
                  alt="리나 필라테스"
                  width={90}
                  height={30}
                  className="w-full h-auto object-contain filter drop-shadow-sm logo-hover"
                />
              </div>
              <h2 className="ml-2 text-lg font-medium text-[#c99393]">
                콘텐츠 라이브러리
              </h2>
            </div>

            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 hover:text-[#c99393] transition-colors flex items-center gap-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span className="hidden sm:inline">로그아웃</span>
            </button>
          </div>

          {/* 헤더 하단: 필터 및 정렬 */}
          <div className="flex flex-row items-center justify-between">
            {/* 필터 탭 - 스크롤 가능한 탭으로 변경 */}
            <div className="overflow-x-auto no-scrollbar flex-grow max-w-[calc(100%-100px)]">
              <div className="flex space-x-2 pb-1">
                <button
                  onClick={() => handleCategoryChange("all")}
                  className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                    selectedCategory === "all"
                      ? "bg-[#c99393] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  전체
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleCategoryChange(category)}
                    className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                      selectedCategory === category
                        ? "bg-[#c99393] text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* 정렬 선택 */}
            <div className="ml-2">
              <select
                value={sortOrder}
                onChange={handleSortChange}
                className="border border-gray-200 rounded-full text-xs sm:text-sm shadow-sm p-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-[#c99393] focus:border-[#c99393] transition-all min-w-[80px]"
              >
                <option value="newest">최신순</option>
                <option value="oldest">오래된순</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 p-4 rounded-lg border border-red-100 mb-6">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {contents.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
              ></path>
            </svg>
            <p className="text-gray-500">등록된 콘텐츠가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(categorizedContents).map(
              ([category, contentsList]) => (
                <div key={category} className="mb-6">
                  <h2 className="text-base sm:text-lg font-semibold mb-3 text-gray-800 border-b pb-2 flex items-center">
                    <span className="mr-2 inline-block w-1.5 h-6 sm:w-2 sm:h-8 bg-[#c99393] rounded-lg"></span>
                    {category}
                    <span className="ml-2 text-xs sm:text-sm text-gray-500">
                      ({contentsList.length})
                    </span>
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                    {contentsList.map((content) => {
                      const thumbnailUrl = getYoutubeThumbnail(
                        content.youtube_url
                      );

                      return (
                        <div
                          key={content.id}
                          className="bg-white rounded-xl sm:rounded-2xl overflow-hidden card-shadow hover:translate-y-[-2px] transition-all duration-300 cursor-pointer group"
                          onClick={() =>
                            router.push(`/watch/${content.video_key}`)
                          }
                        >
                          <div className="pt-[56.25%] relative bg-gray-50 overflow-hidden">
                            {thumbnailUrl ? (
                              <div className="absolute inset-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                  src={thumbnailUrl}
                                  alt={content.title}
                                  referrerPolicy="no-referrer"
                                  loading="eager"
                                  onError={(e) => {
                                    console.error(
                                      "이미지 로딩 실패:",
                                      thumbnailUrl
                                    );
                                    // 이미지 로드 실패시 백업 이미지 시도
                                    const youtubeId = extractYoutubeId(
                                      content.youtube_url
                                    );
                                    if (youtubeId) {
                                      // 다른 썸네일 크기 시도
                                      e.currentTarget.src = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
                                    }
                                  }}
                                />
                                {/* 재생시간 표시 */}
                                {(() => {
                                  const youtubeId = extractYoutubeId(
                                    content.youtube_url
                                  );
                                  const details = youtubeId
                                    ? videoDetails[youtubeId]
                                    : null;
                                  return details?.formattedDuration ? (
                                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-1 py-0.5 rounded">
                                      {details.formattedDuration}
                                    </div>
                                  ) : null;
                                })()}
                                <div className="absolute inset-0 flex items-center justify-center group-hover:bg-black group-hover:bg-opacity-10 transition-all duration-300 z-10">
                                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all duration-500 shadow-lg">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-6 w-6 sm:h-8 sm:w-8 text-[#c99393]"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                                      />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center absolute inset-0">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-12 w-12 text-gray-400"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>

                          <div className="p-3 sm:p-5">
                            <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate">
                              {content.title}
                            </h3>
                            <p className="mt-1 text-xs sm:text-sm text-gray-500 line-clamp-2 h-8 sm:h-10">
                              {content.description}
                            </p>
                            <div className="mt-2 sm:mt-3 flex items-center justify-between">
                              <div className="flex items-center text-[10px] sm:text-xs text-gray-400">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-3 w-3 sm:h-4 sm:w-4 mr-1"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                                {new Date(
                                  content.created_at
                                ).toLocaleDateString("ko-KR")}
                              </div>
                              {/* 재생시간 (모바일에서도 표시) */}
                              <div className="flex items-center text-[10px] sm:text-xs text-gray-400">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-3 w-3 sm:h-4 sm:w-4 mr-1"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                {(() => {
                                  const youtubeId = extractYoutubeId(
                                    content.youtube_url
                                  );
                                  const details = youtubeId
                                    ? videoDetails[youtubeId]
                                    : null;
                                  return details?.formattedDuration || "00:00";
                                })()}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
