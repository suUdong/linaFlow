"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
import { Content } from "@/lib/supabase";

export default function Videos() {
  const router = useRouter();
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  useEffect(() => {
    const user = getCurrentUser();

    if (!user) {
      router.push("/login");
      return;
    }

    fetchContents();
  }, [router, sortOrder]);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-2 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-3">
          <h2 className="text-2xl font-bold text-gray-900">LinaFlow 콘텐츠</h2>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:space-x-4">
            <select
              value={sortOrder}
              onChange={handleSortChange}
              className="border rounded p-2 text-sm w-full sm:w-auto"
            >
              <option value="newest">최신순</option>
              <option value="oldest">오래된순</option>
            </select>

            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 hover:text-gray-900 w-full sm:w-auto text-center sm:text-left"
            >
              로그아웃
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 p-4 rounded-md mb-6">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {contents.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <p className="text-gray-500 text-center">
              등록된 콘텐츠가 없습니다.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {contents.map((content) => (
              <div
                key={content.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/watch/${content.video_key}`)}
              >
                <div className="pt-[56.25%] relative bg-gray-200">
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
                </div>

                <div className="p-4">
                  <h3 className="text-lg font-medium text-gray-900 truncate">
                    {content.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                    {content.description}
                  </p>
                  <p className="mt-2 text-xs text-gray-400">
                    {new Date(content.created_at).toLocaleDateString("ko-KR")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
