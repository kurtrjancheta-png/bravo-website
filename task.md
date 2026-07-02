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
