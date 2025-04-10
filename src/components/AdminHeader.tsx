import { useRouter } from "next/navigation";

interface AdminHeaderProps {
  title?: string;
}

export default function AdminHeader({
  title = "RenaFlow 관리자",
}: AdminHeaderProps) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <div className="bg-pink-600 shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium text-pink-600 bg-white rounded-md hover:bg-pink-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-400 shadow-sm transition-colors"
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}
