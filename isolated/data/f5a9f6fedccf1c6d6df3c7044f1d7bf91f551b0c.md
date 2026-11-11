# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ecommerce/isolated/cart-browser-controls.spec.ts >> Zeouf browser-local cart controls >> TC-CART-06-CORE empty bag closes with Start Shopping @happy
- Location: tests/ecommerce/isolated/cart-browser-controls.spec.ts:49:7

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator:  getByTestId('navbar-cart-panel')
Expected: "open"
Received: "closed"
Timeout:  5000ms

Call log:
  - Expect "toHaveAttribute" with timeout 5000ms
  - waiting for getByTestId('navbar-cart-panel')
    14 × locator resolved to <div inert="" role="dialog" tabindex="-1" aria-modal="true" data-state="closed" aria-label="Shopping bag" data-testid="navbar-cart-panel" class="storefront-drawer fixed top-0 right-0 bottom-0 z-[70] w-full sm:w-[440px] bg-[#fdfcf9] shadow-2xl transition-transform duration-300 ease-out translate-x-full">…</div>
       - unexpected value "closed"

```

```yaml
- dialog "Shopping bag":
  - heading "My Cart" [level=2]
  - button "Close"
  - paragraph: Your cart is empty
  - button "Start Shopping"
```

# Test source

```ts
  808  |   async openFirstProduct() {
  809  |     await this.openWomenCollection();
  810  |     await this.expectWomenCollectionLoaded();
  811  |     const availableUnsizedProduct = await this.firstPurchasableUnsizedCard();
  812  |     const productName = availableUnsizedProduct.getByTestId('product-card-name');
  813  |     const productLink = availableUnsizedProduct.getByRole('link').filter({
  814  |       has: this.page.getByTestId('product-card-name'),
  815  |     });
  816  |     const href = await productLink.getAttribute('href');
  817  |     expect(href, 'The selected product must have a destination').toBeTruthy();
  818  |     this.selectedProduct = {
  819  |       name: (await productName.innerText()).trim(),
  820  |       url: new URL(href!, this.page.url()).href,
  821  |     };
  822  |     await productLink.click();
  823  |     await this.page.waitForURL(this.selectedProduct.url, { waitUntil: 'domcontentloaded' });
  824  |   }
  825  | 
  826  |   private async firstPurchasableUnsizedCard() {
  827  |     // Sized cards contain a hidden add control. Require the actual accessible
  828  |     // quick-add action and load more within the same collection when needed.
  829  |     const eligible = this.productCards.filter({
  830  |       has: this.page.getByRole('button', { name: /^Add .+ to cart$/ }),
  831  |     });
  832  |     while ((await eligible.count()) === 0 && (await this.loadMoreProducts.isVisible())) {
  833  |       const before = await this.productCards.count();
  834  |       await this.loadMoreProducts.click();
  835  |       await expect(this.productCards).not.toHaveCount(before);
  836  |     }
  837  |     await expect(eligible.first(), 'Guest add requires an in-stock unsized product').toBeVisible();
  838  |     return eligible.first();
  839  |   }
  840  | 
  841  |   async searchFor(query: string) {
  842  |     await this.openSearch();
  843  |     await this.submitOpenSearch(query);
  844  |   }
  845  | 
  846  |   async openSearch() {
  847  |     await this.searchToggle.click();
  848  |   }
  849  | 
  850  |   async submitOpenSearch(query: string) {
  851  |     await this.searchInput.fill(query);
  852  |     await this.searchInput.press('Enter');
  853  |   }
  854  | 
  855  |   async expectUrl(pattern: RegExp) {
  856  |     await expect(this.page).toHaveURL(pattern);
  857  |   }
  858  | 
  859  |   async sortByPriceLowToHigh() {
  860  |     await this.sortSelect.selectOption('price-low');
  861  |   }
  862  | 
  863  |   async loadAllProducts() {
  864  |     const loadMore = this.page.getByRole('button', { name: 'Load more products' });
  865  |     while (await loadMore.isVisible()) {
  866  |       const previousCount = await this.productCards.count();
  867  |       await loadMore.click();
  868  |       await expect.poll(() => this.productCards.count()).toBeGreaterThan(previousCount);
  869  |     }
  870  |   }
  871  | 
  872  |   async openSizeGuide() {
  873  |     await this.sizeGuideButton.click();
  874  |   }
  875  | 
  876  |   async closeSizeGuide() {
  877  |     await this.sizeGuideCloseButton.click();
  878  |   }
  879  | 
  880  |   async openProductInformation(section: ProductInformationSection) {
  881  |     await this.page.getByTestId(`product-detail-accordion-${section}`).click();
  882  |   }
  883  | 
  884  |   async expectProductInformationOpen(section: ProductInformationSection) {
  885  |     const body = this.productInformationBody(section);
  886  |     await expect(body).toHaveCSS('max-height', '400px');
  887  |     await expect(body.locator('li').first()).toHaveText(/\S/);
  888  |   }
  889  | 
  890  |   async expectProductInformationClosed(section: ProductInformationSection) {
  891  |     await expect(this.productInformationBody(section)).toHaveCSS('max-height', '0px');
  892  |   }
  893  | 
  894  |   private productInformationBody(section: ProductInformationSection) {
  895  |     return this.page.locator(`[data-testid="product-detail-accordion-${section}"] + div`);
  896  |   }
  897  | 
  898  |   async openEmptyCart() {
  899  |     await this.cartToggle.click();
  900  |   }
  901  | 
  902  |   async closeCart() {
  903  |     await this.cartPanel.getByRole('button', { name: 'Close' }).click();
  904  |   }
  905  | 
  906  |   async openCart() {
  907  |     await this.cartToggle.click();
> 908  |     await expect(this.cartPanel).toHaveAttribute('data-state', 'open');
       |                                  ^ Error: expect(locator).toHaveAttribute(expected) failed
  909  |     await expect(this.cartPanel).toBeInViewport();
  910  |   }
  911  | 
  912  |   async expectCartRestored(quantity: number) {
  913  |     await expect(this.cartToggle.getByTestId('navbar-cart-count')).toHaveText(String(quantity));
  914  |   }
  915  | 
  916  |   async expectCartPersistenceReady() {
  917  |     await expect(this.cartPersistenceNotice).toBeAttached();
  918  |   }
  919  | 
  920  |   cartLineForSize(size: string) {
  921  |     return this.cartLines.filter({ hasText: `Size: ${size}` });
  922  |   }
  923  | 
  924  |   cartVariantQuantity(size: string, color: string) {
  925  |     return this.cartLineForSize(size)
  926  |       .filter({ hasText: `Color: ${color}` })
  927  |       .getByRole('button', {
  928  |         name: 'Decrease quantity of Playwright Browser Cart Item',
  929  |         exact: true,
  930  |       })
  931  |       .locator('..')
  932  |       .locator('span');
  933  |   }
  934  | 
  935  |   async increaseCartVariant(size: string, color: string) {
  936  |     await this.cartLineForSize(size)
  937  |       .filter({ hasText: `Color: ${color}` })
  938  |       .getByRole('button', {
  939  |         name: 'Increase quantity of Playwright Browser Cart Item',
  940  |         exact: true,
  941  |       })
  942  |       .click();
  943  |   }
  944  | 
  945  |   cartLineImage(size: string) {
  946  |     return this.cartLineForSize(size).getByRole('img', { name: 'Playwright Browser Cart Item' });
  947  |   }
  948  | 
  949  |   cartLineQuantity(size: string, name = 'Playwright Browser Cart Item') {
  950  |     return this.cartLineForSize(size)
  951  |       .getByRole('button', { name: `Decrease quantity of ${name}`, exact: true })
  952  |       .locator('..')
  953  |       .locator('span');
  954  |   }
  955  | 
  956  |   async changeCartQuantity(
  957  |     size: string,
  958  |     direction: 'Increase' | 'Decrease',
  959  |     name = 'Playwright Browser Cart Item',
  960  |   ) {
  961  |     await this.cartLineForSize(size)
  962  |       .getByRole('button', { name: `${direction} quantity of ${name}`, exact: true })
  963  |       .click();
  964  |   }
  965  | 
  966  |   async removeCartLine(size: string) {
  967  |     await this.cartLineForSize(size)
  968  |       .getByRole('button', { name: 'Remove Playwright Browser Cart Item from bag' })
  969  |       .click();
  970  |   }
  971  | 
  972  |   async addFirstCatalogProductToCart() {
  973  |     const product = await this.firstPurchasableUnsizedCard();
  974  |     await product.getByRole('button', { name: /^Add .+ to cart$/ }).click();
  975  |   }
  976  | 
  977  |   async closeAccountPanel() {
  978  |     await this.loginPanel.getByRole('button', { name: 'Close' }).click();
  979  |   }
  980  | 
  981  |   async openPerfumeCollectionFromNav() {
  982  |     await this.perfumeNavLink.click();
  983  |   }
  984  | 
  985  |   async openMobileWomenCollection() {
  986  |     await this.mobileMenuToggle.click();
  987  |     await this.mobileWomenLink.click();
  988  |   }
  989  | 
  990  |   async useMobileViewport() {
  991  |     await this.page.setViewportSize({ width: 390, height: 844 });
  992  |   }
  993  | 
  994  |   async openRegistrationPanel() {
  995  |     await this.openAccountPanel();
  996  |     await this.switchToRegister();
  997  |   }
  998  | 
  999  |   async openAccountPanel() {
  1000 |     if (await this.openAccountButton.isVisible()) {
  1001 |       await this.openAccountButton.click();
  1002 |     } else {
  1003 |       await this.mobileMenuToggle.click();
  1004 |       await this.navigationDialog('mobile')
  1005 |         .getByRole('button', { name: 'Account', exact: true })
  1006 |         .click();
  1007 |     }
  1008 |   }
```