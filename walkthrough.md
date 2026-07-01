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

---

### Verification & Deployment
- All files have been staged, committed, and successfully pushed to the remote repository `main` branch.
