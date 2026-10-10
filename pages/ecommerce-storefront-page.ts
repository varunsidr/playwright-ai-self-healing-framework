import { expect, type Locator, type Page } from '@playwright/test';

type ShopperRegistration = {
  fullName: string;
  email: string;
  password: string;
};

type ShopperRegistrationInput = ShopperRegistration & {
  confirmation: string;
};

type ProductInformationSection = 'details' | 'measurements' | 'care' | 'shipping';

export class EcommerceStorefrontPage {
  private readonly page: Page;
  readonly productCards: Locator;
  readonly productCardPrices: Locator;
  readonly perfumeNavLink: Locator;
  readonly sortSelect: Locator;
  readonly loadMoreProducts: Locator;
  readonly collectionLoading: Locator;
  readonly collectionFallback: Locator;
  readonly collectionStockWarning: Locator;
  readonly collectionRetry: Locator;
  readonly collectionEmpty: Locator;
  readonly collectionCount: Locator;
  readonly brandFilter: Locator;
  readonly sizeFilter: Locator;
  readonly inStockFilter: Locator;
  readonly clearFilters: Locator;
  readonly cartPersistenceNotice: Locator;
  readonly minimumPrice: Locator;
  readonly maximumPrice: Locator;
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
  readonly cartRecoveryNotice: Locator;
  readonly cartLines: Locator;
  readonly startShoppingButton: Locator;
  readonly proceedToCheckoutButton: Locator;
  readonly cartSubtotal: Locator;
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
  readonly loginTab: Locator;
  readonly loginEmail: Locator;
  readonly loginPassword: Locator;
  readonly loginSubmit: Locator;
  readonly registerFullName: Locator;
  readonly registerEmail: Locator;
  readonly registerPassword: Locator;
  readonly registerConfirmPassword: Locator;
  readonly registerSubmit: Locator;
  readonly registrationMismatchAlert: Locator;
  readonly registerFields: Locator[];
  readonly checkoutFromCartLink: Locator;
  readonly mobileMenuToggle: Locator;
  readonly mobileWomenLink: Locator;
  readonly adminLoginHeading: Locator;
  readonly adminPassword: Locator;
  readonly adminLoginSubmit: Locator;
  readonly adminLoginError: Locator;
  readonly newsletterPreviewNotice: Locator;
  readonly hero: Locator;
  readonly heroWomenButton: Locator;
  readonly heroMenButton: Locator;
  readonly heroWomenLink: Locator;
  readonly heroMenLink: Locator;
  readonly heroPauseButton: Locator;
  readonly heroPlayButton: Locator;
  readonly heroVideo: Locator;
  readonly editorialLinks: Locator;
  readonly footer: Locator;
  readonly privacyHeading: Locator;
  readonly privacyBackToStoreLink: Locator;
  readonly termsBackHomeLink: Locator;
  readonly homeDemoNotice: Locator;
  readonly checkoutDemoNotice: Locator;
  readonly checkoutFictionalNotice: Locator;
  readonly privacyCartStorageNotice: Locator;
  readonly privacyPaymentNotice: Locator;
  readonly termsDemoNotice: Locator;

  constructor(page: Page) {
    this.page = page;
    this.productCards = page.getByTestId('product-card');
    this.productCardPrices = this.productCards.getByTestId('product-card-price');
    this.perfumeNavLink = page.getByTestId('navbar-nav-link-/perfume');
    this.sortSelect = page.getByTestId('product-listing-sort-select');
    this.loadMoreProducts = page.getByRole('button', { name: 'Load more products' });
    this.collectionLoading = page.getByTestId('product-listing-loading');
    this.collectionFallback = page.getByText(/You're browsing demo products/);
    this.collectionStockWarning = page.getByText(/size availability/i);
    this.collectionRetry = page.getByRole('button', { name: 'Retry collection' });
    this.collectionEmpty = page.getByText(/No products/i);
    this.collectionCount = page.getByText(/^(?:Showing )?\d+ of \d+ products$/);
    this.brandFilter = page.getByRole('combobox', { name: 'Filter by brand' });
    this.sizeFilter = page.getByRole('combobox', { name: 'Filter by size' });
    this.inStockFilter = page.getByRole('checkbox', { name: 'In stock only' });
    this.clearFilters = page.getByRole('button', { name: /Clear all/i });
    this.minimumPrice = page.getByRole('slider', { name: 'Minimum price', exact: true });
    this.maximumPrice = page.getByRole('slider', { name: 'Maximum price', exact: true });
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
    this.sizeGuideCloseButton = page.getByRole('button', { name: 'Close size guide' });
    this.reviewSubmitButton = page.getByTestId('product-detail-review-submit');
    this.loginPanel = page.getByTestId('navbar-login-panel');
    this.registerForm = page.getByTestId('navbar-register-form');
    this.favoritesHeading = page.getByRole('heading', { name: 'Favorites', level: 1 });
    this.emptyFavoritesMessage = page.getByText("You don't have any favorites yet");
    this.discoverCollectionLink = page.getByRole('link', { name: 'Discover Collection' });
    this.cartToggle = page.getByTestId('navbar-cart-toggle');
    this.cartPanel = page.getByTestId('navbar-cart-panel');
    this.cartPersistenceNotice = this.cartPanel.getByRole('status').filter({
      hasText:
        'Your browser cannot save this bag. Items will stay available while this page is open.',
    });
    this.emptyCartMessage = page.getByText('Your cart is empty');
    this.cartRecoveryNotice = this.cartPanel.getByRole('status').filter({
      hasText: 'Some saved bag items could not be restored.',
    });
    this.cartLines = this.cartPanel.getByTestId('navbar-cart-item');
    this.startShoppingButton = this.cartPanel.getByRole('button', { name: 'Start Shopping' });
    this.proceedToCheckoutButton = this.cartPanel.getByTestId('navbar-cart-checkout');
    this.cartSubtotal = this.cartPanel.getByText('Subtotal', { exact: true }).locator('..');
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
    this.loginTab = page.getByTestId('navbar-auth-tab-login');
    this.loginEmail = page.getByTestId('navbar-login-email');
    this.loginPassword = page.getByTestId('navbar-login-password');
    this.loginSubmit = page.getByTestId('navbar-login-submit');
    this.registerFullName = page.getByTestId('navbar-register-fullname');
    this.registerEmail = page.getByTestId('navbar-register-email');
    this.registerPassword = page.getByTestId('navbar-register-password');
    this.registerConfirmPassword = page.getByTestId('navbar-register-confirm-password');
    this.registerSubmit = page.getByTestId('navbar-register-submit');
    this.registrationMismatchAlert = this.registerForm
      .getByRole('alert')
      .filter({ hasText: 'Passwords do not match.' });
    this.registerFields = [
      this.registerFullName,
      this.registerEmail,
      this.registerPassword,
      this.registerConfirmPassword,
    ];
    this.checkoutFromCartLink = this.cartPanel.getByRole('link', { name: /checkout/i });
    this.mobileMenuToggle = page.getByTestId('navbar-mobile-menu-toggle');
    this.mobileWomenLink = page.getByRole('navigation').getByRole('link', {
      name: 'WOMEN',
      exact: true,
    });
    this.adminLoginHeading = page.getByRole('heading', { name: 'Welcome back.' });
    this.adminPassword = page.getByTestId('admin-login-password');
    this.adminLoginSubmit = page.getByTestId('admin-login-submit');
    this.adminLoginError = page.getByTestId('admin-login-error');
    this.newsletterPreviewNotice = page.getByText(
      'Newsletter preview only. Your email was not saved or sent.',
    );
    this.hero = page.getByTestId('home-hero');
    this.heroWomenButton = this.hero.getByRole('button', { name: "Show Women's Collection" });
    this.heroMenButton = this.hero.getByRole('button', { name: "Show Men's Collection" });
    this.heroWomenLink = this.hero.getByRole('link', { name: 'Explore women' });
    this.heroMenLink = this.hero.getByRole('link', { name: 'Explore men' });
    this.heroPauseButton = this.hero.getByRole('button', { name: 'Pause collection video' });
    this.heroPlayButton = this.hero.getByRole('button', { name: 'Play collection video' });
    this.heroVideo = this.hero.locator('video');
    this.editorialLinks = page.getByTestId('home-editorial-link');
    this.footer = page.locator('footer');
    this.privacyHeading = page.getByRole('heading', { name: 'Privacy notice', level: 1 });
    this.privacyBackToStoreLink = page.getByRole('link', { name: 'Back to store' });
    this.termsBackHomeLink = page.getByRole('link', { name: 'Home', exact: true });
    this.homeDemoNotice = page.getByText('Orders and payments are simulated.', { exact: false });
    this.checkoutDemoNotice = page.getByText(/no payment is charged and no order is shipped/i);
    this.checkoutFictionalNotice = page.getByText(/Use fictional contact and address details/i);
    this.privacyCartStorageNotice = page.getByText(/The cart is also saved in this browser/i);
    this.privacyPaymentNotice = page.getByText(
      /does not collect card details, charge money, (?:or )?arrange shipment/i,
    );
    this.termsDemoNotice = page.getByText(/educational and portfolio purposes/i);
  }

  async openHome() {
    await this.page.goto('/');
  }

  async expectCollectionCount(matching: number, total: number) {
    await expect(this.collectionCount).toHaveText(
      new RegExp(`^(?:Showing )?${matching} of ${total} products$`),
    );
  }

  productCardNames() {
    return this.productCards.getByTestId('product-card-name');
  }

  cardAddAction(name: string) {
    return this.productCardByName(name).getByTestId('product-card-add-to-cart');
  }

  cardSizeAction(name: string) {
    return this.productCardByName(name).getByRole('link', { name: `Choose a size for ${name}` });
  }

  cardImageFailure(name: string) {
    return this.productCardByName(name).getByText('Image unavailable', { exact: true });
  }

  cardFavorite(name: string) {
    return this.productCardByName(name).getByTestId('product-card-favorite-button');
  }

  cardImageLink(name: string) {
    return this.productCardByName(name).getByTestId('product-card-link');
  }

  cardUnavailable(name: string) {
    return this.productCardByName(name).getByText('Currently unavailable', { exact: true });
  }

  underPriceTier(amount: string) {
    return this.page.getByRole('button', { name: `Under ${amount}`, exact: true });
  }

  desktopCategoryTrigger(group: 'women' | 'men') {
    return this.page.getByRole('button', { name: `Browse ${group} categories` });
  }

  desktopCategoryPanel(group: 'women' | 'men') {
    return this.page.locator(`#mega-menu-${group}`);
  }

  desktopCategoryLink(group: 'women' | 'men', name: string) {
    return this.desktopCategoryPanel(group).getByRole('link', { name, exact: true });
  }

  navigationDialog(kind: 'account' | 'cart' | 'search' | 'mobile') {
    const names = {
      account: 'My account',
      cart: 'Shopping bag',
      search: 'Search catalog',
      mobile: 'Navigation menu',
    };
    return this.page.getByRole('dialog', { name: names[kind], exact: true });
  }

  navigationTrigger(kind: 'account' | 'cart' | 'search' | 'mobile') {
    return {
      account: this.openAccountButton,
      cart: this.cartToggle,
      search: this.searchToggle,
      mobile: this.mobileMenuToggle,
    }[kind];
  }

  mobileGroupSummary(group: 'women' | 'men') {
    return this.navigationDialog('mobile')
      .locator('summary')
      .filter({ hasText: `Explore ${group}` });
  }

  mobileCategoryLink(name: string) {
    return this.navigationDialog('mobile').getByRole('link', { name, exact: true });
  }

  async expectDialogFocusContained(kind: 'account' | 'cart' | 'search' | 'mobile') {
    await expect
      .poll(() => this.navigationDialog(kind).evaluate((el) => el.contains(document.activeElement)))
      .toBe(true);
  }

  async focusDialogEdge(kind: 'account' | 'cart' | 'search' | 'mobile', edge: 'first' | 'last') {
    await this.navigationDialog(kind).evaluate((dialog, selectedEdge) => {
      const controls = Array.from(
        dialog.querySelectorAll<HTMLElement>('button,a[href],input,select,textarea,[tabindex]'),
      ).filter(
        (el) =>
          el.tabIndex >= 0 &&
          !el.hasAttribute('disabled') &&
          !el.closest('[inert]') &&
          el.getClientRects().length > 0 &&
          getComputedStyle(el).visibility !== 'hidden',
      );
      const target = selectedEdge === 'first' ? controls[0] : controls[controls.length - 1];
      if (!target) throw new Error('Active dialog has no focusable controls');
      target.focus();
    }, edge);
  }

  async expectDialogEdgeFocused(
    kind: 'account' | 'cart' | 'search' | 'mobile',
    edge: 'first' | 'last',
  ) {
    await expect
      .poll(() =>
        this.navigationDialog(kind).evaluate((dialog, selectedEdge) => {
          const controls = Array.from(
            dialog.querySelectorAll<HTMLElement>('button,a[href],input,select,textarea,[tabindex]'),
          ).filter(
            (el) =>
              el.tabIndex >= 0 &&
              !el.hasAttribute('disabled') &&
              !el.closest('[inert]') &&
              el.getClientRects().length > 0 &&
              getComputedStyle(el).visibility !== 'hidden',
          );
          return (
            document.activeElement ===
            (selectedEdge === 'first' ? controls[0] : controls[controls.length - 1])
          );
        }, edge),
      )
      .toBe(true);
  }

  async expectPageScrollLocked(locked: boolean) {
    await expect
      .poll(() =>
        this.page.locator('body').evaluate((el) => getComputedStyle(el).overflow === 'hidden'),
      )
      .toBe(locked);
  }

  async expectNoHorizontalOverflow() {
    await expect
      .poll(() =>
        this.page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      )
      .toBe(true);
  }

  homeCollectionLink(group: 'women' | 'men') {
    return this.page.getByRole('link', {
      name: group === 'women' ? /^For her collection/ : /^For him collection/,
    });
  }

  homeCategoryLink(name: string) {
    return this.page
      .getByRole('navigation', { name: 'Explore categories' })
      .getByRole('link', { name, exact: true });
  }

  homeEditorialLink(index: number) {
    return this.editorialLinks.nth(index);
  }

  readonlyHomeEditLink() {
    return this.page.getByRole('link', { name: 'Explore the edit' });
  }

  async useReducedMotion() {
    await this.page.emulateMedia({ reducedMotion: 'reduce' });
  }

  footerLink(name: string) {
    return this.footer.getByRole('link', { name, exact: true });
  }

  async openWomenCollection() {
    await this.page.goto('/women');
  }

  async openRoute(route: string) {
    await this.page.goto(route);
  }

  async submitNewsletterPreview(email: string) {
    await this.page.getByTestId('footer-newsletter-email').fill(email);
    await this.page.getByTestId('footer-newsletter-submit').click();
  }

  async openFirstProduct() {
    await this.openWomenCollection();
    const availableUnsizedProduct = this.productCards.filter({
      has: this.page.getByTestId('product-card-add-to-cart'),
    });
    await availableUnsizedProduct.first().getByTestId('product-card-name').click();
  }

  async searchFor(query: string) {
    await this.openSearch();
    await this.submitOpenSearch(query);
  }

  async openSearch() {
    await this.searchToggle.click();
  }

  async submitOpenSearch(query: string) {
    await this.searchInput.fill(query);
    await this.searchInput.press('Enter');
  }

  async expectUrl(pattern: RegExp) {
    await expect(this.page).toHaveURL(pattern);
  }

  async sortByPriceLowToHigh() {
    await this.sortSelect.selectOption('price-low');
  }

  async loadAllProducts() {
    const loadMore = this.page.getByRole('button', { name: 'Load more products' });
    while (await loadMore.isVisible()) {
      const previousCount = await this.productCards.count();
      await loadMore.click();
      await expect.poll(() => this.productCards.count()).toBeGreaterThan(previousCount);
    }
  }

  async openSizeGuide() {
    await this.sizeGuideButton.click();
  }

  async closeSizeGuide() {
    await this.sizeGuideCloseButton.click();
  }

  async openProductInformation(section: ProductInformationSection) {
    await this.page.getByTestId(`product-detail-accordion-${section}`).click();
  }

  async expectProductInformationOpen(section: ProductInformationSection) {
    const body = this.productInformationBody(section);
    await expect(body).toHaveCSS('max-height', '400px');
    await expect(body.locator('li').first()).toHaveText(/\S/);
  }

  async expectProductInformationClosed(section: ProductInformationSection) {
    await expect(this.productInformationBody(section)).toHaveCSS('max-height', '0px');
  }

  private productInformationBody(section: ProductInformationSection) {
    return this.page.locator(`[data-testid="product-detail-accordion-${section}"] + div`);
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

  cartLineForSize(size: string) {
    return this.cartLines.filter({ hasText: `Size: ${size}` });
  }

  cartLineImage(size: string) {
    return this.cartLineForSize(size).getByRole('img', { name: 'Playwright Browser Cart Item' });
  }

  cartLineQuantity(size: string) {
    return this.cartLineForSize(size)
      .getByRole('button', { name: 'Decrease quantity of Playwright Browser Cart Item' })
      .locator('..')
      .locator('span');
  }

  async changeCartQuantity(size: string, direction: 'Increase' | 'Decrease') {
    await this.cartLineForSize(size)
      .getByRole('button', { name: `${direction} quantity of Playwright Browser Cart Item` })
      .click();
  }

  async removeCartLine(size: string) {
    await this.cartLineForSize(size)
      .getByRole('button', { name: 'Remove Playwright Browser Cart Item from bag' })
      .click();
  }

  async addFirstCatalogProductToCart() {
    await this.productCards
      .getByRole('button', { name: /^Add .+ to cart$/ })
      .first()
      .click();
  }

  async closeAccountPanel() {
    await this.loginPanel.getByRole('button', { name: 'Close' }).click();
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
    await this.openAccountPanel();
    await this.switchToRegister();
  }

  async openAccountPanel() {
    await this.openAccountButton.click();
  }

  async switchToRegister() {
    await this.registerTab.click();
  }

  async switchToSignIn() {
    await this.loginTab.click();
  }

  async toggleLoginPasswordVisibility() {
    await this.loginPassword.locator('..').getByRole('button').click();
  }

  async toggleRegisterPasswordVisibility() {
    await this.registerPassword.locator('..').getByRole('button').click();
  }

  async fillRegistration(shopper: ShopperRegistrationInput) {
    await this.registerFullName.fill(shopper.fullName);
    await this.registerEmail.fill(shopper.email);
    await this.registerPassword.fill(shopper.password);
    await this.registerConfirmPassword.fill(shopper.confirmation);
  }

  async submitRegistration() {
    await this.registerSubmit.click();
  }

  async registerNewShopper(shopper: ShopperRegistration) {
    await this.openRegistrationPanel();
    await this.fillRegistration({ ...shopper, confirmation: shopper.password });
    await this.submitRegistration();
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

  async expectNotFound() {
    await expect(this.page.getByRole('heading', { name: '404', level: 1 })).toBeVisible();
    await expect(
      this.page.getByRole('heading', { name: 'This page could not be found.', level: 2 }),
    ).toBeVisible();
  }

  async expectAdminWithoutStorefrontChrome() {
    await expect(this.adminLoginHeading).toBeVisible();
    await expect(this.page.getByRole('navigation', { name: 'Main navigation' })).toHaveCount(0);
    await expect(this.searchToggle).toHaveCount(0);
    await expect(this.cartToggle).toHaveCount(0);
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
