"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
import { Content } from "@/lib/supabase";
import Plyr from "plyr";
import "plyr/dist/plyr.css";

export default function WatchVideo() {
  const router = useRouter();
  const params = useParams();
  const videoKey = params.videoKey as string;
  const videoRef = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [playerInitialized, setPlayerInitialized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 모바일 여부 확인
  useEffect(() => {
    const checkMobile = () => {
      const userAgent =
        typeof window.navigator === "undefined" ? "" : navigator.userAgent;
      const mobile = Boolean(
        userAgent.match(
          /Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i
        )
      );
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const user = getCurrentUser();

    if (!user) {
      router.push("/login");
      return;
    }

    fetchContent();
  }, [router, videoKey]);

  useEffect(() => {
    if (content && videoRef.current && !playerInitialized) {
      // YouTube 영상 ID 추출
      const youtubeId = extractYoutubeId(content.youtube_url);

      if (!youtubeId) {
        setError("영상 정보를 가져올 수 없습니다.");
        return;
      }

      // Plyr 초기화 - YouTube로 바로 이동 방지 옵션 추가
      const player = new Plyr(videoRef.current, {
        // @ts-expect-error - provider 속성은 Plyr에서 사용하지만 타입 정의에 없음
        provider: "youtube",
        playsInline: true,
        fullscreen: { enabled: true, fallback: true, iosNative: true },
        youtube: {
          cc_load_policy: 0,
          hl: "ko", // 인터페이스 언어
          rel: 0,
          modestbranding: 1, // YouTube 로고 최소화
          disablekb: 1, // 키보드 단축키 비활성화
          origin: window.location.origin, // 도메인 설정으로 제어권 유지
          playsinline: 1, // iOS에서 인라인 재생
          showinfo: 0, // 영상 정보 표시 안함
          iv_load_policy: 3, // 주석 비활성화
          controls: isMobile ? 1 : 2, // 모바일에서는 항상 컨트롤 표시
          noCookie: true, // 쿠키 없이 로드
          loop: 0, // 반복 재생 비활성화
          fs: 0, // YouTube 전체 화면 버튼 비활성화 (Plyr 전체 화면 사용)
          start: 0, // 시작 시간 지정
          enablejsapi: 1, // API 활성화
          color: "white", // 플레이어 색상 (빨간색 YouTube 색상 숨김)
        },
      });

      // 설정 변경 방지
      player.on("ready", () => {
        const ytIframe = document.querySelector(".plyr__video-embed iframe");
        if (ytIframe) {
          // 유튜브 직접 접근 방지를 위한 속성 추가
          (ytIframe as HTMLIFrameElement).setAttribute(
            "sandbox",
            "allow-same-origin allow-scripts allow-forms allow-presentation"
          );

          // iframe 내부 클릭 이벤트 방지
          const iframeDocument = (ytIframe as HTMLIFrameElement)
            .contentDocument;
          if (iframeDocument) {
            try {
              // 스타일 추가 시도
              const style = iframeDocument.createElement("style");
              style.textContent = `
                .ytp-title { display: none !important; }
                .ytp-youtube-button { display: none !important; }
                .ytp-show-cards-title { display: none !important; }
                .ytp-pause-overlay { display: none !important; }
                .ytp-chrome-top-buttons { display: none !important; }
              `;
              iframeDocument.head.appendChild(style);
            } catch (e) {
              console.log("iframe 수정 불가:", e);
            }
          }

          // 출처(referrer) 정보 제한 및 iframe 파라미터 추가
          (ytIframe as HTMLIFrameElement).setAttribute(
            "referrerpolicy",
            "no-referrer"
          );
        }

        // CSS를 사용하여 YouTube 로고와 제목 숨기기
        const style = document.createElement("style");
        style.textContent = `
          .plyr__video-embed iframe {
            pointer-events: none; /* iframe 내부 클릭 방지 */
          }
          .plyr--youtube .plyr__video-embed iframe {
            z-index: 1; /* z-index 조정 */
          }
          /* 컨트롤바 위에 투명한 오버레이 추가 */
          .plyr--youtube .plyr__video-embed::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 50px; /* 컨트롤바 위쪽만 덮기 */
            z-index: 2;
          }
        `;
        document.head.appendChild(style);
      });

      // 오른쪽 클릭 비활성화
      if (player.elements.container) {
        player.elements.container.addEventListener("contextmenu", (e) => {
          e.preventDefault();
          return false;
        });
      }

      // 플레이어 이벤트 방지
      player.on("enterfullscreen", () => {
        const ytIframe = document.querySelector(".plyr__video-embed iframe");
        if (ytIframe) {
          (ytIframe as HTMLIFrameElement).style.pointerEvents = "none";
        }
      });

      setPlayerInitialized(true);

      // 시청 로그 기록
      logVideoWatch(content.id);

      return () => {
        player.destroy();
      };
    }
  }, [content, playerInitialized, isMobile]);

  const fetchContent = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("contents")
        .select("*")
        .eq("video_key", videoKey)
        .eq("visible", true)
        .single();

      if (error) throw error;

      if (!data) {
        setError("콘텐츠를 찾을 수 없습니다.");
        return;
      }

      setContent(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "콘텐츠를 가져오는 중 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  const extractYoutubeId = (url: string) => {
    const regex =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const logVideoWatch = async (contentId: string) => {
    try {
      const user = getCurrentUser();

      if (!user) return;

      await supabase.from("watch_logs").insert([
        {
          member_id: user.id,
          content_id: contentId,
          watched_at: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error("시청 기록 저장 중 오류:", error);
    }
  };

  const handleBack = () => {
    router.push("/videos");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-red-50 p-4 rounded-md mb-4 max-w-md w-full">
          <p className="text-sm text-red-600">{error}</p>
        </div>
        <button
          onClick={handleBack}
          className="text-indigo-600 hover:text-indigo-800"
        >
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-gray-500 mb-4">콘텐츠를 찾을 수 없습니다.</p>
        <button
          onClick={handleBack}
          className="text-indigo-600 hover:text-indigo-800"
        >
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  const youtubeId = extractYoutubeId(content.youtube_url);

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-2 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <button
            onClick={handleBack}
            className="mr-4 text-gray-600 hover:text-gray-900"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 010 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          <div className="flex items-center">
            <div className="w-12 sm:w-16 mr-2 relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/rena-pilates-logo.png"
                alt="리나 필라테스"
                width={75}
                height={25}
                className="w-full h-auto object-contain filter drop-shadow-sm logo-hover"
              />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 truncate flex-1">
              {content.title}
            </h2>
          </div>
        </div>

        <div className="bg-white rounded-lg overflow-hidden shadow-sm mb-6">
          <div
            className={`relative ${
              isMobile ? "pt-[56.25%]" : "aspect-w-16 aspect-h-9"
            }`}
          >
            {youtubeId ? (
              <div
                ref={videoRef}
                data-plyr-provider="youtube"
                data-plyr-embed-id={youtubeId}
                className={`${
                  isMobile ? "absolute top-0 left-0 w-full h-full" : ""
                }`}
              ></div>
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-200">
                <p className="text-gray-500">영상을 로드할 수 없습니다.</p>
              </div>
            )}
          </div>

          <div className="p-4">
            <p className="text-gray-500">{content.description}</p>
            <p className="mt-2 text-xs text-gray-400">
              등록일: {new Date(content.created_at).toLocaleDateString("ko-KR")}{" "}
              <span>
                {new Date(content.created_at).toLocaleTimeString("ko-KR", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
