"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { checkAdminAccess } from "@/lib/auth";
import AdminNavigation from "@/components/AdminNavigation";
import AdminHeader from "@/components/AdminHeader";

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    pendingMembers: 0,
    totalContents: 0,
    totalWatchLogs: 0,
    uniqueViewers: 0,
    uniqueContentViews: 0,
    databaseSize: "계산 중...",
    databaseLimit: "500 MB (무료)",
    storageSize: "계산 중...",
    storageLimit: "1 GB (무료)",
    databaseUsagePercent: "0",
    storageUsagePercent: "0",
    deploymentCount: "계산 중...",
    deploymentLimit: "100회/일 (무료)",
    deploymentUsagePercent: "0",
    visitorStats: {
      today: 0,
      week: 0,
      month: 0,
    },
    bandwidthUsage: "0 MB",
    bandwidthLimit: "100 GB/월 (무료)",
    bandwidthUsagePercent: "0",
  });

  useEffect(() => {
    checkAdminStatus();
    fetchStats();
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

  const fetchStats = async () => {
    try {
      setLoading(true);

      // 전체 회원 수 조회
      const { count: totalMembers, error: memberError } = await supabase
        .from("members")
        .select("*", { count: "exact", head: true });

      if (memberError) throw memberError;

      // 활성 회원 수 조회
      const { count: activeMembers, error: activeMemberError } = await supabase
        .from("members")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      if (activeMemberError) throw activeMemberError;

      // 대기 회원 수 조회
      const { count: pendingMembers, error: pendingMemberError } =
        await supabase
          .from("members")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending");

      if (pendingMemberError) throw pendingMemberError;

      // 콘텐츠 수 조회
      const { count: totalContents, error: contentError } = await supabase
        .from("contents")
        .select("*", { count: "exact", head: true });

      if (contentError) throw contentError;

      // 시청 로그 수 조회
      const { count: totalWatchLogs, error: watchLogError } = await supabase
        .from("watch_logs")
        .select("*", { count: "exact", head: true });

      if (watchLogError) throw watchLogError;

      // 회원별 시청 통계 계산
      const { data: watchLogData, error: watchLogDataError } = await supabase
        .from("watch_logs")
        .select("member_id, content_id")
        .order("watched_at", { ascending: false });

      if (watchLogDataError) throw watchLogDataError;

      // 고유 시청자 수 계산
      const uniqueViewers = new Set();
      watchLogData?.forEach((log) => uniqueViewers.add(log.member_id));
      const uniqueViewerCount = uniqueViewers.size;

      // 고유 콘텐츠 시청 수 계산
      const uniqueContentViews = new Set();
      watchLogData?.forEach((log) => uniqueContentViews.add(log.content_id));
      const uniqueContentViewCount = uniqueContentViews.size;

      // Supabase 사용량 계산 (실제 값을 얻기 위해서는 Supabase Admin API 필요)
      // 여기서는 예시적으로 데이터 크기를 계산
      let databaseSizeEstimate = 0;

      // 각 테이블의 대략적인 데이터 크기 계산 (예시)
      databaseSizeEstimate += (totalMembers || 0) * 0.5; // 회원당 약 0.5KB
      databaseSizeEstimate += (totalContents || 0) * 1; // 콘텐츠당 약 1KB
      databaseSizeEstimate += (totalWatchLogs || 0) * 0.1; // 로그당 약 0.1KB

      const databaseSizeInMB = (databaseSizeEstimate / 1024).toFixed(2);
      const databaseUsagePercent =
        Math.min(databaseSizeEstimate / 5120, 1) * 100; // 500MB 기준

      const storageEstimate = (totalContents || 0) * 0.5; // 콘텐츠당 약 0.5MB (썸네일 등)
      const storageUsagePercent = Math.min(storageEstimate / 1024, 1) * 100; // 1GB 기준

      // Vercel 방문자 통계 추정치 계산 (실제로는 Vercel Analytics API를 사용해야 함)
      // 이 예시에서는 시청 로그 기반으로 단순 추정
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      lastWeek.setHours(0, 0, 0, 0);

      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      lastMonth.setHours(0, 0, 0, 0);

      // 최근 방문자 통계 조회 (실제로는 다른 방식으로 수집해야 함)
      const { data: recentLogs, error: recentLogsError } = await supabase
        .from("watch_logs")
        .select("watched_at, member_id")
        .order("watched_at", { ascending: false });

      if (recentLogsError) throw recentLogsError;

      // 날짜별 방문자 통계 계산
      const todayVisitors = new Set();
      const weekVisitors = new Set();
      const monthVisitors = new Set();

      recentLogs?.forEach((log) => {
        const logDate = new Date(log.watched_at);
        if (logDate >= today) {
          todayVisitors.add(log.member_id);
        }
        if (logDate >= lastWeek) {
          weekVisitors.add(log.member_id);
        }
        if (logDate >= lastMonth) {
          monthVisitors.add(log.member_id);
        }
      });

      // 대역폭 사용량 추정 (콘텐츠 시청 기반)
      // 평균 영상 시청은 약 50MB의 대역폭을 사용한다고 가정
      const estimatedBandwidth = ((totalWatchLogs || 0) * 50).toFixed(2);
      const bandwidthUsagePercent =
        Math.min(((totalWatchLogs || 0) * 50) / (100 * 1024), 1) * 100; // 100GB 기준

      // Vercel 배포 횟수는 더미 데이터로 설정 (실제로는 Vercel API를 통해 가져와야 함)
      const deploymentCount = 23;
      const deploymentUsagePercent = (deploymentCount / 100) * 100; // 100회/일 기준

      // 통계 업데이트
      setStats({
        ...stats,
        totalMembers: totalMembers || 0,
        activeMembers: activeMembers || 0,
        pendingMembers: pendingMembers || 0,
        totalContents: totalContents || 0,
        totalWatchLogs: totalWatchLogs || 0,
        uniqueViewers: uniqueViewerCount,
        uniqueContentViews: uniqueContentViewCount,
        databaseSize: `${databaseSizeInMB} MB`,
        databaseUsagePercent: databaseUsagePercent.toFixed(1),
        storageSize: `${storageEstimate.toFixed(2)} MB`,
        storageUsagePercent: storageUsagePercent.toFixed(1),
        deploymentCount: deploymentCount.toString(),
        deploymentUsagePercent: deploymentUsagePercent.toFixed(1),
        visitorStats: {
          today: todayVisitors.size,
          week: weekVisitors.size,
          month: monthVisitors.size,
        },
        bandwidthUsage: `${estimatedBandwidth} MB`,
        bandwidthLimit: "100 GB/월 (무료)",
        bandwidthUsagePercent: bandwidthUsagePercent.toFixed(1),
      });
    } catch (err: unknown) {
      console.error("통계 가져오기 오류:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "통계 정보를 가져오는 중 오류가 발생했습니다.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-pink-50 to-white">
        <p className="text-red-500">관리자 권한이 없습니다.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-pink-50 to-white">
        <div className="flex flex-col items-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-pink-600 border-t-transparent"></div>
          <p className="text-pink-600 mt-3">로딩 중...</p>
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
            currentPath="/admin/dashboard"
            pendingCount={stats.pendingMembers}
          />
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">시스템 대시보드</h2>
        </div>

        {error && (
          <div className="bg-red-50 p-4 rounded-md mb-6 border border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            시스템 개요
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-pink-500 rounded-md p-3">
                    <svg
                      className="h-6 w-6 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        총 회원
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {stats.totalMembers}
                        </div>
                        <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                          <span className="sr-only">증가</span>
                          <span className="text-xs bg-green-100 px-1.5 py-0.5 rounded-full">
                            활성: {stats.activeMembers}
                          </span>
                          {stats.pendingMembers > 0 && (
                            <span className="ml-1 text-xs bg-pink-100 px-1.5 py-0.5 rounded-full text-pink-800">
                              대기: {stats.pendingMembers}
                            </span>
                          )}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-pink-500 rounded-md p-3">
                    <svg
                      className="h-6 w-6 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        콘텐츠
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {stats.totalContents}
                        </div>
                        <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                          <span className="sr-only">증가</span>
                          <span className="text-xs bg-pink-100 px-1.5 py-0.5 rounded-full text-pink-800">
                            조회수: {stats.totalWatchLogs}
                          </span>
                          <span className="ml-1 text-xs bg-pink-100 px-1.5 py-0.5 rounded-full text-pink-800">
                            고유 시청자: {stats.uniqueViewers}
                          </span>
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-pink-500 rounded-md p-3">
                    <svg
                      className="h-6 w-6 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        접속 현황
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          실시간
                        </div>
                        <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                          <span className="sr-only">통계</span>
                          <a
                            href="https://vercel.com/analytics"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs bg-pink-100 px-1.5 py-0.5 rounded-full text-pink-800"
                          >
                            Vercel Analytics
                          </a>
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Supabase 사용량
          </h3>
          <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-100">
            <ul className="divide-y divide-gray-200">
              <li>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <p className="font-medium text-pink-600 truncate">
                        데이터베이스 사용량
                      </p>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {stats.databaseSize} / {stats.databaseLimit}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-pink-600 h-2.5 rounded-full"
                      style={{ width: `${stats.databaseUsagePercent}%` }}
                    ></div>
                  </div>
                </div>
              </li>
              <li>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <p className="font-medium text-pink-600 truncate">
                        스토리지 사용량
                      </p>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {stats.storageSize} / {stats.storageLimit}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-pink-600 h-2.5 rounded-full"
                      style={{ width: `${stats.storageUsagePercent}%` }}
                    ></div>
                  </div>
                </div>
              </li>
              <li>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      <a
                        href="https://app.supabase.com/project/_/settings/billing/usage"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-pink-600 hover:text-pink-500"
                      >
                        Supabase 대시보드에서 더 자세한 사용량 확인 →
                      </a>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Vercel 사용량
          </h3>
          <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-100">
            <ul className="divide-y divide-gray-200">
              <li>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <p className="font-medium text-pink-600 truncate">
                        배포 횟수
                      </p>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {stats.deploymentCount} / {stats.deploymentLimit}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-pink-600 h-2.5 rounded-full"
                      style={{ width: `${stats.deploymentUsagePercent}%` }}
                    ></div>
                  </div>
                </div>
              </li>
              <li>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <p className="font-medium text-pink-600 truncate">
                        대역폭 사용량
                      </p>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {stats.bandwidthUsage} / {stats.bandwidthLimit}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-pink-600 h-2.5 rounded-full"
                      style={{ width: `${stats.bandwidthUsagePercent}%` }}
                    ></div>
                  </div>
                </div>
              </li>
              <li>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <p className="font-medium text-pink-600 truncate">
                        방문자 통계
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-pink-100 text-pink-800">
                        오늘: {stats.visitorStats.today}
                      </p>
                      <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-pink-200 text-pink-800">
                        주간: {stats.visitorStats.week}
                      </p>
                      <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-pink-300 text-pink-800">
                        월간: {stats.visitorStats.month}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
              <li>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      <a
                        href="https://vercel.com/dashboard/usage"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-pink-600 hover:text-pink-500"
                      >
                        Vercel 대시보드에서 더 자세한 사용량 확인 →
                      </a>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            무료 플랜 제한사항
          </h3>
          <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-100">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Supabase 무료 플랜 (Free)
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                프로젝트 사용량이 다음 제한을 초과하면 유료 플랜으로
                업그레이드해야 합니다.
              </p>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    데이터베이스 크기
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    500 MB
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    스토리지 크기
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    1 GB
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    소셜 로그인
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    제한 없음
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    자동 백업
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    주 1회 (유료 플랜: 일간 백업)
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-4">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Vercel 무료 플랜 (Hobby)
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                프로젝트 사용량이 다음 제한을 초과하면 유료 플랜으로
                업그레이드해야 합니다.
              </p>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    배포 횟수
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    100회/일
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    서버리스 함수
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    12개 리전, 함수당 최대 10초 실행
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    이미지 최적화
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    1,000 이미지/월
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">분석</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    웹 분석 최대 15일 보관
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    방문자 통계
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    무료 플랜 방문자 데이터 15일 보관, 유료 플랜 30~90일 보관
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">대역폭</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    무료 플랜 100GB/월, 초과 시 제한될 수 있음
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
