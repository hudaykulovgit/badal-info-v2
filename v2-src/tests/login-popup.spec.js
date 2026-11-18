import { expect, test } from "@playwright/test";

test("sign-in is hidden until either login button is pressed, then closes and returns focus", async ({ page }) => {
  await page.setViewportSize({ width: 1500, height: 900 });
  await page.goto("/");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("radio", { name: "Администратор" })).toHaveCount(0);
  const headerButton = page.getByRole("button", { name: "Кириш", exact: true });
  await headerButton.click();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("radio", { name: "Администратор" })).toBeChecked();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(headerButton).toBeFocused();
  const heroButton = page.getByRole("button", { name: "Тизимга кириш", exact: true });
  await heroButton.click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Ёпиш" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(heroButton).toBeFocused();
});

test("Russian and mobile login open the same role picker", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "RU", exact: true }).click();
  await page.getByRole("button", { name: "Войти", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Вход в систему" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Прототип: ключ и пароль не запрашиваются.", { exact: false })).toBeVisible();
  await dialog.getByRole("radio", { name: "Кузатувчи" }).check();
  await expect(dialog.getByRole("button", { name: "OneID орқали кириш" })).toBeVisible();
  await dialog.getByRole("button", { name: "Закрыть" }).click();
  await expect(dialog).toHaveCount(0);
});
