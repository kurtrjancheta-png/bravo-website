# Bravo Website Enhancements Walkthrough

Here is a summary of the accomplishments completed on the Bravo Company Website:

## 1. Lively Startup Splash Screen Animation
- **Premium Design overlay**: Created an immersive fullscreen splash screen overlay styled with glassmorphism and gold gradients.
- **Dynamic Smoke & Glow Effects**: Added custom CSS animations (`smokeMove1`/`2`/`3` and `logoGlowPulse`) generating animated smoke clouds drifting behind a glowing, pulsing logo.
- **Micro-Animations**: Animated the logo scaling up smoothly with rotation (`logoEntrance`), the title fading/sliding up, and a premium gold progress bar loading across the bottom.
- **Auto-Dismiss logic**: Mounted the splash screen dynamically and faded it out after 2.2 seconds, removing it completely from the DOM after 2.8 seconds.

## 2. Global App Logo & Icon Refresh
- **Layout Metadata**: Updated [layout.jsx](file:///C:/Users/kurtr/Downloads/BRAVO%20WEBSITE/app/layout.jsx) to reference the new `/logo.png` for all browser icons (`icon`, `apple`, `shortcut`, and PWA startup images).
- **Service Worker & Manifest**: Confirmed `/logo.png` is properly mapped as a PWA asset in `manifest.json` and cached via `sw.js`.

## 3. CCQ Duty Bulletin & CCQ Manager Integration
- **Roster & Schedule View**: Created the [CCQBulletinClient.jsx](file:///C:/Users/kurtr/Downloads/BRAVO%20WEBSITE/app/ccq-bulletin/CCQBulletinClient.jsx) layout rendering the Officer of the Day (OC), Assistant OC, Daily Guard Details, Schedule of Conduct (SOC), and Daily Best-Best Award winners.
- **Sidebar Integration**: Registered both the CCQ Duty Bulletin and CCQ Bulletin Manager links in [LayoutContent.jsx](file:///C:/Users/kurtr/Downloads/BRAVO%20WEBSITE/app/LayoutContent.jsx) under the **S1 Personnel** dropdown.
- **Role-based visibility**: Secured the CCQ Bulletin Manager link so it is only visible to logged-in users with S6/CCQ/CEIS permissions.

## 4. CCQ Bulletin Mobile Refactoring (Google Calendar Style)
- **Compact Header**: Overhauled the header to occupy the absolute minimum vertical height on mobile viewports:
  - Combined the title and time card into a single compact flex-row.
  - Subtitle is hidden on cellphones to maximize vertical space.
  - Duty Officer details are collapsed from two large cards into a single clean status bar row: `OC: [Name] | AOC: [Name]`.
- **Google Calendar-Style SOC Timeline**:
  - Replaced the classic desktop table with a vertical timeline layout.
  - Added a clean left timeline border (`.soc-timeline::before`) and interactive nodes/dots (`.soc-timeline-dot`).
  - Rendered activity events as responsive rounded cards, with uniform requirement and formation badges styled dynamically (amber and blue accents).
- **Optimized Cellphone Usability**:
  - Reorganized page grid breakpoints (`.ccq-grid` gap and paddings) so they wrap beautifully on narrow screens without overflow.
  - Rebuilt the Best-Best Awards modal as a vertical list rather than a wide table, keeping room winners and categories perfectly readable on mobile screens.

## 5. PWA Installation Logo & Transparency Fixes
- **Root Cause (White Box & Fallback)**: The original logo had a white canvas surrounding the "B" shape, which resulted in a solid white box showing up in the center of the dark PWA splash screen. 
- **Root Cause (Chrome Badge on Shortcut)**: Android/Chrome puts a small browser badge on homescreen icons when they are created as simple *shortcuts* instead of native *WebAPKs*. True WebAPK installation requires:
  1. Identical square icon files.
  2. The `purpose` of the icons declared as `"any maskable"` so the OS can safely crop/squircle them.
- **Resolution**:
  - **Transparent Background**: Wrote a C# BFS flood-fill compilation in PowerShell to strip the outer white background color from `logo_original.png` without altering the internal white detailing of the bull head and horns.
  - **Rebuilt Square Icons**: Exported the transparent result as high-fidelity square PNGs (`logo-square.png` at 512x512 and `logo-square-192.png` at 192x192). Overwrote the base `/logo.png` with the transparent 512x512 version.
  - **Maskable Purpose**: Configured [manifest.json](file:///C:/Users/kurtr/Downloads/BRAVO%20WEBSITE/public/manifest.json) to set `"purpose": "any maskable"` for the icons, enabling WebAPK packaging.
  - **Launch Screen Background Color Match**: Set `"background_color": "#080c16"` and `"theme_color": "#080c16"` in the manifest to match the page's dark theme, ensuring a seamless visual load transition.
  - **Bushed Cache Version**: Bumped `CACHE_NAME` in [sw.js](file:///C:/Users/kurtr/Downloads/BRAVO%20WEBSITE/public/sw.js) to version `v4` to force client browsers to invalidate old files and load the new transparent assets immediately.

## 6. Corrected Push Notification Formats & FC Redaction
- **Corrected Announcement Messages**: Updated the broadcast templates inside [route.js](file:///C:/Users/kurtr/Downloads/BRAVO%20WEBSITE/app/api/ccq/publish/route.js) to match your requested formats exactly:
  - **OC/AOC Posted**: `💂‍♂️ OC/AOC Updated` (Title) / `OC: CPT [Name], AOC: LT [Name]` (Body)
  - **Guards Posted**: `🛡️ Interior Guard Detail Updated` (Title) / `The interior guards detail has been posted.` (Body)
  - **SOC Uploaded**: `📅 Schedule of Calls Updated` (Title) / `A new Schedule of Calls has been uploaded for today.` (Body)
  - **Best-Best Awards**: `🏆 Best-Best Awards Published` (Title) / `The Best-Best have been publised.` (Body)
  - **Batch Publish All**: `🔔 CCQ Daily Bulletin Updated` (Title) / `The CCQ Bulletin Board has been updated for today.` (Body)
- **Redacting "FC" Duplication**: Added a custom `cleanDutyName` helper function inside [route.js](file:///C:/Users/kurtr/Downloads/BRAVO%20WEBSITE/app/api/cron/notifications/route.js) to detect when an activity cell in the Schedule of Calls sheet begins with "FC" (First Call). It strips only the first two characters (`FC`) and trims any extra whitespace, preventing redundant messages like *"It is now First Call for FC 4CL Calisthenics"*.

## 7. CEIS Edit Access & Uploading Casing Layout Fixes
- **Authorized CEIS Redirect**: Updated the redirect handler inside [LoginModal.jsx](file:///C:/Users/kurtr/Downloads/BRAVO%20WEBSITE/app/LoginModal.jsx) so that logging in as `BravoCEIS` (under the `S6` council) automatically directs the user to `/ccq-manager` rather than the default `/disseminations/s6` route.
- **Improved Access Messages**: Adjusted the authentication error screen inside [CCQManagerClient.jsx](file:///C:/Users/kurtr/Downloads/BRAVO%20WEBSITE/app/ccq-manager/CCQManagerClient.jsx) to make it clear that both the Cadet-in-Charge of Quarters (CCQ) and the CEIS Officer have full administrative capabilities on the page, with guidance to log in as either `BravoCCQ` or `BravoCEIS`.
- **Centering & Wrapping Fixes on Mobile Upload Overlay**:
  - Re-aligned the massive `UPLOADING TO BULLETIN...` header and the `Syncing data with the Google Sheets database.` paragraph text using `textAlign: 'center'`.
  - Added horizontal padding (`padding: '0 1.5rem'`) to prevent the text elements from running up against screen borders and wrapping unevenly on mobile viewports.

## 8. Interactive SOC Duty Countdowns (Click Actions)
- **Timezone-Independent Calculation**: Programmed a robust timezone translation function inside [CCQBulletinClient.jsx](file:///C:/Users/kurtr/Downloads/BRAVO%20WEBSITE/app/ccq-bulletin/CCQBulletinClient.jsx) to parse military time formats (e.g. `0420H`) and compare them to the current local date in the `Asia/Manila` (PHT) timezone, guaranteeing accurate results regardless of the user device's local clock timezone settings.
- **Hover & Selection Feedback**:
  - Desktop: Rows (`.soc-clickable-row`) now feature a smooth transition highlighting the background in golden tints (`rgba(212,175,55,0.06)`) on hover.
  - Mobile: Timeline cards (`.soc-clickable-card`) scale up smoothly, glow gold on the borders, and display a subtle drop shadow on hover.
- **Dynamic Glassmorphism Toast**: Rendered a premium fixed overlay Toast at the bottom center of the page. It automatically calculates and shows the remaining time (`Starts in Xh Ym (First Call)`) or elapsed time (`Passed Xh Ym ago`) of the clicked duty, fading out dynamically after 4 seconds.

## 9. PWA Cache Invalidation & Direct Redirection Fixes
- **Cache-Control Headers**: Programmed custom `Cache-Control` header routes in [next.config.mjs](file:///C:/Users/kurtr/Downloads/BRAVO%20WEBSITE/next.config.mjs) specifically targeting `/sw.js` and `/manifest.json` to prevent browsers from caching these files at the network level.
- **Immediate Service Worker Update checks**: Updated the registration lifecycle inside [LayoutContent.jsx](file:///C:/Users/kurtr/Downloads/BRAVO%20WEBSITE/app/LayoutContent.jsx) to invoke `reg.update()`. This forces the client browser to verify the service worker status on every single page visit rather than waiting for the default 24-hour cycle.
- **Evicted Stale Page Caches**: Bumped the service worker's `CACHE_NAME` to `bravo-offline-cache-v6` in [sw.js](file:///C:/Users/kurtr/Downloads/BRAVO%20WEBSITE/public/sw.js) to trigger cache eviction. This will completely wipe out old, cached HTML page copies on client phones/laptops and load the fresh layouts immediately.

## 10. Push Notification Duplicate Filtering
- **Root Cause**: Investigated the subscriber database sheet and confirmed that when a user registers or re-enables PWA alerts, it sometimes logs multiple identical endpoint entries in the `PUSH_SUBSCRIBERS` tab, causing the broadcast route to map and trigger multiple parallel push requests to the same device.
- **On-The-Fly Deduplication**: Integrated a new `Set`-based filtration query inside the Next.js broadcast API [route.js](file:///C:/Users/kurtr/Downloads/BRAVO%20WEBSITE/app/api/web-push/broadcast/route.js). It screens and dedupes all target endpoints dynamically before sending payloads to Google/Mozilla push servers, ensuring a subscriber never receives more than one alert per broadcast.

## 11. Automated 9:30 PM Barracks Guards Notifications & Compiled Modal
- **Chron Daily Alert**: Configured a recurring check inside the cron route [route.js](file:///C:/Users/kurtr/Downloads/BRAVO%20WEBSITE/app/api/cron/notifications/route.js) that triggers at exactly 9:30 PM (2130H) Philippines Standard Time, broadcasting the custom barracks guards verification push notification message.
- **Client-Side Query Trigger**: Implemented a global listener in the root layout [LayoutContent.jsx](file:///C:/Users/kurtr/Downloads/BRAVO%20WEBSITE/app/LayoutContent.jsx) that catches the URL query parameters (e.g. `?showIncomingGuards=true`) when clicking a push notification and cleans up the browser address bar dynamically.
- **EXO Tracker Parser**: Programmed a dynamic, parallel fetch routine fetching data from the three EXO Guard Posting Apps Scripts (1CL, 2CL, 3CL) and compiling the next day's incoming guard details.
- **Premium Compilation Modal**: Built a premium glassmorphic modal overlay grouping incoming barracks details for the roles of **FI**, **AFI**, **CCQ**, **ACCQ**, and **SENTINELS** in a clean, scroll-safe layout.

## 12. Manual guards alert trigger in CCQ Bulletin Manager
- **Sticky Footer Action**: Embedded a custom gold-bordered button `📢 BROADCAST GUARDS ALERT` inside [CCQManagerClient.jsx](file:///C:/Users/kurtr/Downloads/BRAVO%20WEBSITE/app/ccq-manager/CCQManagerClient.jsx) right next to the "PUBLISH ALL BULLETIN UPDATES" button.
- **Push Broadcast Trigger**: Clicking this button invokes the `/api/web-push/broadcast` API, enabling CCQs or S6 Admins to manually broadcast the verification alert to all subscribers at any hour with a single press.

## 13. Real-Time PMA Baguio Weather Integration
- **Keyless Meteorological fetch**: Connected the CCQ bulletin interface to the Open-Meteo API using exact latitude/longitude coordinates (`16.3609° N, 120.6197° E`) for the Philippine Military Academy (PMA), Fort Del Pilar, Baguio City.
- **Weather State Parsing**: Implemented dynamic code translation mapping WMO weather codes to descriptive labels and representative weather emojis. Calculates Celsius temperature, apparent feels-like temperature, and relative humidity.
- **Premium Glassmorphic Layout**: Positioned the weather card directly to the left of the military clock in the header of [CCQBulletinClient.jsx](file:///C:/Users/kurtr/Downloads/BRAVO%20WEBSITE/app/ccq-bulletin/CCQBulletinClient.jsx) with custom hover glow transitions and fully responsive mobile auto-wrapping.

## 14. Interactive Weather Forecast Modal
- **Expanded Weather Query**: Appended parameters for hourly forecast to Open-Meteo API call inside [CCQBulletinClient.jsx](file:///C:/Users/kurtr/Downloads/BRAVO%20WEBSITE/app/ccq-bulletin/CCQBulletinClient.jsx) to fetch 24-hour meteorological predictions.
- **Hourly Forecast compilation**: Mapped WMO weather codes, Celsius temperatures, feels-like coordinates, and precipitation probabilities (rain indicators) into individual hour objects.
- **Scenic Forecast Modal**: Tapping the weather card opens a premium glassmorphic dialog. It renders a clean scrolling timeline presenting the hourly weather conditions in Baguio City for the day, closing cleanly with an gold accent close button.

## 15. Schedule of Calls (SOC) Changes Modal, Manager Toggles, and Automatic Broadcasts
- **Automatic Change Tracking & Grammar Conditioning**:
  - Implemented a parser in [route.js](file:///c:/Users/kurtr/Downloads/BRAVO%20WEBSITE/app/api/ccq/publish/route.js) that monitors manual or uploaded SOC changes (added, cancelled, time changed, place changed, and uniform changed).
  - Generates grammatical announcements using requested phrases (*Likewise*, *Furthermore*, *Moreover*) and formatting (e.g. *Changes of Schedule: First Call for [duty] is moved to: [time]*, *Changes of Schedule: At [time], First Call for [new duty], Uniform is: [uniform], and formation is: [location]*).
  - Automatically broadcasts these changes as web push notifications immediately upon publishing.
- **Cancellation Strike-through**:
  - Updated [CCQBulletinClient.jsx](file:///c:/Users/kurtr/Downloads/BRAVO%20WEBSITE/app/ccq-bulletin/CCQBulletinClient.jsx) and [CCQManagerClient.jsx](file:///c:/Users/kurtr/Downloads/BRAVO%20WEBSITE/app/ccq-manager/CCQManagerClient.jsx) to support cancellation states. Toggling the `❌` button marks a duty as cancelled rather than deleting it.
  - Cancelled duties are rendered with a premium red-tinted background, lowered opacity, and a clean line-through text strikeout.
- **Public Changes Modal**:
  - Integrated a `📋 Changes` button inside the Schedule of Calls card header on the public bulletin board.
  - Clicking it opens a beautiful glassmorphic modal listing all today's compiled schedule changes split into clean, readable bullet points.

## 16. Permanent Changelog Sheet Persistence with Interactive Prompts
- **Interactive Prompts for Changes**:
  - Updated [CCQManagerClient.jsx](file:///c:/Users/kurtr/Downloads/BRAVO%20WEBSITE/app/ccq-manager/CCQManagerClient.jsx) so that clicking the `🕒`, `📍`, or `👔` change buttons next to any duty row opens a modal overlay.
  - The modal dynamically requests the user to input the new time, formation place, or uniform value (pre-populating the input with the current value).
- **Changelog sheet writing**:
  - Clicking "Submit Changes" inside the modal calls a dedicated Apps Script endpoint `addChangelog`.
  - The Google Apps Script automatically inserts a new sheet named `CHANGELOG` in the spreadsheet (if it doesn't already exist) and appends a row containing `TIMESTAMP`, `DUTY`, `CHANGE_TYPE`, `NEW_VALUE`, and `ANNOUNCEMENT_TEXT`.
  - The local manager's table updates instantly to highlight the change state in real-time.

## 17. S4 Logistics Inventory Dashboard
- **Sidebar Dropdown Navigation**: Converted the single "S4 Logistics" link in the left sidebar of [LayoutContent.jsx](file:///c:/Users/kurtr/Downloads/BRAVO%20WEBSITE/app/LayoutContent.jsx) into a collapsible details dropdown menu containing:
  - **Inventory Dashboard** (linking to `/s4-inventory`)
  - **Disseminations** (linking to `/disseminations/s4`)
- **Server-Side Side-by-Side Sheet Parser**:
  - Implemented data extraction in [page.jsx](file:///c:/Users/kurtr/Downloads/BRAVO%20WEBSITE/app/s4-inventory/page.jsx) pulling live inventory rows from Google Sheets.
  - Parsed three separate tables placed side-by-side (`Electronics & Appliances`, `Furniture`, `Miscellaneous`).
  - Implemented dynamic fallback tracking that resolves merged spreadsheet category header values.
- **Logistics KPI Cards**:
  - Created key metrics displaying total company items quantity, overall operational readiness rate (usable/complete vs faulty), and category stock density.
- **Interactive Multi-Level Filtering**:
  - Created global search and dropdown selection filters for category types, condition status, and specific locations parsed from sheet remarks (e.g. Clubroom, EI Room, Stockroom, CQ Station).
- **Dark-Themed Grid Layout**:
  - Added custom icons matching item types, glowing color-coded condition badges (green for Complete/Usable, red for Faulty), and specific tags for locations.
  - Added a premium gold edit action button for authorized S4 Logistics Admins to manage the sheet directly in Google Drive.

## 18. Push Notification System Authorization & Background Auto-Registration Fixes
- **Server-to-Server Internal Broadcast Bypassed 403**:
  - Extracted the core notification delivery engine (VAPID key configuration, subscriber listing, deduplication, Apple/Google/Mozilla push dispatch, and expired endpoint pruning) into a standalone module [pushBroadcast.js](file:///c:/Users/kurtr/Downloads/BRAVO%20WEBSITE/lib/pushBroadcast.js).
  - Refactored the `/api/web-push/broadcast` HTTP route handler [route.js](file:///c:/Users/kurtr/Downloads/BRAVO%20WEBSITE/app/api/web-push/broadcast/route.js) to import and call `broadcastNotification`.
  - Updated both the CCQ publishing route [route.js](file:///c:/Users/kurtr/Downloads/BRAVO%20WEBSITE/app/api/ccq/publish/route.js) and the automated cron notification engine [route.js](file:///c:/Users/kurtr/Downloads/BRAVO%20WEBSITE/app/api/cron/notifications/route.js) to call the `broadcastNotification` helper directly on the server instead of sending localhost HTTP fetch requests. This resolves the `403 Forbidden` error caused by missing session authentication cookies during automated or server-side broadcasts.
- **Client-Side Background Auto-Subscription**:
  - Refactored `subscribeUser` in [LayoutContent.jsx](file:///c:/Users/kurtr/Downloads/BRAVO%20WEBSITE/app/LayoutContent.jsx) to support an optional `{ silent: true }` parameter, suppressing all user-facing success or failure alert boxes.
  - Added background auto-subscription logic in the service worker registration `useEffect` check: if the browser already has notification permission granted (`Notification.permission === 'granted'`) but no active subscription is registered, it automatically creates the push subscription and uploads it to the database silently, ensuring active subscribers do not fall out of the system.

## 19. Mobile Navigation Swipe Gestures Optimization
- **Expanded Swipe-Start Zone**: Increased the touch start coordinate threshold (`touchStartX`) from `60px` to `120px` from the left edge of the screen, allowing cellphone users to easily initiate the left-to-right swipe-open gesture even when using phone cases or edge-to-edge screens.
- **Lowered Swipe Distance Threshold**: Lowered the minimum horizontal swipe distance from `50px` to `40px` to make the gesture more responsive and natural on small phone screens.
- **Vertical Scroll Locking**: Configured the `touchmove` listener with `{ passive: false }` and added dynamic scroll locking (`e.preventDefault()`) when the user initiates a primarily horizontal swipe. This prevents the parent page from jumping or scrolling vertically while opening or closing the sidebar.

## 20. Default Dark Theme Support
- **SSR Dark Mode Class**: Configured [layout.jsx](file:///c:/Users/kurtr/Downloads/BRAVO%20WEBSITE/app/layout.jsx) to add the `dark-mode` class directly to the HTML `<body>` by default. This ensures pages render in dark mode immediately during initial HTML loads and server-side rendering (SSR), completely eliminating light theme visual flashes.
- **Default State and Preferences Initialization**: Updated the `isDarkMode` state inside [LayoutContent.jsx](file:///c:/Users/kurtr/Downloads/BRAVO%20WEBSITE/app/LayoutContent.jsx) to initialize as `true` and modified the startup `useEffect` hook to default to `true` (dark mode) if the user has not explicitly configured a preference in `localStorage`.

- All files have been updated, successfully verified, and saved.

## 21. Real-Time Next Duty Card
- **Automated Time Calculations**: Implemented dynamic selection of the next upcoming duty from `socRows` based on time, automatically filtering out cancelled or un-timed activities.
- **Premium Side-by-Side Presentation**: Added a gold-accented card directly above the Schedule of Calls (SOC) displaying the upcoming duty activity name on the left and a live-updating countdown (updated every second) on the right.
- **Interactive Toasts**: Bound the card to the bulletin's glassmorphic toast notification component, enabling users to click the card and view the exact remaining or elapsed time instantly.

## 22. CAMP Tracker Status Fallback Update
- **Character Column Fallback**: Updated the inactive character status fallback badge in the CAMP Tracker table from `DUTY` to `N/A`, avoiding user confusion when no character punishments are currently active.

---

### Verification & Deployment
- All files have been updated, successfully verified, committed, and pushed to trigger the automatic Vercel deployment.
