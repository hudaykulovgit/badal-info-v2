import { expect, test } from "@playwright/test";

test("quarterly chart: confirmed view by default, switch to transferred", async ({ page }) => {
  await page.setViewportSize({ width: 1500, height: 900 });
  await page.goto("/");
  await page.getByRole("button", { name: "Кириш", exact: true }).click();
  await page.getByRole("button", { name: "IM ID орқали кириш" }).click();
  const panel = page.locator("section").filter({ has: page.getByRole("heading", { name: "Чораклар кесимида тўловлар" }) });
  await expect(panel).toContainText("Тасдиқланган (тўланган)");
  await expect(panel).toContainText("Ўтказилган (SWIFT)");
  await expect(panel).toContainText("намунавий SWIFT саналар");
  const chart = panel.getByRole("img", { name: /Чораклар бўйича тўланган суммалар/ });
  const chartLabel = await chart.getAttribute("aria-label");
  const values = [...chartLabel.matchAll(/чорак ([\d\s\u00a0]+) \$/g)].map((m) => Number(m[1].replace(/\s/g, "")));
  expect(values).toHaveLength(4);
  const paidFigure = page.getByText("Тўланган", { exact: true }).first().locator("..");
  const figureText = await paidFigure.innerText();
  const paid = Number(figureText.match(/([\d\s\u00a0]+) \$/)[1].replace(/\s/g, ""));
  expect(Math.abs(values.reduce((a, b) => a + b, 0) - paid)).toBeLessThanOrEqual(2);
  await panel.getByRole("radio", { name: "Ўтказилган (SWIFT)" }).click();
  await expect(panel.getByRole("img", { name: /Чораклар бўйича ўтказилган суммалар/ })).toBeVisible();
});
