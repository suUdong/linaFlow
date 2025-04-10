// YouTube API 관련 함수 모음

// YouTube API 키 (실제 사용 시에는 환경 변수로 관리하는 것이 좋습니다)
// 이 키는 임시로, 실제 API 키로 교체해야 합니다
const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || "";

/**
 * 유튜브 URL에서 영상 ID를 추출합니다.
 */
export const extractYoutubeId = (url: string): string | null => {
  const regex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

/**
 * 유튜브 썸네일 URL을 생성합니다.
 */
export const getYoutubeThumbnail = (youtubeUrl: string): string | null => {
  const youtubeId = extractYoutubeId(youtubeUrl);
  if (!youtubeId) return null;

  // 다양한 품질의 썸네일 중 하나 사용
  return `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`;
};

/**
 * ISO 8601 형식의 시간(PT1H2M3S)을 읽기 쉬운 형식(1:02:03)으로 변환합니다.
 */
export const formatDuration = (isoDuration: string): string => {
  // PT1H2M3S 형식에서 시간(H), 분(M), 초(S) 추출
  const hourMatch = isoDuration.match(/(\d+)H/);
  const minuteMatch = isoDuration.match(/(\d+)M/);
  const secondMatch = isoDuration.match(/(\d+)S/);

  const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
  const minutes = minuteMatch ? parseInt(minuteMatch[1]) : 0;
  const seconds = secondMatch ? parseInt(secondMatch[1]) : 0;

  // 시간이 있는 경우: 1:02:03 형식, 없는 경우: 2:03 형식
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }
};

/**
 * YouTube API를 사용하여 영상 정보를 가져옵니다.
 */
export const getVideoDetails = async (videoId: string) => {
  if (!API_KEY) {
    console.warn("YouTube API 키가 설정되지 않았습니다.");
    return null;
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=contentDetails,snippet,statistics&key=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.status}`);
    }

    const data = await response.json();

    if (data.items && data.items.length > 0) {
      const videoDetails = data.items[0];

      return {
        duration: videoDetails.contentDetails?.duration || "PT0S", // ISO 8601 형식
        formattedDuration: formatDuration(
          videoDetails.contentDetails?.duration || "PT0S"
        ),
        title: videoDetails.snippet?.title || "",
        description: videoDetails.snippet?.description || "",
        publishedAt: videoDetails.snippet?.publishedAt || "",
        viewCount: videoDetails.statistics?.viewCount || 0,
      };
    }

    return null;
  } catch (error) {
    console.error("YouTube 정보 가져오기 오류:", error);
    return null;
  }
};
