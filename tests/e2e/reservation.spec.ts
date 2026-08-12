import { test, expect } from '@playwright/test';

test.describe('EquipFlow End-to-End Browser Automation Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to local development server
    await page.goto('/');
  });

  test('E2E-1: Asset catalog navigation and search filtering', async ({ page }) => {
    // Verify title
    await expect(page).toHaveTitle(/EquipFlow/);

    // Verify brand header
    await expect(page.locator('.brand')).toContainText('EquipFlow');

    // Type search query
    const searchInput = page.locator('#asset-search-input');
    await searchInput.fill('MacBook');

    // Should filter assets
    const card = page.locator('.glass-card').first();
    await expect(card).toContainText('MacBook Pro M3');
  });

  test('E2E-2: VIP User booking flow with auto-approval pill', async ({ page }) => {
    // Select Jane Doe (VIP) from dropdown
    await page.selectOption('#user-switch-select', { label: 'Jane Doe (VIP) (VIP)' });

    // Click Reserve Equipment on first asset
    await page.locator('#reserve-btn-1').click();

    // Verify modal appears with VIP badge
    const modal = page.locator('.modal-content');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('VIP Priority Tier Active');

    // Submit reservation
    await page.locator('#submit-booking-btn').click();

    // Modal should close
    await expect(modal).not.toBeVisible();

    // Navigate to My Reservations tab
    await page.locator('#tab-my-reservations').click();

    // Verify new reservation in table with VIP status
    const table = page.locator('.data-table');
    await expect(table).toContainText('MacBook Pro M3');
    await expect(table).toContainText('CONFIRMED');
    await expect(table).toContainText('VIP AUTO');
  });

  test('E2E-3: Standard User quota enforcement feedback', async ({ page }) => {
    // Select John Smith (Standard)
    await page.selectOption('#user-switch-select', { label: 'John Smith (Dev) (STANDARD)' });

    // Open booking modal
    await page.locator('#reserve-btn-1').click();

    const modal = page.locator('.modal-content');
    await expect(modal).toContainText('Standard User Policy');
  });
});
