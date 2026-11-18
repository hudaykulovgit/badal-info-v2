import { expect, test } from "@playwright/test";

test("expense entries belong to their organisation and the organ selects currency", async ({ page }) => {
  await page.setViewportSize({ width: 1500, height: 900 });
  await page.goto("/");
  await page.getByRole("button", { name: "Кириш", exact: true }).click();
  await page.getByRole("button", { name: "IM ID орқали кириш" }).click();
  await page.getByRole("button", { name: "Рўйхат", exact: true }).click();
  const sections = page.locator("section").filter({ has: page.getByLabel("Тартиб рақами") });
  const first = sections.first();
  const orgNames = first.getByLabel("Халқаро ташкилот", { exact: true });
  const count = await orgNames.count();
  await first.getByRole("textbox", { name: "Харажат моддаси", exact: true }).first().fill("4221000");
  await expect(orgNames).toHaveCount(count);
  await page.getByRole("button", { name: "Чиқиш" }).click();
  await page.getByRole("button", { name: "Кириш", exact: true }).click();
  await page.getByRole("radio", { name: /Масъул давлат органи/ }).check();
  await page.getByRole("dialog").locator("select").selectOption("Ўзбекистон Республикаси Олий Мажлиси Сенати");
  await page.getByRole("button", { name: "УзАСБО калити орқали кириш" }).click();
  await page.getByRole("button", { name: "Рўйхат", exact: true }).click();
  const row = page.getByRole("row").filter({ hasText: "4221000" });
  const currency = row.getByRole("combobox");
  await currency.selectOption("EUR");
  await expect(currency).toHaveValue("EUR");
  await page.getByRole("button", { name: "Молиялаштириш таҳлили", exact: true }).click();
  await page.getByRole("button", { name: "Рўйхат", exact: true }).click();
  await expect(page.getByRole("row").filter({ hasText: "4221000" }).getByRole("combobox")).toHaveValue("EUR");
});

for (const [role, login] of [
  ["Администратор", "IM ID орқали кириш"],
  ["Масъул давлат органи", "УзАСБО калити орқали кириш"],
]) {
  test(`registry users tab is disabled for ${role}`, async ({ page }) => {
    await page.setViewportSize({ width: 1500, height: 900 });
    await page.goto("/");
    await page.getByRole("button", { name: "Кириш", exact: true }).click();
    await page.getByRole("radio", { name: new RegExp(role) }).check();
    await page.getByRole("button", { name: login }).click();
    await page.getByRole("button", { name: "Рўйхат", exact: true }).click();
    const organizations = page.getByRole("tab", { name: "Ташкилотлар" });
    const users = page.getByRole("tab", { name: "Фойдаланувчилар" });
    await expect(organizations).toHaveAttribute("aria-selected", "true");
    await expect(users).toBeDisabled();
    await organizations.focus();
    await page.keyboard.press("ArrowRight");
    await expect(organizations).toHaveAttribute("aria-selected", "true");
  });
}
