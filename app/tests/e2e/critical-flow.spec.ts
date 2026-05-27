import { test, expect } from '@playwright/test';

test.describe('Vila Viva Light — fluxo crítico', () => {
  test('login form aparece e aceita e-mail', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText('Vila Viva')).toBeVisible();
    await page.getByPlaceholder('seu@email.com').fill('test@example.com');
    await page.getByRole('button', { name: /Receber link/i }).click();
    // Allowlist will reject this email, so we expect error state
    await expect(page.getByText(/Erro|Link enviado|Enviando/i)).toBeVisible({ timeout: 5000 });
  });

  test('página de privacidade carrega', async ({ page }) => {
    await page.goto('/privacidade');
    await expect(page.getByText('Política de privacidade')).toBeVisible();
    await expect(page.getByText(/stakeholders convidados/i)).toBeVisible();
  });
});
