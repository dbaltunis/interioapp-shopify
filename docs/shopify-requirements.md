# Shopify App Requirements — Built for Shopify (BFS) Notes

*Research date: 2026-02-13*
*Sources: shopify.dev, shopify.com/partners/blog*

## Why BFS Matters
- Apps with BFS badge see **49% increase in new installs** within 14 days
- Priority visibility on App Store homepage header
- Recommended in "Recommended for you" sections
- Sidekick (Shopify AI) recommends BFS apps directly in admin
- Exclusive plan-based ad targeting (e.g. target Plus merchants only)
- Standalone search filter — merchants can filter to show only BFS apps
- Media kit for marketing your badge

## Prerequisites (Must-Have Before Applying)

### 1.2 Merchant Utility
- **Minimum 50 net installs** from active shops on paid plans
- **Minimum 5 reviews**
- Must meet **minimum recent app rating threshold**

→ **Our status:** 3 reviews, unknown install count. Need 47+ more installs and 2+ more reviews minimum.

## 2. Performance Requirements

### 2.1 Admin Performance (Web Vitals at 75th percentile)
- **LCP (Largest Contentful Paint):** ≤ 2.5 seconds
- **CLS (Cumulative Layout Shift):** ≤ 0.1
- **INP (Interaction to Next Paint):** ≤ 200ms
- Need minimum 100 calls for each metric over last 28 days
- Must use **latest version of App Bridge** for Shopify to gather metrics

→ **Action:** Use Remix + App Bridge, optimize bundle size, lazy load heavy components.

## 3. Integration Requirements

### 3.1 Embedded Apps
- App MUST be embedded in Shopify admin using latest App Bridge
- Use **session token authentication**
- All primary functionality must work within Shopify admin
- No external website required for primary workflows
- **No additional login/signup** after install — seamless onboarding
- Key metrics on app home page
- Settings/configuration available inside embedded app

### 3.2 Installation & Asset Management
- Must use **theme app extensions** (not code injection)
- App must NOT add/remove/edit merchant's theme files
- On uninstall, all app blocks must be cleanly removed
- Asset API for reading only

→ **Action:** Build all storefront components as theme app extensions.

## 4. Design Requirements

### 4.1 Familiar
App must look and behave like the Shopify admin:
- Use **Polaris** design system
- Content in card-like containers matching admin style
- Button styles must match Polaris (no custom colours like green/purple for primary)
- No serif/script fonts for majority of content
- Body text size matches admin
- Background colour matches admin (no black backgrounds)
- Proper tab behaviour
- Icons consistent in groups/lists
- Spacing matches admin
- Text meets **WCAG 2.1 AA** contrast requirements
- Sub-pages must have back button

### 4.2 Helpful (inferred from context)
- Clear onboarding
- Contextual help and documentation
- Error messages that guide users

### 4.3 User-friendly (inferred from context)
- Mobile-friendly in admin
- Fast, responsive interactions
- No confusing or misleading UI patterns

## Our Build Checklist

### Must Do
- [ ] Use Remix + latest App Bridge
- [ ] Session token auth (no OAuth redirect for embedded)
- [ ] Polaris components throughout (no custom styling that breaks admin feel)
- [ ] Theme app extensions for storefront calculator widget
- [ ] Embedded onboarding — no external signup
- [ ] Key metrics on app home page
- [ ] All settings in-admin
- [ ] Web Vitals targets: LCP ≤ 2.5s, CLS ≤ 0.1, INP ≤ 200ms
- [ ] WCAG 2.1 AA compliance
- [ ] Clean uninstall (remove all blocks/data)
- [ ] Back button on all sub-pages

### Must Reach
- [ ] 50+ net installs on paid shops
- [ ] 5+ reviews (ideally 100+ five-star)
- [ ] Maintain good app rating

### Nice to Have for Approval
- [ ] Thorough app listing (screenshots, video, description)
- [ ] Responsive support (fast reply times)
- [ ] Documentation / help centre
- [ ] Changelog / what's new

## Key Takeaways
1. **Polaris is non-negotiable** — our internal design system is for marketing/website only. The Shopify app itself must use pure Polaris.
2. **Performance matters** — must be fast. Lazy loading, code splitting, minimal bundle.
3. **50 installs + 5 reviews is the gateway** — our free tier strategy must drive this.
4. **Theme app extensions** — the calculator widget on storefronts must be a theme extension, not injected code.
5. **Seamless onboarding** — install → immediately usable. No extra steps.
