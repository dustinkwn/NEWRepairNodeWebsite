# Pricing update verification

The redesigned `/pricing-2/` page uses the existing shared `/css/main.css`, `/css/reset.css`, `/js/main.js`, `/images/logo.png`, and `/data/pricing-catalog.json`. New pricing styles are scoped to `/css/pricing.css`; selector logic is in `/js/pricing.js` and `/js/pricing-core.js`. There are no new runtime dependencies.

The legacy `/pricing.html` page uses the same selector and points its canonical to `/pricing-2/`. The main pricing URL, navigation and business structured data remain intact. Existing Google Analytics and Plausible scripts are retained. Native option nodes preserve the repository's older-iPhone Safari approach; the new pricing scripts avoid optional chaining and `replaceChildren`.

All supplied iPhone screen/battery/port prices are active, including the $299 iPhone 17 Pro Max screen, per the shop's updated instruction. No numeric battery/port prices were supplied for iPhone 17/Air, so those remain contact inquiries. Other brands, camera/back glass and non-phone prices are unchanged. Controllers remain available under Game Console Repairs. Actual services formerly omitted by legacy `serviceOptions` are now selectable.

The existing contact flow receives `make`, `model` and the original internal `service` names. Device type and estimate also travel in the URL, although the current contact page does not consume those additional parameters.

Run catalog checks from the repository root:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tests/pricing/catalog.ps1
```

The comparison baseline is the original catalog at Git commit `026eac4a65f5c7bae3862010cfb3a780bc30d1ad`. A shallow clone must include that commit to run the preservation checks.

Validation completed: 312 catalog assertions passed, along with 296 headless-Chrome assertions for each of the main and legacy pricing URLs. The repository has no package manifest, build step or configured linter; `git diff --check` also passed.

Start a local static preview:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tests/serve.ps1
```

Open `http://localhost:8765/tests/pricing/browser.html` for the main page and `http://localhost:8765/tests/pricing/browser.html?page=legacy` for `/pricing.html`. Tests cover supplied examples, all iPhone screen policies, non-iPhone categories, controllers, resets, missing-price behavior, schedule/call URLs, metadata, shared asset availability and responsive widths. No contact requests or calls are submitted. Actual Safari hardware, screen readers and physical keyboard navigation still require manual review.

This branch does not deploy the site. Leave hosting routes, WordPress-era redirects and robots settings unchanged. Publish the complete commit through the existing server workflow. Update only the pricing entry's sitemap `lastmod` to the actual publication date when deploying; it has deliberately not been changed before publication. Verify the live `/pricing-2/` URL with Google Search Console afterward.
