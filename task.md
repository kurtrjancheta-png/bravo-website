# Weekly Posting Tally Tasks
- [x] Modify date logic to start 3 days ago instead of 7.
- [x] Add animation logic for Next/Prev transitions (sliding and fading).
- [x] Update table styling (reduced padding, modern design, highlights for "Today").
- [x] Ensure all names fit on a single page by reducing font sizes and paddings.

# S1 Signify Priv Tasks
- [x] Filter for doubled inputs in the priv form by checking both full name and serial number against existing signees. Remind cadets if they are already signified.

# Startup & Logo Tasks
- [x] Add dynamic fullscreen startup splash screen with smoke and glow animations.
- [x] Update layout metadata and browser icons to point to the new logo.png.
- [x] Register and integrate CCQ Duty Bulletin / Manager views into the main layout shell.

# CCQ Bulletin Mobile Refactoring Tasks
- [x] Minimize/reduce title card size for CCQ Duty Bulletin.
- [x] Create a Google Calendar style timeline layout for the Schedule of Conduct (SOC).
- [x] Optimize the layout grid, cards, and spacing for optimal cellphone/mobile usage.

# PWA Desktop & Mobile Icon Fixes
- [x] Identified that original logo.png had aspect ratio 1.6 (not square), causing browser installations to reject it and fallback to a default generic letter.
- [x] Created perfect 512x512 and 192x192 square logos using a PowerShell GDI+ script.
- [x] Removed white background from outer border using C# BFS flood fill script so logo blends seamlessly with dark splash screen.
- [x] Configured public/manifest.json with "purpose": "any maskable" and updated background/theme colors to dark mode.
- [x] Updated layout.jsx metadata icons to point to the square logo.
- [x] Bumped service worker cache version to force client updates.

# Notification Format Corrections & FC Redaction
- [x] Updated CCQ publish route notification formats for OC/AOC, Guards, SOC, and Best-Best categories to match the user's corrected versions exactly.
- [x] Added cleanDutyName logic to redact redundant "FC" (First Call) prefixes from duty activity names in both the calendar events and the Schedule of Calls cron routines.

# CEIS Access & Loading Centering
- [x] Grant CEIS/S6 edit access to the CCQ Bulletin Manager.
- [x] Redirect S6/CEIS logins straight to the /ccq-manager route.
- [x] Update access denied messages to guide both CCQ and CEIS credentials.
- [x] Recenter and add inline padding to "UPLOADING TO BULLETIN..." and subtitle text within the uploading animation modal to prevent off-center layout wrapping on mobile screens.

# Interactive SOC Duty Countdowns
- [x] Implement Server-Side Authentication API (/api/auth/login and /api/auth/session)
- [x] Update AuthContext.jsx to fetch and store secure sessions
- [x] Build Full-Screen Login Gate in LayoutContent.jsx
- [x] Implement File Encryption Utility (lib/crypto.js)
- [x] Integrate File Encryption/Decryption in Admin upload flows
- [x] Run build checks & verify functionality First Call.
- [x] Implement timezone-independent countdown helper matching Asia/Manila (PHT) timezone.
- [x] Add interactive onClick events to desktop table rows and mobile timeline cards in CCQBulletinClient.jsx.
- [x] Build custom animated glassmorphism Toast overlay at page bottom to display remaining or elapsed time until First Call.

# PWA Cache Invalidation & Notification Redirection Fixes
- [x] Configured custom Cache-Control headers in next.config.mjs to prevent the browser from caching sw.js and manifest.json.
- [x] Added reg.update() on client mount in LayoutContent.jsx to force service worker update checks on every application visit.
- [x] Bumped CACHE_NAME in sw.js to bravo-offline-cache-v6 to force active clients to clear out their cached pages and retrieve the latest code.

# Push Notification Deduplication
- [x] Analyzed database subscription sheets and identified duplicate endpoint registrations.
- [x] Added dynamic endpoint filtering and deduplication logic inside broadcast/route.js using a Set to filter out duplicate subscriber endpoints before dispatching push notifications.

# 9:30 PM Incoming Guards Notification & Compilation Modal
- [x] Scheduled automatic daily broadcast at exactly 9:30 PM PHT in notifications/route.js to alert all cadets to verify incoming guards list.
- [x] Programmed global query listener in LayoutContent.jsx that detects ?showIncomingGuards=true.
- [x] Integrated automated class-divided Sheets parser fetching data from EXO Guard posting trackers.
- [x] Developed clean, premium glassmorphism compiled guard detail Modal grouping FI, AFI, CCQ, ACCQ, and SENTINELS.

# Manual Guards Alert Trigger Button
- [x] Integrated a "📢 BROADCAST GUARDS ALERT" trigger button inside the CCQ Bulletin Manager's sticky footer in CCQManagerClient.jsx.
- [x] Linked the button click to trigger the push notification immediately via the /api/web-push/broadcast endpoint.

# Real-Time Weather Card Integration
- [x] Add weather state variables and Open-Meteo fetch hook to CCQBulletinClient.jsx.
- [x] Map WMO weather codes to beautiful custom icons and text labels.
- [x] Implement responsive weather box CSS styling inside CCQBulletinClient.jsx.
- [x] Inject weather card layout to the left of the clock box.

# Weather Card Clickable Hourly Forecast Modal
- [x] Expanded open-meteo API URL query to request hourly forecast parameter.
- [x] Map the 24 hourly periods to local time strings, weather descriptions, temps, apparent feels-like temps, and precipitation probabilities.
- [x] Created isWeatherModalOpen state hook and bound onClick handler to weather card.
- [x] Built gorgeous glassmorphic scrollable hourly forecast modal overlay at page bottom.

# 2nd Term Merit Allowance & Demerit Cutoff Update
- [x] Linked local repository to GitHub (`https://github.com/kurtrjancheta-png/bravo-website.git`).
- [x] Updated `app/exo-punishment/page.jsx` to filter demerit calculations by award date extracted from the "REFERENCE" column.
- [x] Demerits awarded on or before September 11, 2026 (1st Term) are excluded from the 2nd Term allowance deduction.
- [x] Only demerits awarded after September 11, 2026 (2nd Term) are deducted from the merit allowance.
- [x] Maintained full historical offense records with badges showing 1st Term (exempt) vs 2nd Term.
- [x] Updated `app/exo-punishment/ExoPunishmentClient.jsx` cards and table headers to clearly display "Accumulated Demerits (2nd Term)".
- [x] Updated `app/leaderboards/page.jsx` character discipline standings to align with the 2nd Term demerit calculation.

# 4CL Cadets Roster & SOI Integration
- [x] Updated Company Roster (`app/roster/page.jsx` & `RosterClient.jsx`) to filter, group, display, and search 4th Class (4CL) cadets alongside 1CL, 2CL, and 3CL.
- [x] Updated Troop Disposition (`app/disposition/page.jsx`) to include 4CL cadets in `rosterData` for Full Duty morning reports.
- [x] Integrated 4CL into Leaderboards (`app/leaderboards/page.jsx` & `LeaderboardsClient.jsx`) across Physical, Character, Academics, and Military standing categories.
- [x] Updated PFT Parser (`lib/pftParser.js`) and PFT Dashboard (`app/pft-tracker/PFTDashboard.jsx`) to support 4CL records, charts, class filters, class-level pass rates, and remediation strategies.
- [x] Updated CAMP Data API (`app/api/camp-data/route.js`) to parse 4CL cadets from SOI with `SERIAL NR` and evaluate 4CL physical status.
- [x] Updated Authentication (`app/api/auth/login/route.js`) to support 4CL cadet logins using their Serial Numbers and SOI data.
- [x] Updated S1 Signify Privileges (`app/signify-priv/PrivilegesClient.jsx`) to autocomplete and recognize 4CL cadets.
- [x] Updated Finance Tracker (`app/finance-tracker/FinanceDashboard.jsx`) to calculate collection statistics and render progress bars for 4CL.
- [x] Updated TacO Dashboard (`app/taco-dashboard/page.jsx`) and S2 Rifle Directory (`app/s2/rifle-directory/api.js`) for 4CL header handling and inventory.
