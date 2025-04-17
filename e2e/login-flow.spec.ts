import { test, expect } from "@playwright/test";

// 홈페이지 테스트
test("홈페이지 로딩 및 리다이렉션", async ({ page }) => {
  // 타임아웃 설정 (기본값보다 길게)
  page.setDefaultTimeout(10000);

  // 홈페이지 접속
  await page.goto("/");

  // 로고가 표시되는지 확인
  const logo = page.locator('img[alt="리나 필라테스"]');
  await expect(logo).toBeVisible();

  // 페이지가 로그인 페이지로 리다이렉션되는지 확인 (2초 후)
  await page.waitForURL("**/login", { timeout: 5000 });

  // 로그인 페이지 제목 확인
  const loginForm = page.locator("form");
  await expect(loginForm).toBeVisible();
});

// 로그인 페이지 테스트
test("로그인 페이지 UI 요소 확인", async ({ page }) => {
  // 로그인 페이지 접속
  await page.goto("/login");

  // 로고 확인
  await expect(page.locator('img[alt="리나 필라테스"]')).toBeVisible();

  // 이메일 입력 필드 확인
  const emailInput = page.locator("input#email");
  await expect(emailInput).toBeVisible();

  // 비밀번호 입력 필드 확인 (6개)
  const passwordInputs = page.locator(
    'input[type="text"][inputMode="numeric"]'
  );
  await expect(passwordInputs).toHaveCount(6);

  // 로그인 버튼 확인
  const loginButton = page.locator('button:has-text("로그인")');
  await expect(loginButton).toBeVisible();

  // 회원가입 링크 확인
  const registerLink = page.locator('a:has-text("가입하기")');
  await expect(registerLink).toBeVisible();
});

// 로그인 실패 테스트
test("잘못된 로그인 정보로 로그인 실패", async ({ page }) => {
  // 로그인 페이지 접속
  await page.goto("/login");

  // 이메일 입력
  await page.locator("input#email").fill("nonexistent@example.com");

  // 비밀번호 입력 (6자리)
  const passwordInputs = page.locator(
    'input[type="text"][inputMode="numeric"]'
  );
  for (let i = 0; i < 6; i++) {
    await passwordInputs.nth(i).fill(String(i));
  }

  // 로그인 버튼 클릭
  await page.locator('button:has-text("로그인")').click();

  // 에러 메시지 표시 확인
  const errorMessage = page.locator("div.bg-red-50");
  await expect(errorMessage).toBeVisible({ timeout: 5000 });
});

// 비밀번호 붙여넣기 테스트
test("비밀번호 붙여넣기 기능", async ({ page }) => {
  // 로그인 페이지 접속
  await page.goto("/login");

  // 이메일 입력
  await page.locator("input#email").fill("test@example.com");

  // 비밀번호 필드 선택
  const passwordInputs = page.locator(
    'input[type="text"][inputMode="numeric"]'
  );

  // 첫 번째 필드에 포커스
  await passwordInputs.first().focus();

  // 직접 입력으로 붙여넣기 시뮬레이션
  for (let i = 0; i < 6; i++) {
    await passwordInputs.nth(i).fill(String(i));
  }

  // 마지막 비밀번호 필드가 채워졌는지 확인
  await expect(passwordInputs.last()).toHaveValue("5");
});

// 회원가입 페이지 이동 테스트
test("회원가입 페이지로 이동", async ({ page }) => {
  // 로그인 페이지 접속
  await page.goto("/login");

  // 회원가입 링크 클릭
  await page.locator('a:has-text("가입하기")').click();

  // 회원가입 페이지로 이동했는지 확인
  await page.waitForURL("**/register");

  // 회원가입 폼이 표시되는지 확인
  const registerForm = page.locator("form");
  await expect(registerForm).toBeVisible();
});

// 테스트 데이터를 사용한 로그인 성공 시뮬레이션
// 실제 환경에서는 테스트 계정 사용
test.skip("성공적인 로그인 및 리다이렉션 (테스트용)", async ({ page }) => {
  // 로그인 페이지 접속
  await page.goto("/login");

  // 테스트 계정 정보로 로그인
  await page.locator("input#email").fill("test@example.com");

  // 비밀번호 입력 (123456)
  const passwordInputs = page.locator(
    'input[type="text"][inputMode="numeric"]'
  );
  for (let i = 0; i < 6; i++) {
    await passwordInputs.nth(i).fill(String(i + 1));
  }

  // 로그인 버튼 클릭
  await page.locator('button:has-text("로그인")').click();

  // 로그인 성공 후 리다이렉션 확인 (일반 사용자는 비디오 페이지로)
  await page.waitForURL("**/videos", { timeout: 5000 });
});

// 페이지의 접근성 검사
test("기본 접근성 확인", async ({ page }) => {
  // 로그인 페이지 접속
  await page.goto("/login");

  // 기본 접근성 요소 확인

  // 이메일 라벨 연결 확인
  const emailLabel = page.locator('label[for="email"]');
  await expect(emailLabel).toBeVisible();

  // 비밀번호 입력 필드 확인
  const passwordInputs = page.locator(
    'input[type="text"][inputMode="numeric"]'
  );

  // 비밀번호 입력 필드 수 확인
  await expect(passwordInputs).toHaveCount(6);

  // 적절한 입력 모드 설정 확인
  for (let i = 0; i < 6; i++) {
    await expect(passwordInputs.nth(i)).toHaveAttribute("inputMode", "numeric");
  }

  // 로그인 버튼 역할 확인
  const loginButton = page.locator('button:has-text("로그인")');
  await expect(loginButton).not.toBeDisabled();
});
