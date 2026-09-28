# zeouf Fashion Storefront Discovery Test Plan

## Application Overview

The application under test is the user's zeouf fashion storefront at ECOMMERCE_BASE_URL (currently http://localhost:3000). The plan was explored with Playwright project ecommerce-chromium and tests/ecommerce/seed.spec.ts. The homepage offers Women and Men collection hero controls, a navbar product search, and a newsletter form. Live exploration showed that selecting the men's hero changes the heading and collection link to /erkek; searching for Birkin opens /arama?q=Birkin with matching product cards; and an invalid newsletter email remains on the page with native email validity.typeMismatch. Each scenario begins from a fresh homepage state, can run independently, and avoids account or payment side effects.

## Test Scenarios

### 1. zeouf storefront discovery

**Seed:** `tests/ecommerce/seed.spec.ts`

#### 1.1. Switch hero to the men's collection

**File:** `tests/ecommerce/catalog.spec.ts`

**Steps:**
  1. Start from the fresh zeouf homepage using the storefront seed.
    - expect: The zeouf homepage is loaded and the collection hero controls are visible.
  2. Click Show Men's Collection.
    - expect: The hero heading changes to Men's Collection.
    - expect: The Show Men's Collection control is pressed.
    - expect: The Discover the Collection link points to /erkek.
  3. Click Show Women's Collection.
    - expect: The hero heading changes to Women's Collection.
    - expect: The Show Women's Collection control is pressed.
    - expect: The Discover the Collection link points to /kadin.

#### 1.2. Find a known product using navbar search

**File:** `tests/ecommerce/catalog.spec.ts`

**Steps:**
  1. Start from the fresh zeouf homepage using the storefront seed.
    - expect: The Search control is visible in the navbar.
  2. Click Search, enter Birkin in the search field, and press Enter.
    - expect: The URL contains /arama?q=Birkin.
    - expect: The Search Results heading appears.
    - expect: At least one product result whose name contains Birkin appears; the live catalog currently showed Birkin 30 Craie Epsom and Birkin 30 Rose Sakura Swift.
  3. Open a Birkin product result.
    - expect: A product detail page opens for the selected item.
    - expect: The product title matches the selected result and the add-to-cart control is visible.

#### 1.3. Reject an invalid newsletter email

**File:** `tests/ecommerce/newsletter.spec.ts`

**Steps:**
  1. Start from the fresh zeouf homepage using the storefront seed.
    - expect: The newsletter email field and Subscribe button are visible in the footer.
  2. Enter invalid-email in the newsletter email field and click Subscribe.
    - expect: The page does not navigate away.
    - expect: The email field retains invalid-email and has native email typeMismatch validation.
    - expect: No success or subscribed state is shown.
