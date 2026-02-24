
import { test, expect } from '@playwright/test';

test('AI Chat page initial state', async ({ page }) => {
  await page.goto('/dashboard/ai-assistant');

  // Check if textarea exists
  const textarea = page.getByLabel('Message input');
  await expect(textarea).toBeVisible();

  // Check placeholder text contains shortcut hint
  const placeholder = await textarea.getAttribute('placeholder');
  expect(placeholder).toMatch(/Type your message... \(.*K\)/);

  // Check if focused
  await expect(textarea).toBeFocused();
});
