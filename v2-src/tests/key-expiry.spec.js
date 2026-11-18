import { expect, test } from "@playwright/test";

test("staff page has no manual revoke and shows key validity", async ({ page }) => {
  await page.setViewportSize({ width: 1500, height: 900 });
  await page.goto("/");
  await page.getByRole("button", { name: "Кириш", exact: true }).click();
  await page.getByRole("button", { name: "IM ID орқали кириш" }).click();
  await page.getByRole("button", { name: "Ваколат берилган ходимлар рўйхати" }).click();
  await expect(page.getByRole("columnheader", { name: "Калит амал қилиш муддати" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Тўхтатиш|Тиклаш/ })).toHaveCount(0);
  await expect(page.locator('tr[data-key-state="blocked"]').first()).toContainText("Блокланган");
});

test("organ with an expired key cannot sign in", async ({ page }) => {
  await page.setViewportSize({ width: 1500, height: 900 });
  await page.goto("/");
  await page.getByRole("button", { name: "Кириш", exact: true }).click();
  await page.getByRole("radio", { name: /Масъул давлат органи/ }).check();
  await page.getByRole("dialog").locator("select").selectOption("Ички ишлар вазирлиги");
  await expect(page.getByRole("alert")).toContainText("автоматик блокланган");
  await expect(page.getByRole("button", { name: "УзАСБО калити орқали кириш" })).toBeDisabled();
});
