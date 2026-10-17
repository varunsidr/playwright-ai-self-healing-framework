# Men's subcategory membership regression

The expanded `TC-CAT-01-CORE` fixture exposes two failures on deployed Zeouf:

- `/men/trousers` renders both Women's Trousers and Men's Trousers.
- `/men/jacket` renders both Women's Jacket and Men's Jacket.

The fixture supplies one fictional product in each of the 14 supported categories through intercepted GET requests. It exercises the actual deployed listing component and blocks server writes. Expected results contain only the matching Men's product. The Women/Men main collection checks pass.

In the website's `src/components/ProductListing.tsx`, the query `ilike("category", "%Men's Trousers%")` also matches `Women's Trousers`. `matchesProductFilter` subsequently accepts a substring category or shared subcategory name without checking `matchesMainCategory(product)`.

The developer should require main-category membership for every ordinary subcategory before applying the subcategory comparisons:

```tsx
return (
  matchesMainCategory(product) &&
  Boolean(subCategoryName) &&
  (productCategory === targetCategory ||
    productCategory.includes(targetCategory) ||
    productCategory.includes(subCategoryName))
);
```

Keep tag-route handling and the existing main-category normalization. Apply the website's documentation review workflow, deploy, and rerun the category fixture. Do not change expected membership, skip the tests, or mark the full database contract accepted from these mocks.

Reproduction in the framework:

```powershell
npx.cmd playwright test tests/ecommerce/category-membership-fixture.spec.ts --project=ecommerce-chromium --grep '/men/(trousers|jacket)' --retries=0
```

Traces and screenshots are retained in `test-results/automation-expansion/` and the latest full read-only run's output directory. This is frontend filtering evidence; it does not verify actual database inventory or applied policies.
