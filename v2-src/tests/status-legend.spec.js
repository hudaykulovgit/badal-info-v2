import { expect, test } from "@playwright/test";

test("each payment status in the legend has exactly one dot", async ({ page }) => {
  await page.setViewportSize({ width: 1500, height: 900 });
  await page.goto("/");
  await page.getByRole("button", { name: "Кириш", exact: true }).click();
  await page.getByRole("button", { name: "IM ID орқали кириш" }).click();
  const header = page.getByRole("heading", { name: "Мажбуриятлар рўйхати" }).locator("..");
  for (const label of ["Тўланмаган", "Ўтказилган", "Тўланган"]) {
    const item = header.locator("span.inline-flex").filter({ hasText: label }).first();
    await expect(item.locator('span[aria-hidden="true"]')).toHaveCount(1);
  }
});
