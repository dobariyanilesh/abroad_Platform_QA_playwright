# Test Report: Admin › Home (/admin/home)

| | |
|---|---|
| **Environment** | RC: `https://rc-admin.abroad.io` / `rc-api.abroad.io`, Chromium (Playwright 1.63), Windows 10 |
| **Page** | `/admin/home`, plus the sidebar search and profile menu shown on it |
| **Tested** | 2026-09-24, QA admin account |
| **Evidence** | `screenshots/home/` |
| **Interactive report** | https://claude.ai/artifact/SZy5W1kVBXtt41WAsERTya |

**Result:** 67 test cases: 50 passed, 14 failed, 3 observations. 12 bugs: 0 High, 4 Medium, 8 Low.

**Method.** Live RC data verified against the API responses the page uses (`/quests`, `/admin/count`) and the destination list pages. Edge cases (empty data, API errors, in-progress/completed trips, singular counts, long/HTML/blank names, large and zero counts) were rendered by intercepting those two API responses in the browser. Nothing was written to the server. Viewports: 1920, 1440, 1280, 1024, 768, 375. Time zones: IST, Los Angeles, Auckland.

No test data was created. Opening "Start from scratch" was checked afterwards: the experience count stayed at 29 and no untitled draft was left behind.

## Bug summary

| ID | Severity | Area | Title |
|---|---|---|---|
| BUG-01 | Medium | Current + upcoming | Experience cards label the total readiness count as "prep issues" |
| BUG-02 | Medium | Error handling | One failed Home API sends the whole admin to the "under maintenance" page |
| BUG-03 | Medium | Sidebar search | Search results panel covers the search box, runs off screen, cuts names and ignores Esc |
| BUG-04 | Medium | Needs attention | Needs attention silently shows only 3 items |
| BUG-05 | Low | Admin shortcuts | Assessment tile is disabled but looks like a working link |
| BUG-06 | Low | Needs attention | Wrong grammar for single items: "1 readiness item still need attention" |
| BUG-07 | Low | Sidebar search | Global search does not return experiences |
| BUG-08 | Low | Admin shortcuts | Shortcut labels don't match where they go |
| BUG-09 | Low | Current + upcoming / Needs attention | Blank experience name shows an empty card title |
| BUG-10 | Low | Current + upcoming | Card header shows the location unlabelled, e.g. just "11" |
| BUG-11 | Low | Responsive | At 1024 px the sidebar opens over the page and hides the heading |
| BUG-12 | Low | Responsive | On phones the gold feather icon hangs below the header over the content |

---

## BUG-01: Experience cards label the total readiness count as "prep issues"
**Severity:** Medium · **Area:** Current + upcoming

**Steps**
1. Open /admin/home.
2. Look at the card for "A deeply transformative experience": it shows "9 prep issues".
3. Open the experience (Overview tab).

**Expected:** The number counts what its label says, or the label says what the number counts ("9 readiness issues").

**Actual:** The 9 is Prosperity 5 + Enrollment 1 + Prep 3. The Overview shows Prosperity "5 issues", Enrollment "1 issue", Departure prep "In progress". The draft card shows "11 prep issues" (7 + 2 + 2) while only 2 are prep. Needs attention on the same page correctly calls the same 9 "readiness items".

**Impact:** Admins will look in Participant prep for issues that are actually on the Prosperity page and in Enrollment.

**Evidence:** `screenshots/home/HP_01_home_overview.png`, `screenshots/home/BUG_HP_prep_issues_overview_breakdown.png`

## BUG-02: One failed Home API sends the whole admin to the "under maintenance" page
**Severity:** Medium · **Area:** Error handling

**Steps**
1. Make GET /quests?page=1&limit=500&isArchived=false return HTTP 500 (done here with browser request interception).
2. Open /admin/home.
3. Repeat with GET /admin/count returning 500.

**Expected:** Only the affected section shows an error with a Retry; the rest of Home and the sidebar stay usable.

**Actual:** Either failure redirects to /under-maintenance: "Oops, Something went wrong! / Oh No" plus a red toast. The sidebar disappears. If the failure is only the shortcut counts, the whole dashboard is still lost. The error page's background also stops short, leaving a white band along the bottom.

**Impact:** A single slow or failing count endpoint takes admins off every Home action and presents the platform as down.

**Evidence:** `screenshots/home/BUG_HP_count_api_500_under_maintenance.png`, `screenshots/home/BUG_HP_quests_api_500_under_maintenance.png`

## BUG-03: Search results panel covers the search box, runs off screen, cuts names and ignores Esc
**Severity:** Medium · **Area:** Sidebar search

**Steps**
1. On Home at 1440×900, click the sidebar Search box.
2. Type "Dhruvi".
3. Press Esc.

**Expected:** Results open next to the input, the typed query stays visible, the panel fits the viewport, long names wrap or end in "…", and Esc closes it.

**Actual:** The panel opens over the input (the element at the input's position is a result row), so what you typed can't be seen or corrected. It is 248 px tall starting at y = 672, so its last ~20 px are below a 900 px screen. At 1920×1080 the list starts at the bottom edge and most results are off screen. Rows are clipped at the 190 px sidebar edge ("A deeply transformative expe") with no ellipsis, and the group chevrons are cut. Esc leaves it open.

**Impact:** Global search is hard to use on common laptop screens.

**Evidence:** `screenshots/home/BUG_HP_search_panel_covers_input.png`, `screenshots/home/BUG_HP_search_panel_offscreen_1920.png`, `screenshots/home/BUG_HP_search_no_experiences_truncated.png`

## BUG-04: Needs attention silently shows only 3 items
**Severity:** Medium · **Area:** Needs attention

**Steps**
1. Open /admin/home.
2. Count experiences with open readiness items in /quests: 18 published plus 8 drafts.
3. Compare with the Needs attention list (also tried with 12 mocked items).

**Expected:** All items are listed, or the section says how many more there are and links to them ("15 more → View all").

**Actual:** Exactly 3 rows, with no total, "more" link or hint that the list is cut. E.g. QA Field Test Experience 2K26 (52 days, 2 prep issues) and November Quest 2026 (62 days) never appear on Home.

**Impact:** The section promises "what needs attention across the Client Platform", but most of that work is invisible from it.

**Evidence:** `screenshots/home/HP_01_home_overview.png`, `screenshots/home/BUG_HP_needs_attention_capped_at_3.png`

## BUG-05: Assessment tile is disabled but looks like a working link
**Severity:** Low · **Area:** Admin shortcuts

**Steps**
1. Scroll to Admin shortcuts.
2. Hover and click "Assessment 1,464".
3. Tab through the shortcuts.

**Expected:** Either it opens an assessments page, or it looks unavailable (dimmed, no arrow, tooltip explaining why).

**Actual:** It is a <div class="… is-disabled"> with pointer-events: none. Opacity, colours and the → arrow match the live tiles, there is no tooltip, and Tab skips it. It also reuses the "%" icon of Active Promo codes.

**Impact:** Looks broken to anyone who clicks it.

**Evidence:** `screenshots/home/HP_02_admin_shortcuts.png`

## BUG-06: Wrong grammar for single items: "1 readiness item still need attention"
**Severity:** Low · **Area:** Needs attention

**Steps**
1. Have an experience with exactly 1 open readiness item (e.g. November Quest 2026, Tyche Test), or a draft with 1 item.
2. View it in Needs attention.

**Expected:** "1 readiness item still needs attention." / "1 item remains in the draft."

**Actual:** "1 readiness item still need attention." / "1 item remain in the draft." The noun is made singular but the verb isn't. Cards also read "1 / 1 participants".

**Impact:** Visible copy error on the landing page.

**Evidence:** `screenshots/home/BUG_HP_grammar_item_remain.png`, `screenshots/home/HP_08_in_progress_status.png`

## BUG-07: Global search does not return experiences
**Severity:** Low · **Area:** Sidebar search

**Steps**
1. In sidebar Search type "deeply" (part of "A deeply transformative experience").

**Expected:** The experience is listed under an Experiences group.

**Actual:** Only a Network with a similar name. /admin/wide-search returns companies, ecosystems, users and teams only.

**Impact:** Experiences, the main object on Home, can't be found from the search box on the same screen.

**Evidence:** `screenshots/home/BUG_HP_search_no_experiences_truncated.png`

## BUG-08: Shortcut labels don't match where they go
**Severity:** Low · **Area:** Admin shortcuts

**Steps**
1. Click "Email Sequencing".
2. Compare other shortcut labels with the sidebar and page titles.

**Expected:** One name per destination.

**Actual:** "Email Sequencing" opens Analytics › Scheduled Emails, headed "Registered users" (empty: "No email users found."). Also "Network" vs sidebar "Networks", and "Account / Settings" opens "Accounts" under Analytics, not Settings.

**Impact:** Admins can't tell whether they landed in the right place.

**Evidence:** `screenshots/home/BUG_HP_email_sequencing_registered_users.png`

## BUG-09: Blank experience name shows an empty card title
**Severity:** Low · **Area:** Current + upcoming / Needs attention

**Steps**
1. Have an experience whose name is empty or spaces only (mocked here).
2. Open Home.

**Expected:** A fallback such as "Untitled experience".

**Actual:** The card has no title line, and the Needs attention row starts with "· cannot publish yet".

**Impact:** The row can't be identified. It only happens if a name slips past validation, but Home should still cope.

**Evidence:** `screenshots/home/BUG_HP_blank_name_and_long_values.png`

## BUG-10: Card header shows the location unlabelled, e.g. just "11"
**Severity:** Low · **Area:** Current + upcoming

**Steps**
1. Look at the top-right of the "A deeply transformative experience" card.

**Expected:** A recognisable location, or nothing.

**Actual:** Shows "11", the raw location field, next to "1 / 11 participants", so it reads like a count. Root cause is that Setup › Location accepts "11". Duration is "10" and group size "11" on the same record.

**Impact:** Misleading number on the landing page; points to missing validation in Setup.

**Evidence:** `screenshots/home/HP_01_home_overview.png`

## BUG-11: At 1024 px the sidebar opens over the page and hides the heading
**Severity:** Low · **Area:** Responsive

**Steps**
1. Open Home at 1024×768 (tablet landscape).

**Expected:** Content visible on load; sidebar collapsed or beside the content.

**Actual:** The sidebar is open by default and overlays the page, covering the "Home" heading, subtitle and left card, until you close it. 1100 px and wider are fine.

**Impact:** The first view on tablets is half hidden.

**Evidence:** `screenshots/home/BUG_HP_1024_sidebar_overlaps_content.png`

## BUG-12: On phones the gold feather icon hangs below the header over the content
**Severity:** Low · **Area:** Responsive

**Steps**
1. Open Home at 375×812 or 768×1024.
2. Scroll.

**Expected:** Header icons stay inside the header bar.

**Actual:** The feather icon (img.tooltip-icon) sits half below the header and floats over cards and shortcut arrows while scrolling.

**Impact:** Cosmetic; can cover tap targets on the right edge.

**Evidence:** `screenshots/home/BUG_HP_mobile_feather_icon_overlap.png`, `screenshots/home/HP_10_mobile_375.png`

## Observations (not logged as bugs)

- Time to content is 6–7.5 s even though /quests answers in ~0.8 s; most of the wait is front-end start-up before the requests go out.
- Home loads /quests with limit=500 and counts on the client. Once there are more than 500 non-archived experiences, At a glance and the card selection will be wrong without warning.
- At a glance tiles (In progress / Upcoming / Draft / Completed) aren't clickable; linking each to a filtered experience list would save a step.
- Long experience names aren't clamped, so one long name makes its card much taller than the others in the row.
- Out of scope but seen from Home: the Overview of "A deeply transformative experience" says "The Prosperity page and enrollment are ready" while showing 5 Prosperity issues and 1 Enrollment issue.
- Console: "[bugsnag] Bugsnag.start() was called more than once" on every load. Stripe.js also loads on Home although it has no payment UI; in this test environment it failed on DNS, which throws uncaught "Failed to load Stripe.js" errors.
- /admin/ecosystem (used by Users/Networks pages) returns 354 rows of which 45 are duplicates; the Home count (309) correctly uses distinct networks.

## Test cases


### Access & loading

| ID | Test case | Steps | Expected | Actual | Status |
|---|---|---|---|---|---|
| TC-HP-01 | Logged-in admin opens /admin/home | Log in (email, password, 2FA) → land on /admin/home | Home loads with 4 sections: Current + upcoming, Needs attention, At a glance, Admin shortcuts | All 4 sections render with live data | Pass |
| TC-HP-02 | Logged-out visitor opens /admin/home | New browser, no session → open /admin/home | Redirect to sign-in; no dashboard data shown | Redirected to rc.abroad.io/?next=…/admin/home; no data requested | Pass |
| TC-HP-03 | Browser tab title | Open Home, read document title | Title names the page | "Home \| Abroad" | Pass |
| TC-HP-04 | Loading state | Open Home and capture at 1.5 s / 3 s / 4.5 s | A loader shows until data arrives; no half-rendered cards | Sidebar + gold spinner, then the full page at once | Pass |
| TC-HP-05 | Reload keeps the user on Home | Press F5 on Home | Home reloads with same data, session kept | Reloaded, same data | Pass |
| TC-HP-06 | Time to content | Measure navigation → "Admin shortcuts" visible (3 runs); time the page APIs directly | Content within ~3 s | 6.1–7.5 s to content. /quests itself answers in 0.8 s, /admin/count in 0.5 s, so the delay is front-end start-up | Observation |

### Header actions

| ID | Test case | Steps | Expected | Actual | Status |
|---|---|---|---|---|---|
| TC-HP-07 | "All experiences" button | Click All experiences | Opens /admin/experiences | Opens /admin/experiences | Pass |
| TC-HP-08 | "New experience" menu | Click New experience ▾ | Menu with the create options | CREATE: "Start from scratch", "Copy from another experience", each with a description | Pass |
| TC-HP-09 | Start from scratch | New experience ▾ → Start from scratch | Opens the blank create flow without saving a record yet | Opens /admin/experiences/create-new; experience count unchanged (29) | Pass |
| TC-HP-10 | Copy from another experience | New experience ▾ → Copy from another experience | Opens a picker of existing experiences | "Copy from another experience" dialog with search and experience list | Pass |
| TC-HP-11 | Menu dismissal | Open the menu → Esc; open again → click outside | Menu closes both ways | Closes on Esc and on outside click | Pass |

### Current + upcoming

| ID | Test case | Steps | Expected | Actual | Status |
|---|---|---|---|---|---|
| TC-HP-12 | Three nearest experiences by start date | Compare cards with /quests data (29 experiences) | Current trip first, then the next two by start date | Dhruvi Test Experience itinerary (20–24 Sep, running), A deeply transformative experience (28 Sep), OCT Experience (1 Oct): matches data | Pass |
| TC-HP-13 | Status badge | Check badge on each card, live + mocked data | Draft / Upcoming / In progress match publish state and dates | Correct for all states, including an unpublished trip whose dates are today (stays Draft) | Pass |
| TC-HP-14 | Date range and "days away" | Compare with programme dates; today = 24 Sep 2026 | "28 Sep – 4 Oct 2026 · 4 days away"; "1 day away" for tomorrow | Correct, singular "1 day away" handled | Pass |
| TC-HP-15 | In-progress progress | Mock a published trip 22–26 Sep | Shows "Day 3 of 5" | "22–26 Sep 2026 · Day 3 of 5"; badge IN PROGRESS | Pass |
| TC-HP-16 | Participants vs capacity | Compare "1 / 11 participants" with participantsCount / groupSize | Enrolled / capacity; capacity omitted when not numeric | "1 / 11"; "0 participants" when group size is a range like "15-30 Participants" | Pass |
| TC-HP-17 | Issue count on card | Compare the card's "N prep issues" with the experience Overview readiness | Number and label describe the same thing | "9 prep issues" = Prosperity 5 + Enrollment 1 + Prep 3; Overview shows prep as "In progress" | Fail (BUG-01) |
| TC-HP-18 | Location in card header | Read the top-right text on each card | Clearly a location | Unlabelled raw value; one card shows just "11" | Fail (BUG-10) |
| TC-HP-19 | Draft CTA | Click "Continue setup" on a draft | Opens the draft's setup step | /admin/experiences/{id}/build/setup-name | Pass |
| TC-HP-20 | Published CTA | Click "Open experience" on a published card | Opens the experience overview | /admin/experiences/{id}/overview | Pass |
| TC-HP-21 | Whole card is clickable | Click the card title / body | Same destination as the CTA | Same destination | Pass |
| TC-HP-22 | "View all experiences" link | Click View all experiences → | Opens the experience list | /admin/experiences | Pass |
| TC-HP-23 | Empty state | Mock /quests → [] | Friendly empty state, counts show 0 | "No current or upcoming experiences / Create an experience to see it here…"; Needs attention hidden; At a glance 0/0/0/0 | Pass |
| TC-HP-24 | Long name and location | Mock a 250-char name and 80-char location | Text wraps inside the card, nothing overflows | Wraps, no overflow. Not clamped, so one card grows much taller than its row | Pass |
| TC-HP-25 | HTML in experience name (XSS) | Mock name `<img src=x onerror=…>Bold <b>tag</b>` | Shown as literal text, no script runs | Rendered as text; handler never ran | Pass |
| TC-HP-26 | Blank / whitespace-only name | Mock name "   " | Fallback such as "Untitled experience" | Empty title; Needs attention row reads "· cannot publish yet" | Fail (BUG-09) |
| TC-HP-27 | Experience without dates | Mock experiences with no programme dates | Placeholder such as "Dates not set" | Date line is simply missing; card still ranks among "nearest by start date" | Observation |

### Needs attention

| ID | Test case | Steps | Expected | Actual | Status |
|---|---|---|---|---|---|
| TC-HP-28 | Published experiences with open readiness, soonest first | Compare list with /quests readiness data | Items with issues, soonest first | A deeply transformative (4 days), Wisdom Quest 2026 (31 days), True Prosperity Discover (52 days) | Pass |
| TC-HP-29 | Readiness count | Compare badge with prosperity + enrollment + prep issues | Badge equals the total | 9 = 5 + 1 + 3; 2 = 0 + 0 + 2; 3 = 0 + 1 + 2 | Pass |
| TC-HP-30 | Review → destination | Click each Review → | Opens that experience | Each opens the matching /overview | Pass |
| TC-HP-31 | In-progress items | Mock trips running today with prep issues | Flagged as departure prep with a Fix action | "… · departure prep", "Fix →", red badge | Pass |
| TC-HP-32 | Draft items | Mock an unpublished trip with issues | Shows why it can't publish | "… · cannot publish yet / N items remain in the draft / Continue →" | Pass |
| TC-HP-33 | Completed trips excluded | Mock a trip that ended yesterday with 2 issues | Not listed | Not listed; counted under Completed | Pass |
| TC-HP-34 | Every item needing attention is reachable | Live: 18 published experiences have open items; mock 12 | All shown, or "N more" / "View all" link | Only 3 rows, no count or link to the rest | Fail (BUG-04) |
| TC-HP-35 | Singular wording | Mock items with exactly 1 issue | "1 readiness item still needs attention", "1 item remains" | "1 readiness item still need attention.", "1 item remain in the draft." | Fail (BUG-06) |

### At a glance

| ID | Test case | Steps | Expected | Actual | Status |
|---|---|---|---|---|---|
| TC-HP-36 | Portfolio counts match data | Compute from /quests: published & running / future / unpublished / ended | 0 / 21 / 8 / 0 | 0 In progress, 21 Upcoming, 8 Draft, 0 Completed | Pass |
| TC-HP-37 | Counts follow status changes | Mock 2 running, 1 future, 1 draft, 2 ended | 2 / 1 / 1 / 2 | 2 / 1 / 1 / 2 | Pass |
| TC-HP-38 | "Open experience list" button | Click it | Opens /admin/experiences | Opens /admin/experiences | Pass |
| TC-HP-39 | Count tiles | Click the "21 Upcoming" tile | Optional: filtered list | Not clickable (display only) | Observation |

### Admin shortcuts

| ID | Test case | Steps | Expected | Actual | Status |
|---|---|---|---|---|---|
| TC-HP-40 | Users | Compare count with /admin/count; click | 3,091; opens /admin/users | 3,091; opens "User accounts" | Pass |
| TC-HP-41 | Organizations | Compare with /companies list; click | 138; opens /admin/organizations | 138 = 138 companies; opens Organizations | Pass |
| TC-HP-42 | Network | Compare with /admin/ecosystem; click | 309; opens /admin/networks | 309 = distinct networks (API returns 354 rows incl. 45 duplicates); opens Networks | Pass |
| TC-HP-43 | Groups | Compare with /admin/count; click | 274; opens /admin/groups | 274; opens Groups | Pass |
| TC-HP-44 | Coaches | Compare with coach capacity list; click | 32; opens /admin/coaches | 32 = 32 coaches; opens "Coach accounts" | Pass |
| TC-HP-45 | Active Promo codes | Count codes with status active in /promo; click | 4; opens /admin/promo | 4 of 17 codes are active; opens Promo | Pass |
| TC-HP-46 | Assessment | Hover / click / Tab to the tile | Opens assessments, or looks and reads as unavailable | Does nothing; looks identical to live tiles, arrow included; skipped by Tab | Fail (BUG-05) |
| TC-HP-47 | Email Sequencing | Click; compare label with destination | Destination is recognisably "Email Sequencing" | Opens Scheduled Emails, whose heading is "Registered users" | Fail (BUG-08) |
| TC-HP-48 | Account and Payment | Click each | /admin/account and /admin/payment | "Accounts" and "All payments" pages | Pass |
| TC-HP-49 | Large and zero counts | Mock 1234567, 99999999 and 0 | Thousands separators; 0 shown as 0 | "1,234,567", "99,999,999", "0" | Pass |

### Sidebar search & profile

| ID | Test case | Steps | Expected | Actual | Status |
|---|---|---|---|---|---|
| TC-HP-50 | Search finds and opens records | Type "Dhruvi" → click "Dhruvi Savaliya" | Grouped results; click opens the record | Users / Organization / Networks groups; opens /admin/users/{id} | Pass |
| TC-HP-51 | Search with no matches | Type "zzzzqq" | Clear no-results message | "Oops! No result found" | Pass |
| TC-HP-52 | Results panel is usable | Type "Dhruvi" at 1440×900 and 1920×1080 | Query stays visible; panel fits the screen; names readable | Panel covers the input, runs past the bottom edge, names cut at the sidebar edge | Fail (BUG-03) |
| TC-HP-53 | Esc closes results | Open results → Esc | Panel closes | Stays open (outside click does close it) | Fail (BUG-03) |
| TC-HP-54 | Search covers experiences | Type "deeply" (an experience name) | Experience appears in results | Only a Network named after it; no Experiences group (API returns companies, ecosystems, users, teams) | Fail (BUG-07) |
| TC-HP-55 | Script text in search | Type `<script>alert(1)</script>` | Treated as text | URL-encoded in the request, nothing runs | Pass |
| TC-HP-56 | Profile menu | Click Admin / Profile | Account link and sign-out | "View and edit your account", "Sign out of the Client Platform" | Pass |
| TC-HP-57 | Browser Back to Home | Home → Review → Back | Home again with data | Home with all sections | Pass |

### Error handling

| ID | Test case | Steps | Expected | Actual | Status |
|---|---|---|---|---|---|
| TC-HP-58 | /quests fails (HTTP 500) | Intercept /quests → 500 | Experience sections show an error with Retry; shortcuts still work | Whole admin redirects to /under-maintenance ("Oh No") | Fail (BUG-02) |
| TC-HP-59 | /admin/count fails (HTTP 500) | Intercept /admin/count → 500 | Only the shortcut counts are affected | Whole admin redirects to /under-maintenance ("Oh No") | Fail (BUG-02) |

### Responsive

| ID | Test case | Steps | Expected | Actual | Status |
|---|---|---|---|---|---|
| TC-HP-60 | Desktop 1920 / 1440 / 1280 | Load at each width | 3 cards per row, 2-column middle row, 3-column shortcuts | As expected, no horizontal scroll | Pass |
| TC-HP-61 | Tablet landscape 1024 | Load at 1024×768 | Content fully visible on load | Sidebar opens over the page and hides the heading and left card until closed | Fail (BUG-11) |
| TC-HP-62 | Tablet 768 and phone 375 | Load and scroll | Single column, no horizontal scroll | Stacks to one column, no horizontal scroll | Pass |
| TC-HP-63 | Mobile header | Scroll at 375 and 768 | Header icons stay inside the header | Gold feather icon hangs below the header and overlaps content while scrolling | Fail (BUG-12) |

### Accessibility

| ID | Test case | Steps | Expected | Actual | Status |
|---|---|---|---|---|---|
| TC-HP-64 | Keyboard reach and focus ring | Tab from the page heading | Every control reachable with a visible focus ring | All 19 controls reached in reading order, 2 px outline on each | Pass |
| TC-HP-65 | Enter / Space on cards | Focus a card → Enter; → Space | Opens the experience | Both open the experience (role="button", aria-label "Open …") | Pass |
| TC-HP-66 | Heading structure | List headings | One H1, H2 per section, H3 per card | H1 Home; H2 × 4; H3 × 3 | Pass |

### Time zones

| ID | Test case | Steps | Expected | Actual | Status |
|---|---|---|---|---|---|
| TC-HP-67 | Dates are the same in every time zone | Load with IST, America/Los_Angeles, Pacific/Auckland | Same dates, days-away and counts | Identical in all three | Pass |
