import { expect, test } from "@playwright/test";

test.describe("Hebrew Keyboard Mapper", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("page loads with correct heading", async ({ page }) => {
    await expect(page.getByTestId("heading")).toBeVisible();
    await expect(page.getByTestId("heading")).toContainText("Hebrew Keyboard Mapper");
  });

  test("hebrew input textarea is present", async ({ page }) => {
    const input = page.getByTestId("hebrew-input");
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute("dir", "rtl");
  });

  test("single character mapping: א → t", async ({ page }) => {
    const input = page.getByTestId("hebrew-input");
    await input.fill("א");
    await expect(page.getByTestId("english-output")).toHaveText("t");
  });

  test("multi-character sequence: שלום → akuo", async ({ page }) => {
    const input = page.getByTestId("hebrew-input");
    await input.fill("שלום");
    await expect(page.getByTestId("english-output")).toHaveText("akuo");
  });

  test("non-Hebrew characters pass through unchanged: א1 b → t1 b", async ({ page }) => {
    const input = page.getByTestId("hebrew-input");
    await input.fill("א1 b");
    await expect(page.getByTestId("english-output")).toHaveText("t1 b");
  });

  test("all 27 mapped Hebrew characters", async ({ page }) => {
    const input = page.getByTestId("hebrew-input");
    const output = page.getByTestId("english-output");

    const pairs: [string, string][] = [
      ["ק", "e"],
      ["ר", "r"],
      ["א", "t"],
      ["ט", "y"],
      ["ו", "u"],
      ["ן", "i"],
      ["ם", "o"],
      ["פ", "p"],
      ["ש", "a"],
      ["ד", "s"],
      ["ג", "d"],
      ["כ", "f"],
      ["ע", "g"],
      ["י", "h"],
      ["ח", "j"],
      ["ל", "k"],
      ["ך", "l"],
      ["ף", ";"],
      ["ז", "z"],
      ["ס", "x"],
      ["ב", "c"],
      ["ה", "v"],
      ["נ", "b"],
      ["מ", "n"],
      ["צ", "m"],
      ["ת", ","],
      ["ץ", "."],
    ];

    for (const [hebrew, english] of pairs) {
      await input.fill(hebrew);
      await expect(output).toHaveText(english);
    }
  });

  test("copy button is disabled when input is empty", async ({ page }) => {
    const copyButton = page.getByTestId("copy-button");
    await expect(copyButton).toBeDisabled();
  });

  test("copy button is enabled when input has content", async ({ page }) => {
    await page.getByTestId("hebrew-input").fill("שלום");
    const copyButton = page.getByTestId("copy-button");
    await expect(copyButton).toBeEnabled();
  });

  test('copy button shows "Copied!" feedback after click', async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.getByTestId("hebrew-input").fill("שלום");
    const copyButton = page.getByTestId("copy-button");
    await copyButton.click();
    await expect(copyButton).toContainText("Copied!");
    // After 2s it reverts
    await expect(copyButton).toContainText("Copy to Clipboard", { timeout: 4000 });
  });

  test("english output has aria-live attribute", async ({ page }) => {
    await expect(page.getByTestId("english-output")).toHaveAttribute("aria-live", "polite");
  });
});
