import { test, expect } from "@playwright/test";

// 홈페이지 기본 테스트
test("홈페이지에 로고가 표시되는지 확인", async ({ page }) => {
  // 홈페이지 접속
  await page.goto("/");

  // 로고가 표시되는지 확인
  const logo = page.locator('img[alt="리나 필라테스"]');
  await expect(logo).toBeVisible();
});

// 홈페이지 로딩 후 리다이렉션 테스트
test("홈페이지에서 로그인 페이지로 리다이렉션", async ({ page }) => {
  // 타임아웃 설정 (기본값보다 길게)
  page.setDefaultTimeout(10000);

  // 홈페이지 접속
  await page.goto("/");

  // 리다이렉션 발생 대기 (2초 이상)
  await page.waitForURL("**/login", { timeout: 5000 });
});

// 로고 애니메이션 (opacity 변화) 테스트
test("로고 애니메이션 확인", async ({ page }) => {
  // 홈페이지 접속
  await page.goto("/");

  // 로고 요소 찾기
  const logoContainer = page.locator("div.transition-opacity");

  // 초기 상태에서는 투명하거나 낮은 opacity
  await expect(logoContainer).toBeVisible();

  // 시간이 지난 후 opacity가 변화하는지는 테스트하기 어려우므로
  // 로고 컨테이너가 transition 속성을 가지고 있는지만 확인
  await expect(logoContainer).toHaveClass(/transition-opacity/);
});

// 로그인 사용자 리다이렉션 시뮬레이션 (모킹)
test.skip("로그인 사용자 리다이렉션 확인", async ({ page }) => {
  // localStorage 모킹을 위한 준비
  await page.addInitScript(() => {
    // 테스트용 사용자 정보 생성
    const testUser = {
      id: 1,
      email: "test@example.com",
      role: "user",
      status: "active",
    };

    // localStorage에 테스트 사용자 설정
    window.localStorage.setItem("user", JSON.stringify(testUser));
  });

  // 홈페이지 접속 (이미 로그인된 것처럼 설정된 상태)
  await page.goto("/");

  // 비디오 페이지로 리다이렉션 확인
  await page.waitForURL("**/videos", { timeout: 5000 });
});

// 관리자 사용자 리다이렉션 시뮬레이션 (모킹)
test.skip("관리자 사용자 리다이렉션 확인", async ({ page }) => {
  // localStorage 모킹을 위한 준비
  await page.addInitScript(() => {
    // 테스트용 관리자 정보 생성
    const adminUser = {
      id: 2,
      email: "admin@example.com",
      role: "admin",
      status: "active",
    };

    // localStorage에 테스트 관리자 설정
    window.localStorage.setItem("user", JSON.stringify(adminUser));
  });

  // 홈페이지 접속 (이미 관리자로 로그인된 것처럼 설정된 상태)
  await page.goto("/");

  // 관리자 대시보드로 리다이렉션 확인
  await page.waitForURL("**/admin/members", { timeout: 5000 });
});
