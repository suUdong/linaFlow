import { test, expect, devices } from "@playwright/test";

// 모바일 환경 설정
test.use({
  ...devices["iPhone 12"],
  viewport: { width: 390, height: 844 },
});

// 모바일에서 홈페이지 테스트
test("모바일에서 홈페이지 로딩", async ({ page }) => {
  await page.goto("/");

  // 로고가 표시되는지 확인
  const logo = page.locator('img[alt="리나 필라테스"]');
  await expect(logo).toBeVisible();

  // 모바일 화면에서 로고 크기가 적절한지 확인
  const logoBox = await logo.boundingBox();
  if (logoBox) {
    // 모바일에서는 로고 크기가 너무 크지 않아야 함
    expect(logoBox.width).toBeLessThanOrEqual(280);
    expect(logoBox.height).toBeLessThanOrEqual(280);
  }
});

// 모바일에서 로그인 페이지 테스트
test("모바일에서 로그인 페이지 UI", async ({ page }) => {
  await page.goto("/login");

  // 이메일 입력 필드 확인
  const emailInput = page.locator("input#email");
  await expect(emailInput).toBeVisible();

  // 비밀번호 입력 필드 확인 (모바일에서도 6개 필드가 모두 보이는지)
  const passwordInputs = page.locator(
    'input[type="text"][inputMode="numeric"]'
  );
  await expect(passwordInputs).toHaveCount(6);

  // 로그인 버튼이 화면에 맞게 표시되는지 확인
  const loginButton = page.locator('button:has-text("로그인")');
  await expect(loginButton).toBeVisible();

  // 버튼의 너비가 적절한지 확인 (화면 너비 이내)
  const buttonBox = await loginButton.boundingBox();
  const viewportSize = page.viewportSize();

  if (buttonBox && viewportSize) {
    // 버튼 너비가 화면 너비보다 작아야 함
    expect(buttonBox.width).toBeLessThan(viewportSize.width);
  }
});

// 모바일에서 비밀번호 입력 테스트
test("모바일에서 비밀번호 입력", async ({ page }) => {
  await page.goto("/login");

  // 이메일 입력
  await page.locator("input#email").fill("mobile@test.com");

  // 비밀번호 필드 선택
  const passwordInputs = page.locator(
    'input[type="text"][inputMode="numeric"]'
  );

  // 모바일에서 숫자 키패드가 뜨는지는 테스트하기 어려우므로
  // 입력 필드의 inputMode 속성 확인
  for (let i = 0; i < (await passwordInputs.count()); i++) {
    // inputMode="numeric" 또는 유사한 속성이 있는지 확인
    const inputMode = await passwordInputs.nth(i).getAttribute("inputMode");
    expect(inputMode === "numeric" || inputMode === "tel").toBeTruthy();
  }

  // 비밀번호 입력
  for (let i = 0; i < 6; i++) {
    await passwordInputs.nth(i).fill(String(i));
  }

  // 마지막 비밀번호 필드 확인
  await expect(passwordInputs.last()).toHaveValue("5");
});

// 모바일에서 회원가입 페이지 이동 테스트
test("모바일에서 회원가입 페이지로 이동", async ({ page }) => {
  await page.goto("/login");

  // 회원가입 링크 클릭
  await page.locator('a:has-text("가입하기")').click();

  // 회원가입 페이지로 이동했는지 확인
  await page.waitForURL("**/register");

  // 회원가입 폼이 표시되는지 확인
  const registerForm = page.locator("form");
  await expect(registerForm).toBeVisible();
});
