import { expect, test } from "@playwright/test";

test("staff list shows the UzASBO phone of each authorized employee", async ({ page }) => {
  await page.setViewportSize({ width: 1500, height: 900 });
  await page.goto("/");
  await page.getByRole("button", { name: "Кириш", exact: true }).click();
  await page.getByRole("button", { name: "IM ID орқали кириш" }).click();
  await page.getByRole("button", { name: "Ваколат берилган ходимлар рўйхати" }).click();
  await expect(page.getByRole("columnheader", { name: "Телефон (УзАСБО)" })).toBeVisible();
  await expect(page.locator('a[href^="tel:+998"]').first()).toBeVisible();
});
