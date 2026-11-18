import { expect, test } from "@playwright/test";

for (const [role, login] of [
  ["Администратор", "IM ID орқали кириш"],
  ["Масъул давлат органи", "УзАСБО калити орқали кириш"],
  ["Кузатувчи", "OneID орқали кириш"],
]) {
  test(`results is unavailable for ${role} on desktop and mobile`, async ({ page }) => {
    await page.setViewportSize({ width: 1500, height: 900 });
    await page.goto("/");
    await page.getByRole("button", { name: "Кириш", exact: true }).click();
    await page.getByRole("radio", { name: new RegExp(role) }).check();
    await page.getByRole("button", { name: login }).click();

    await expect(page.getByRole("button", { name: "Натижадорлик", exact: true })).toBeDisabled();
    await page.getByRole("button", { name: "Бюджет сўрови", exact: true }).click();
    await expect(page.getByRole("button", { name: "Бюджет сўрови", exact: true })).toHaveAttribute("aria-current", "page");

    await page.setViewportSize({ width: 390, height: 844 });
    const menu = page.locator("header select");
    await expect(menu.locator('option[value="results"]')).toHaveAttribute("disabled", "");
    await menu.selectOption("financing");
    await expect(menu).toHaveValue("financing");
  });
}
