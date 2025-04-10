import { useRouter } from "next/navigation";

interface AdminNavigationProps {
  currentPath: string;
  pendingCount: number;
}

export default function AdminNavigation({
  currentPath,
  pendingCount,
}: AdminNavigationProps) {
  const router = useRouter();

  return (
    <div className="w-full overflow-x-auto pb-2">
      <nav className="flex space-x-2 md:space-x-4 bg-white p-2 rounded-lg shadow-sm min-w-max">
        <button
          onClick={() => router.push("/admin/dashboard")}
          className={`px-2 md:px-3 py-2 rounded-md hover:bg-gray-50 transition-colors whitespace-nowrap text-sm md:text-base ${
            currentPath === "/admin/dashboard"
              ? "text-pink-600 font-medium bg-pink-50"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          대시보드
        </button>
        <button
          onClick={() => router.push("/admin/members")}
          className={`px-2 md:px-3 py-2 rounded-md hover:bg-gray-50 transition-colors whitespace-nowrap text-sm md:text-base relative ${
            currentPath === "/admin/members"
              ? "text-pink-600 font-medium bg-pink-50"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          회원 관리
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-pink-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => router.push("/admin/contents")}
          className={`px-2 md:px-3 py-2 rounded-md hover:bg-gray-50 transition-colors whitespace-nowrap text-sm md:text-base ${
            currentPath === "/admin/contents"
              ? "text-pink-600 font-medium bg-pink-50"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          콘텐츠 관리
        </button>
        <button
          onClick={() => router.push("/admin/coupons")}
          className={`px-2 md:px-3 py-2 rounded-md hover:bg-gray-50 transition-colors whitespace-nowrap text-sm md:text-base ${
            currentPath === "/admin/coupons"
              ? "text-pink-600 font-medium bg-pink-50"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          쿠폰 관리
        </button>
        <button
          onClick={() => router.push("/admin/approval-settings")}
          className={`px-2 md:px-3 py-2 rounded-md hover:bg-gray-50 transition-colors whitespace-nowrap text-sm md:text-base ${
            currentPath === "/admin/approval-settings"
              ? "text-pink-600 font-medium bg-pink-50"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          가입승인설정
        </button>
        <button
          onClick={() => router.push("/admin/guide")}
          className={`px-2 md:px-3 py-2 rounded-md hover:bg-gray-50 transition-colors whitespace-nowrap text-sm md:text-base ${
            currentPath === "/admin/guide"
              ? "text-pink-600 font-medium bg-pink-50"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          관리 가이드
        </button>
      </nav>
    </div>
  );
}
