import { expect, test } from "@playwright/test";

test("admin approvals module shows demo 2027 requests", async ({ page }) => {
  await page.setViewportSize({ width: 1500, height: 900 });
  await page.goto("/");
  await page.getByRole("button", { name: "Кириш", exact: true }).click();
  await page.getByRole("button", { name: "IM ID орқали кириш" }).click();
  await page.getByRole("button", { name: "Кейинги йил учун бюджет сўровини юбориш модули" }).click();
  await expect(page.getByText("Жиноят полицияси халқаро ташкилоти (Интерпол)")).toBeVisible();
  await expect(page.getByText("Кўриб чиқиладиган сўров йўқ")).toHaveCount(0);
  await expect(page.getByRole("columnheader", { name: "Инвойс 2027" })).toHaveCount(1);
  await expect(page.getByRole("columnheader", { name: "Кросс-курс" })).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Тасдиқлаш" })).toHaveCount(0);
  const interpol = page.getByRole("row").filter({ hasText: "Жиноят полицияси халқаро ташкилоти" });
  await expect(interpol).toContainText("72 000");
  await expect(interpol).toContainText("1,25");
  await interpol.getByRole("button", { name: "Келишиш" }).click();
  await expect(interpol).toContainText("Келишилган");
  await expect(interpol.getByRole("button", { name: "Келишиш" })).toHaveCount(0);
  await page.getByRole("button", { name: "Бюджет сўрови", exact: true }).click();
  await page.getByRole("button", { name: /^Ички ишлар вазирлиги ·/ }).click();
  await expect(page.getByRole("row").filter({ hasText: "Жиноят полицияси халқаро ташкилоти" })).toContainText("келишилган");
});

test("return requires a reason and keeps it with the request", async ({ page }) => {
  await page.setViewportSize({ width: 1500, height: 900 });
  await page.goto("/");
  await page.getByRole("button", { name: "Кириш", exact: true }).click();
  await page.getByRole("button", { name: "IM ID орқали кириш" }).click();
  await page.getByRole("button", { name: "Кейинги йил учун бюджет сўровини юбориш модули" }).click();
  const row = page.getByRole("row").filter({ hasText: "Жиноят полицияси халқаро ташкилоти" });
  await row.getByRole("button", { name: "Қайтариш" }).click();
  await expect(row.getByRole("button", { name: "Қайтариш" })).toBeDisabled();
  await row.getByLabel("Қайтариш сабаби").fill("Инвойсни текширинг");
  await row.getByRole("button", { name: "Қайтариш" }).click();
  await expect(row).toContainText("Қайтарилган");
  await expect(row).toContainText("Инвойсни текширинг");
});
