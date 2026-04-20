# Debit Date Simulator

Static React app for visualising debit schedules against fulfilment / dispatch timing over a rolling two-year window.

## Approach

- React + Vite + TypeScript for a GitHub Pages-friendly static build.
- date-fns for local-time schedule calculations.
- Pure schedule generation logic lives separately from the calendar UI.
- Assumptions are explicit in both code and UI so operations teams can adjust them safely.

## Key assumptions

- Timezone is always the browser's local timezone. No UTC conversions are used.
- Calendar range is today through today + 2 years, inclusive.
- 4-weekly mode defaults the first debit to sign-up date + 28 days.
- Monthly mode defaults to day 15 and calculates the next debit on or after the sign-up date.
- Welcome Pack dispatch is the next Tuesday after sign-up (if sign-up is on a dispatch Tuesday, that fulfilment is missed).
- Monthly Pack #1 defaults to the first Tuesday of the month after the Welcome Pack month so the Welcome Pack is always first.

## Project structure

```text
debit-date-simulator/
  .github/workflows/deploy.yml
  index.html
  package.json
  README.md
  src/
    App.tsx
    config.ts
    index.css
    main.tsx
    types.ts
    components/
      CalendarGrid.tsx
      Legend.tsx
      MonthNavigator.tsx
      MonthSidebar.tsx
    lib/
      dateUtils.ts
      schedules.test.ts
      schedules.ts
  tsconfig.json
  vite.config.ts
```

## Local run

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the dev server:

   ```bash
   npm run dev
   ```

3. Run unit tests:

   ```bash
   npm run test
   ```

4. Build the production bundle:

   ```bash
   npm run build
   ```

## GitHub Pages deployment

This project includes a Pages workflow at `.github/workflows/deploy.yml`.

### Base path handling for Vite

The Vite config auto-detects the repository name inside GitHub Actions and sets:

```ts
base: process.env.GITHUB_ACTIONS && repoName ? `/${repoName}/` : '/'
```

That keeps local development on `/` while still producing correct asset URLs for repository-based GitHub Pages.

### Steps

1. Push this folder and workflow to the repository's default branch, usually `main`.
2. In GitHub, open Settings > Pages.
3. Set Source to `GitHub Actions`.
4. Push to `main` or run the workflow manually.
5. GitHub will publish the built `dist/` artifact.

### Important note for GitHub Free

On GitHub Free, GitHub Pages for repositories requires a public repository. Private repository Pages support requires a paid plan. Do not place secrets or sensitive internal data in the repo.

## Schedule logic API

The app keeps the date logic pure and testable:

- `generateDebitDates(...)`
- `generateFulfilmentDates(signupDate, config)`
- `getNextMonthlyDebitDate(...)`
- `getDefaultFourWeeklyFirstDebitDate(...)`

## Future improvements

- Add URL state so scenarios can be shared via query parameters.
- Add export to CSV for visible month summaries.
- Add a year overview mode if planners need broader trend scanning.
