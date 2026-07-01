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
