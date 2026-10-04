import { expect, type Locator, type Page } from '@playwright/test';

type ShopperRegistration = {
  fullName: string;
  email: string;
  password: string;
};

export class EcommerceStorefrontPage {
  private readonly page: Page;
  readonly productCards: Locator;
  readonly productCardPrices: Locator;
  readonly perfumeNavLink: Locator;
  readonly sortSelect: Locator;
  readonly searchToggle: Locator;
  readonly searchInput: Locator;
  readonly searchResultsHeading: Locator;
  readonly noSearchResults: Locator;
  readonly quantity: Locator;
  readonly quantityIncrease: Locator;
  readonly quantityDecrease: Locator;
  readonly addToCartButton: Locator;
  readonly sizeGuideButton: Locator;
  readonly sizeGuideHeading: Locator;
  readonly sizeGuideChestHeader: Locator;
  readonly sizeGuideCloseButton: Locator;
  readonly reviewSubmitButton: Locator;
  readonly loginPanel: Locator;
  readonly registerForm: Locator;
  readonly favoritesHeading: Locator;
  readonly emptyFavoritesMessage: Locator;
  readonly discoverCollectionLink: Locator;
  readonly cartToggle: Locator;
  readonly cartPanel: Locator;
  readonly emptyCartMessage: Locator;
  readonly checkoutHeading: Locator;
  readonly checkoutSignInMessage: Locator;
  readonly checkoutEmptyMessage: Locator;
  readonly simulatePaymentButton: Locator;
  readonly orderHistoryHeading: Locator;
  readonly signedOutOrdersHeading: Locator;
  readonly termsHeading: Locator;
  readonly termsOpenSourceHeading: Locator;
  readonly openAccountButton: Locator;
  readonly registerTab: Locator;
  readonly loginEmail: Locator;
  readonly loginPassword: Locator;
  readonly loginSubmit: Locator;
  readonly registerFullName: Locator;
  readonly registerEmail: Locator;
  readonly registerPassword: Locator;
  readonly registerConfirmPassword: Locator;
  readonly registerSubmit: Locator;
  readonly registerFields: Locator[];
  readonly checkoutFromCartLink: Locator;
  readonly mobileMenuToggle: Locator;
  readonly mobileWomenLink: Locator;
  readonly adminLoginHeading: Locator;
  readonly adminPassword: Locator;
  readonly adminLoginSubmit: Locator;
  readonly adminLoginError: Locator;

  constructor(page: Page) {
    this.page = page;
    this.productCards = page.getByTestId('product-card');
    this.productCardPrices = this.productCards.getByTestId('product-card-price');
    this.perfumeNavLink = page.getByTestId('navbar-nav-link-/perfume');
    this.sortSelect = page.getByTestId('product-listing-sort-select');
    this.searchToggle = page.getByTestId('navbar-search-toggle');
    this.searchInput = page.getByTestId('navbar-search-input');
    this.searchResultsHeading = page.getByRole('heading', { name: 'Search Results' });
    this.noSearchResults = page.getByText('No results found.');
    this.quantity = page.getByTestId('product-detail-quantity-value');
    this.quantityIncrease = page.getByTestId('product-detail-quantity-increase');
    this.quantityDecrease = page.getByTestId('product-detail-quantity-decrease');
    this.addToCartButton = page.getByTestId('product-detail-add-to-cart');
    this.sizeGuideButton = page.getByRole('button', { name: 'Size Guide' });
    this.sizeGuideHeading = page.getByRole('heading', { name: 'Size Guide' });
    this.sizeGuideChestHeader = page.getByRole('columnheader', { name: 'Chest' });
    this.sizeGuideCloseButton = this.sizeGuideHeading.locator('..').getByRole('button');
    this.reviewSubmitButton = page.getByTestId('product-detail-review-submit');
    this.loginPanel = page.getByTestId('navbar-login-panel');
    this.registerForm = page.getByTestId('navbar-register-form');
    this.favoritesHeading = page.getByRole('heading', { name: 'Favorites', level: 1 });
    this.emptyFavoritesMessage = page.getByText("You don't have any favorites yet");
    this.discoverCollectionLink = page.getByRole('link', { name: 'Discover Collection' });
    this.cartToggle = page.getByTestId('navbar-cart-toggle');
    this.cartPanel = page.getByTestId('navbar-cart-panel');
    this.emptyCartMessage = page.getByText('Your cart is empty');
    this.checkoutHeading = page.getByRole('heading', { name: 'Complete your order' });
    this.checkoutSignInMessage = page.getByText(
      'Please sign in from the account menu before placing an order.',
    );
    this.checkoutEmptyMessage = page.getByText('Your cart is empty.');
    this.simulatePaymentButton = page.getByRole('button', { name: 'Simulate payment' });
    this.orderHistoryHeading = page.getByRole('heading', { name: 'Order history' });
    this.signedOutOrdersHeading = page.getByRole('heading', {
      name: 'Sign in to view your orders',
    });
    this.termsHeading = page.getByRole('heading', { name: 'Terms of Service' });
    this.termsOpenSourceHeading = page.getByRole('heading', { name: '1. Open Source Project' });
    this.openAccountButton = page.getByTestId('navbar-account-toggle');
    this.registerTab = page.getByTestId('navbar-auth-tab-register');
    this.loginEmail = page.getByTestId('navbar-login-email');
    this.loginPassword = page.getByTestId('navbar-login-password');
    this.loginSubmit = page.getByTestId('navbar-login-submit');
    this.registerFullName = page.getByTestId('navbar-register-fullname');
    this.registerEmail = page.getByTestId('navbar-register-email');
    this.registerPassword = page.getByTestId('navbar-register-password');
    this.registerConfirmPassword = page.getByTestId('navbar-register-confirm-password');
    this.registerSubmit = page.getByTestId('navbar-register-submit');
    this.registerFields = [
      this.registerFullName,
      this.registerEmail,
      this.registerPassword,
      this.registerConfirmPassword,
    ];
    this.checkoutFromCartLink = this.cartPanel.getByRole('link', { name: /checkout/i });
    this.mobileMenuToggle = page.getByTestId('navbar-mobile-menu-toggle');
    this.mobileWomenLink = page.getByRole('navigation').getByRole('link', { name: 'WOMEN' });
    this.adminLoginHeading = page.getByRole('heading', { name: 'Welcome back.' });
    this.adminPassword = page.getByTestId('admin-login-password');
    this.adminLoginSubmit = page.getByTestId('admin-login-submit');
    this.adminLoginError = page.getByTestId('admin-login-error');
  }

  async openHome() {
    await this.page.goto('/');
  }

  async openWomenCollection() {
    await this.page.goto('/kadin');
  }

  async openRoute(route: string) {
    await this.page.goto(route);
  }

  async openFirstProduct() {
    await this.openWomenCollection();
    await this.productCards.first().waitFor();
    await this.productCards.first().getByTestId('product-card-name').click();
  }

  async searchFor(query: string) {
    await this.searchToggle.click();
    await this.searchInput.fill(query);
    await this.searchInput.press('Enter');
  }

  async expectUrl(pattern: RegExp) {
    await expect(this.page).toHaveURL(pattern);
  }

  async sortByPriceLowToHigh() {
    await this.sortSelect.selectOption('price-low');
  }

  async openSizeGuide() {
    await this.sizeGuideButton.click();
  }

  async closeSizeGuide() {
    await this.sizeGuideCloseButton.click();
  }

  async openEmptyCart() {
    await this.cartToggle.click();
  }

  async closeCart() {
    await this.cartPanel.getByRole('button', { name: 'Close' }).click();
  }

  async openCart() {
    await this.cartToggle.click();
  }

  async openPerfumeCollectionFromNav() {
    await this.perfumeNavLink.click();
  }

  async openMobileWomenCollection() {
    await this.mobileMenuToggle.click();
    await this.mobileWomenLink.click();
  }

  async useMobileViewport() {
    await this.page.setViewportSize({ width: 390, height: 844 });
  }

  async openRegistrationPanel() {
    await this.openAccountButton.click();
    await this.registerTab.click();
  }

  async registerNewShopper(shopper: ShopperRegistration) {
    await this.openRegistrationPanel();
    await this.registerFullName.fill(shopper.fullName);
    await this.registerEmail.fill(shopper.email);
    await this.registerPassword.fill(shopper.password);
    await this.registerConfirmPassword.fill(shopper.password);
    await this.registerSubmit.click();
  }

  async signIn(email: string, password: string) {
    await this.loginPanel.getByRole('button', { name: 'Sign In' }).first().click();
    await this.loginEmail.fill(email);
    await this.loginPassword.fill(password);
    await this.loginSubmit.click();
  }

  async addCatalogProductsToCart(productNames: string[]) {
    for (const productName of productNames) {
      await this.productCardByName(productName)
        .getByRole('button', { name: `Add ${productName} to cart` })
        .click();
    }
  }

  async continueToCheckoutFromCart() {
    await this.checkoutFromCartLink.click();
  }

  productCardByName(productName: string) {
    return this.productCards.filter({
      has: this.page.getByTestId('product-card-name').filter({ hasText: productName }),
    });
  }

  cartItemByName(productName: string) {
    return this.cartPanel.getByText(productName, { exact: true });
  }

  checkoutItemByName(productName: string) {
    return this.page.getByText(productName, { exact: true });
  }

  async tryInvalidAdminPassword() {
    await this.adminPassword.fill('intentionally-invalid-test-password');
    await this.adminLoginSubmit.click();
  }

  async expectHomeLoaded() {
    await expect(this.page).toHaveTitle(/zeouf/i);
    await expect(this.page.getByTestId('navbar-search-toggle')).toBeVisible();
    await expect(this.page.getByTestId('navbar-cart-toggle')).toBeVisible();
  }

  async expectWomenCollectionLoaded() {
    await expect(this.page.getByRole('heading', { name: 'Women', level: 1 })).toBeVisible();
    await expect(this.page.getByTestId('product-listing-loading')).toBeHidden();
    await expect(this.productCards.first()).toBeVisible();
  }

  async expectCategoryLoaded(name: string) {
    await expect(this.page.getByRole('heading', { name, level: 1 })).toBeVisible();
    await expect(this.page.getByTestId('product-listing-loading')).toBeHidden();
  }

  async expectProductDetailLoaded() {
    await expect(this.page.locator('main h1').last()).toBeVisible();
    await expect(this.page.getByTestId('product-detail-add-to-cart')).toBeVisible();
    await expect(this.page.getByTestId('product-detail-favorite-button')).toBeVisible();
  }

  async expectGuestSignInRequired() {
    await expect(this.loginPanel).toHaveAttribute('data-state', 'open');
    await expect(this.registerForm).toBeVisible();
  }
}
