import { test as setup } from '@playwright/test';
import { adminAuthState } from './utils';

setup('Admin authentication', async ({ page }) => {
  await page.goto('/wp-login.php');
  await page.getByRole('textbox', { name: 'Username or Email Address' }).fill('admin');
  await page.getByRole('textbox', { name: 'Password' }).fill('password');
  await page.getByText('Log In').click();
  await page.context().storageState({ path: adminAuthState });
});
