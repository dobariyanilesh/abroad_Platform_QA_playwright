# Test Report: Wisdom Guide Pairing

Build › Participant prep › Wisdom Guide Pairing: the page itself (Part A) and the Select Guide Pairing → Assign SOW workflow end to end (Part B).

| | |
|---|---|
| **Environment** | RC: `https://rc-admin.abroad.io` / `rc-api.abroad.io`, Chrome 154, Windows 10, browser TZ Asia/Kolkata |
| **Experience** | Transform. Discover. Grow (`6a844e22f4c72cccd7a60f35`), Published · Upcoming |
| **Page** | `/admin/experiences/6a844e22f4c72cccd7a60f35/build/prep-guide-pairing` → "Select Guide Pairing" dialog → "Assign SOW" dialog |
| **Tested** | 2026-09-30, QA admin account, Playwright MCP (role/label/text locators, no fixed waits) |
| **Evidence** | `screenshots/Wisdom Pairing/` (`page-*` for Part A, `workflow-*` for Part B) |

**Result:** 57 test cases: 48 passed, 6 failed, 3 ambiguous. 8 bugs: 1 High, 3 Medium, 4 Low. Console: 0 errors across both sessions.

| Part | Cases | Passed | Failed | Ambiguous |
|---|---|---|---|---|
| A: Page (layout, selection, search, answer column) | 22 | 21 | 1 | 0 |
| B: Pairing workflow (Select Guide Pairing → Assign SOW) | 35 | 27 | 5 | 3 |

**Business rule "Nothing is saved until the SOW is assigned": holds.** In every Cancel, Close (×), Escape, Back to Pairing and failed-validation path, the app sent **no** write request. The only write in the whole session was the final **Save**: one `POST /user/client-coach-bulk-pairing` → 200 `{"status":true}`.

### Data changed in production (intended by Part B)
- **Pearl Salazaro** (pesaro@getnada.com) is now paired with **Jhon Doe**, with SOW **"QA Test SOW - Pearl Salazaro"**:
  - Platform Scheduling · Experience type · no payment, $0 one-time fee, 1-month contract
  - 2 sessions per year, 60/60 min, coach rates $0/$0 hourly, Asia/Kolkata
  - Plan start 15 Oct 2026; Preparation session on or after 16 Oct 2026; Integration session on or after 30 Oct 2026
- The count went from 1 / 4 to 2 / 4 paired.
- The page has no unpair or SOW-delete control, so this has **not been reverted**. Please remove it through the SOW admin or the API if it shouldn't stay.
- Part A was read-only and ran before Part B, so Part A results reflect the 1 / 4 state.

## Bug summary

| ID | Severity | Area | Title |
|---|---|---|---|
| WF-01 | High | Assign SOW › Plan Starts On | Date picker opens on September 2025 (one year behind) and lets you pick past dates |
| PG-01 | Medium | Page › Selection + Search | Selection survives search: hidden rows stay selected and the pairing button is enabled with no visible rows |
| WF-02 | Medium | Select Guide Pairing › Guide list | Two guides are both listed as "Bhavesh Radadiya" with nothing to tell them apart |
| WF-03 | Medium | Assign SOW › Billing | "Total Duration Of Contract" accepts 0; the fee rule contradicts its own message |
| PG-02 | Low | Page › Toolbar | Disabled "Wisdom Guide Pairing" button gives no hint why it is disabled |
| WF-04 | Low | Assign SOW › Validation | Error messages show internal field names (e.g. "sessionPerCoachingCycle must be…") |
| WF-05 | Low | Both dialog steps | Escape, Cancel and × discard entered pairing/SOW data without confirmation |
| WF-06 | Low | Accessibility | Step-1 dialog has no accessible name; guide pickers have no labels; tabs lack tab roles |

---

# Part A: Page

## Page inventory (from the accessibility tree)

| Element | Role / accessible name | Initial state |
|---|---|---|
| Page heading | `heading "Wisdom Guide Pairing"` (h2) + "Admin" badge + "1 / 4 paired" badge | shown |
| Answer-column dropdown | `combobox "Show enrollment answer"` (native `<select>`) | "No answer column" |
| Search | `searchbox "Search participants"` (server-side, `?search=`, about 2 s debounce) | empty |
| Pairing action | `button "Wisdom Guide Pairing"` | disabled |
| Select all | `checkbox "Select all"` | unchecked |
| Row checkboxes | `checkbox "Select <Full Name>"` | unchecked |
| Columns | Participant, Latest Assessment, Signup Date, SOWs, Wisdom Guide | — |
| Footer | `1 / 4 paired` (+ ` · N selected` when rows are selected) | — |
| Sidebar item | `button "Wisdom Guide Pairing 1 / 4 paired"` | active |

**Data at the start:** Jaquelyn Bentley, Kessie Kane, Pearl Salazaro (no guide) and Rafael Solomon (guide: Jhon Doe). Every row has "None Taken" for Latest Assessment and "—" for SOWs.

## Part A test cases

| ID | Scenario | Steps performed | Expected | Actual | Result | Defect/Observation |
|---|---|---|---|---|---|---|
| PG-TC-01 | Page loads | Log in (email, password, 2FA), open the URL | Page renders without errors | Title "Experience · Build \| Abroad"; content rendered; participants API → 200 | Pass | — |
| PG-TC-02 | Title shown | Inspect headings | "Wisdom Guide Pairing" visible | h2 "Wisdom Guide Pairing" with "Admin" badge | Pass | — |
| PG-TC-03 | Paired count | Compare header badge, sidebar, footer and table data | "1 / 4 paired", consistent with the data | All three show "1 / 4 paired"; exactly 1 of 4 rows has a guide | Pass | — |
| PG-TC-04 | Answer dropdown present | Inspect the toolbar | Dropdown shown, default "No answer column" | `combobox "Show enrollment answer"`, "No answer column" selected | Pass | — |
| PG-TC-05 | Search present | Inspect the toolbar | Search field shown | `searchbox "Search participants"` visible and enabled | Pass | — |
| PG-TC-06 | Pairing button present | Inspect the toolbar | Button shown | Visible; disabled with no selection | Pass | — |
| PG-TC-07 | Table columns | Read column headers | Participant, Latest Assessment, Signup Date, SOWs, Wisdom Guide | Exactly these 5 plus a select-all column | Pass | — |
| PG-TC-08 | Select all | Click Select all, then again | Checks all rows, then clears them | All 4 checked, "4 selected", button enabled; second click clears all and disables the button | Pass | — |
| PG-TC-09 | Individual checkboxes | Toggle rows one by one | Rows toggle on their own; header shows partial state | Header indeterminate at 1–3 selected, checked at 4 of 4 | Pass | — |
| PG-TC-10 | Search "Pearl Salazaro" | Type the name, wait for debounce | Only Pearl shown | 1 row: Pearl Salazaro · pesaro@getnada.com · None Taken · 29 Sep 2026 · — · — | Pass | — |
| PG-TC-10b | Search ignores case, matches partial text *(extra)* | Search "pEaRl", then "raso@getnada" | Matching rows | "pEaRl" → Pearl; "raso@getnada" → Rafael (email match) | Pass | — |
| PG-TC-11 | Search non-existent | Search "zzqx-nonexistent-9981" | Friendly empty state | "No participants match that search."; Select all disabled; API → 200, empty rows | Pass | See PG-01 |
| PG-TC-12 | Single selection | Select Jaquelyn Bentley | Row checked, count 1, button enabled | Row checked; header indeterminate; "1 / 4 paired · 1 selected"; button enabled | Pass | — |
| PG-TC-13 | Multiple selection | Also select Kessie and Pearl | Count 3, header partial | 3 checked; header indeterminate; "· 3 selected"; button enabled | Pass | — |
| PG-TC-14 | Answer dropdown options | Select each option in turn | Each adds its answer column; default removes it | 7 options, each adds the matching column (unanswered → "—"); "No answer column" restores 5 columns | Pass | O-1, O-2 |
| PG-TC-15 | Rafael Solomon paired | Read the row | Wisdom Guide = "Jhon Doe" | "Jhon Doe" | Pass | — |
| PG-TC-16 | Unpaired placeholder | Read Jaquelyn, Kessie, Pearl | "-" under Wisdom Guide | "—" (em dash), the table's standard empty placeholder | Pass | — |
| PG-TC-17 | Pairing blocked with no selection | Clear selection, inspect button | Pairing can't start | Button has the native `disabled` attribute | Pass | — |
| PG-TC-17b | Pairing with only hidden selections *(extra)* | Select all 4 → search a non-existent name | Pairing unavailable, or selection clearly shown | 0 visible rows, Select all unchecked/disabled, footer "4 selected", **button enabled** | **Fail** | PG-01 |
| PG-TC-18 | Validation / error messages | Empty-search state; hover the disabled button | Clear messages where needed | Empty-search message clear; disabled button has no hint | Pass | PG-02 |
| PG-TC-18b | Pairing dialog validation | Covered in Part B | Required-field errors in the dialog | Originally blocked; verified in Part B: Next disabled without a guide (WF-TC-02, 07), SOW required fields enforced (WF-TC-22) | Pass | — |
| PG-TC-19 | Console errors | Read console after every step | No errors | 0 errors; warnings only (O-8) | Pass | — |

## PG-01: Selection survives search, so the pairing button is enabled with no visible rows
**Severity:** Medium · **Area:** Page › Selection + Search

**Reproduction steps**
1. Click **Select all** (4 selected).
2. Type `zzqx-nonexistent-9981` in **Search participants**.

**Expected:** Search either clears the selection, or the page clearly shows that hidden participants are still selected. Pairing shouldn't act on rows the admin can't see.

**Actual:**
- The table shows "No participants match that search." with no rows.
- **Select all** is unchecked and disabled.
- The footer still says **"1 / 4 paired · 4 selected"**.
- The **Wisdom Guide Pairing** button is **enabled**.
- Searching "Pearl Salazaro" shows 1 row, Select all *checked*, footer "4 selected".

**Impact:** An admin who searches for one participant may start pairing people they can't see. Part B found this is partly mitigated: the dialog lists every selected participant, hidden ones included, before anything is saved (O-9).

**Suggested fix:** Clear the selection when the search changes, or show "4 selected (3 hidden)" and base Select all on the full selection.

**Evidence:** `page-05-search-pearl-hidden-selection.png`, `page-06-search-no-results-button-enabled.png`

## PG-02: Disabled "Wisdom Guide Pairing" button gives no hint why it is disabled
**Severity:** Low · **Area:** Page › Toolbar

**Reproduction steps:** Open the page with no rows selected and hover over **Wisdom Guide Pairing**.

**Expected:** A tooltip or helper text such as "Select at least one participant to pair".

**Actual:** Greyed out with no `title`, tooltip, `aria-describedby` or helper text.

**Evidence:** `page-07-button-disabled-no-selection-hover.png`

---

# Part B: Pairing workflow (Select Guide Pairing → Assign SOW)

## Part B test cases

| ID | Scenario | Expected Result | Actual Result | Pass/Fail | Defect/Observation |
|---|---|---|---|---|---|
| WF-TC-01 | Select 1 participant (Pearl) | Row checked; pairing button enabled | Checked; footer "· 1 selected"; button enabled | Pass | — |
| WF-TC-02 | Open "Wisdom Guide Pairing" | Dialog lists selected participant(s); Next disabled | "Select Guide Pairing" opens on Participant wise, Pearl listed, Next disabled | Pass | — |
| WF-TC-03 | Guide dropdown content and search | Guide list; type-to-filter; empty state for no match | 32 guides; filter works; "zzqx" → "No options"; Next stays disabled | Pass | — |
| WF-TC-03b | Guides can be told apart | Each entry identifies one guide | "Bhavesh Radadiya" listed twice, no email or ID | **Fail** | WF-02 |
| WF-TC-04 | Choose a guide with the mouse | Guide shown; Next enabled | "Jhon Doe" shown; Next enabled | Pass | — |
| WF-TC-05 | Choose a guide with the keyboard | Same as mouse | Type then Enter works | Pass | — |
| WF-TC-06 | Clear a chosen guide | Guide cleared; Next disabled | Backspace clears it and disables Next; no clear (×) control for mouse | Pass | O-7 |
| WF-TC-07 | Guide wise: participant ticked, no guide | Next disabled | Next disabled | Pass | — |
| WF-TC-08 | Guide wise: guide + participant | Next enabled | Next enabled; a blank guide row is added automatically | Pass | — |
| WF-TC-09 | Guide wise: same guide in a 2nd row | Blocked | Row 2 search "Jhon" → "No options" | Pass | — |
| WF-TC-10 | Guide wise: same participant under 2 guides | Blocked | Kessie (assigned in row 1) isn't offered in row 2 | Pass | — |
| WF-TC-11 | Switch Participant wise ↔ Guide wise | Not specified by the UI | Each mode keeps its own separate state | **Ambiguous** | A-2 |
| WF-TC-12 | 2 selected, guide for only 1 → Next | Not specified ("for each selected participant") | Next enabled; SOW step says "1 pair"; other participant dropped | **Ambiguous** | A-3 |
| WF-TC-13 | Next → Assign SOW | SOW form opens; nothing saved | "One SOW will be applied to 1 pair"; no write | Pass | — |
| WF-TC-14 | Back to Pairing | Step 1 with guide kept | Guide kept; Next enabled | Pass | — |
| WF-TC-15 | SOW data across Back → Next | Entered values kept | Plan Name "QA Draft Plan" kept | Pass | — |
| WF-TC-16 | Cancel on step 1 | Closes; nothing saved | Closed; no write; table unchanged; selection kept | Pass | — |
| WF-TC-17 | Close (×) on step 1 | Closes; nothing saved | Closed; no write; table unchanged | Pass | — |
| WF-TC-18 | Cancel on step 2 | Closes; nothing saved | Closed; no write; table unchanged | Pass | — |
| WF-TC-19 | Close (×) on step 2 | Closes; nothing saved | Closed; no write; table unchanged | Pass | — |
| WF-TC-20 | Escape key / backdrop click | Not specified | Escape closes (no write); backdrop click doesn't | Pass | — |
| WF-TC-20b | Leaving with unsaved data | Warn before discarding | Escape (even to close the participant picker), Cancel and × discard silently | **Fail** | WF-05 |
| WF-TC-21 | Reopen after cancelling | Fresh state | Empty guide, Next disabled; SOW form back to defaults | Pass | — |
| WF-TC-22 | Save with required SOW fields empty | Blocked with messages; nothing sent | "Please fix the highlighted fields." plus inline errors (Plan name, Coaching rate, Growth coaching rate, Timezone, Plan start date, Condition ×2, Start date ×2); no request | Pass | — |
| WF-TC-23 | Save with out-of-range numbers | Clear messages; invalid values blocked | Blocked, but messages show internal names; duration 0 not flagged | **Fail** | WF-03, WF-04 |
| WF-TC-24 | Plan Starts On date picker | Current month; past dates disabled | Opens on **September 2025**; "30" sets **30 September 2025**; past 2026 dates selectable | **Fail** | WF-01 |
| WF-TC-25 | Valid Save | Pairing + SOW saved; confirmation | 1 `POST /user/client-coach-bulk-pairing` → 200; dialog closes; toast "SOW assigned to 1 pair." | Pass | — |
| WF-TC-26 | Main table after Save | Guide and SOW shown | Pearl: SOWs "QA Test SOW - Pearl Salazaro", Wisdom Guide "Jhon Doe"; selection cleared | Pass | — |
| WF-TC-27 | Paired count after Save | 1 / 4 → 2 / 4 everywhere | Header, sidebar and footer all "2 / 4 paired" | Pass | — |
| WF-TC-28 | Reload after Save | Data persists | Same data and counts after a full reload | Pass | — |
| WF-TC-29 | "Nothing is saved until the SOW is assigned" | No write before Save | 0 writes across ~15 cancel/close/back/invalid attempts; only Save wrote | Pass | — |
| WF-TC-30 | Reopen for an already-paired participant | Not specified | Empty "Select Guide", no warning or pre-fill; re-save not run (would create a 2nd SOW in production) | **Ambiguous** | A-4 |
| WF-TC-31 | Dialog accessibility | Named dialogs; labelled controls | Step 1 dialog unnamed; guide inputs unlabeled; tabs lack tab role (Assign SOW is named) | **Fail** | WF-06 |
| WF-TC-32 | Console errors | None | 0 errors; warnings only (O-8) | Pass | — |
| WF-TC-33 | Save payload matches form | Payload matches what was entered | planName, $0, 2 sessions, Asia/Kolkata, `planStartDate "10/15/2026"`, both conditions, clientId → coachId | Pass | A-5 |

## WF-01: Plan Starts On date picker opens a year behind and lets you pick past dates
**Severity:** High · **Area:** Assign SOW › Coaching › Plan Starts On

**Reproduction steps**
1. Select a participant → Wisdom Guide Pairing → choose a guide → Next.
2. In Coaching › **Plan Starts On**, click **Add date**.
3. Look at the calendar header, then click **30**.

**Expected:** The calendar opens on the current month (September 2026). Dates before today are disabled.

**Actual:**
- The header reads **September 2025**, with 2025's day grid (Aug 31 on Sunday, Sep 30 on Tuesday). The browser clock is correct: `Wed Sep 30 2026`.
- Days 1–29 are greyed out. Clicking **30** sets **"30 September 2025"**, a year in the past.
- In September 2026 and March 2026, **every past day is enabled**.
- Save wasn't clicked with the 2025 date, so server-side rejection is unverified. The client gave no warning.

**Impact:** An admin who picks "today" from the first view saves an SOW starting a year earlier. That can break session scheduling and billing.

**Evidence:** `workflow-08-datepicker-wrong-year.png`

## WF-02: Two guides are both listed as "Bhavesh Radadiya"
**Severity:** Medium · **Area:** Select Guide Pairing › Guide dropdown

**Reproduction steps:** Select a participant → Wisdom Guide Pairing → open **Select Guide**.

**Expected:** Every entry identifies one guide (e.g. name + email).

**Actual:** "Bhavesh Radadiya" appears twice with nothing to tell them apart. The admin can't know which account they are pairing.

**Evidence:** `workflow-02-guide-dropdown-duplicate-names.png`

## WF-03: "Total Duration Of Contract" accepts 0; fee rule contradicts its message
**Severity:** Medium · **Area:** Assign SOW › Billing

**Reproduction steps:** On Assign SOW, set Total Duration Of Contract = `0` and One Time Fee = `-50` → Save.

**Expected:** Duration must be at least 1. The fee rule matches its message.

**Actual:**
- Duration 0 gets no error, while every other numeric field is checked.
- The fee shows "Please enter a one-time amount of $1 or more", yet the default **0** is accepted and saved (WF-TC-25).

**Evidence:** `workflow-07-raw-field-names-in-errors.png` (same Save attempt)

## WF-04: Validation messages show internal field names
**Severity:** Low · **Area:** Assign SOW › Coaching

**Reproduction steps:** Number of Sessions = `-1`, Total Session = `0`, Regular Session Duration = `-30`, Growth Session Duration = `0`, Growth Session Coach Rate = `-10` → Save.

**Expected:** Plain messages using the visible labels, e.g. "Number of sessions must be at least 1".

**Actual:**
- "sessionPerCoachingCycle must be greater than or equal to 1"
- "totalSession must be greater than or equal to 1"
- "sessionDuration must be greater than or equal to 15"
- "growthSessionDuration must be greater than or equal to 1"
- "growthCoachingRate must be greater than or equal to 0"

Also, the minimum is 15 for regular session duration but 1 for growth session duration; please confirm that's intended.

**Evidence:** `workflow-07-raw-field-names-in-errors.png`

## WF-05: Entered data is discarded without confirmation
**Severity:** Low · **Area:** Both dialog steps

**Reproduction steps**
1. Guide wise → choose a guide → open **Select participants** → tick a participant.
2. Press **Escape** to close the participant picker.

**Expected:** Escape closes only the picker. Leaving the wizard with unsaved data asks for confirmation.

**Actual:** Escape closes the **whole dialog** and all selections are lost. Cancel and × on Assign SOW also discard a fully filled SOW form without asking.

**Evidence:** Reproduced during WF-TC-20b. The dialog closes, so there is nothing to screenshot; see the steps above.

## WF-06: Accessibility gaps in the Select Guide Pairing dialog
**Severity:** Low · **Area:** Accessibility

**Actual:**
- `dialog` has no accessible name. Assign SOW correctly uses `aria-labelledby="gpSowTitle"`.
- Each "Select Guide" combobox input has no label.
- "Participant wise" / "Guide wise" are plain buttons with no `role="tab"` or `aria-selected`.
- No mouse-accessible clear control on the guide select.

**Expected:** A named dialog, labelled comboboxes (e.g. "Wisdom guide for Pearl Salazaro"), and proper tab semantics.

**Evidence:** Accessibility tree captured during WF-TC-02 and WF-TC-08.

---

## Ambiguous behaviour (needs product or dev confirmation)

- **A-1: Pairing without an SOW already exists.** Before testing, Rafael Solomon showed Wisdom Guide "Jhon Doe" with SOWs "—". The dialog says "Nothing is saved until the SOW is assigned". Is this older data, or is there another path that pairs without an SOW?
- **A-2: Two modes, separate state.** Choices in Participant wise don't appear in Guide wise and vice versa. It's unclear which mode Next uses if both are filled.
- **A-3: Partial assignment.** With 2 selected and a guide for only 1, Next is enabled and the SOW step says "1 pair". The dialog says "Choose a wisdom guide for each selected participant". Is dropping the unassigned participant intended?
- **A-4: Re-pairing an already-paired participant.** Paired participants can be selected again; the dialog doesn't pre-fill or mention the current guide. Unclear whether Save replaces the pairing or adds a second SOW. Not executed, to avoid duplicate production data.
- **A-5: Date formats in the payload.** `planStartDate` is sent as a local string `"10/15/2026"`, while scheduling dates are UTC ISO strings (`2026-10-15T18:30:00.000Z` for 16 Oct IST). Please confirm the server reads both in the client's time zone.
- **A-6: Guide list contents.** It includes entries such as "Assign Coach", "RC Admin", "Quest IPL" and "D D". Is the list meant to show only active wisdom guides?
- **A-7: Sidebar status.** Wisdom Guide Pairing has a green dot, and the legend says green means "Complete", although not every participant is paired.

## Observations (not logged as bugs)

- **O-1 (test data):** Clothing Size shows "Extra Large (XL" for Jaquelyn Bentley, missing the closing bracket. The API returns it that way, so the typo is in the enrollment-form option.
- **O-2 (test data):** The "Test Question " option label ends with a space.
- **O-3:** Search waits about 2 s after the last keystroke before calling the API (which answers in about 450 ms). Consider a shorter debounce or a loading indicator.
- **O-4:** The guide dropdown and the date picker extend past the dialog edge but stay usable.
- **O-5:** "Suggested Total Sessions: -" shows a bare hyphen when there is no suggestion.
- **O-6:** The backdrop click doesn't close the dialog, but Escape does.
- **O-7:** A guide choice can be cleared only with Backspace.
- **O-8:** Console warnings on every load: Bugsnag is started twice, and react-i18next uses the legacy `wait` option.
- **O-9:** PG-01 is partly mitigated: the dialog lists every selected participant, including rows hidden by search, before anything is saved.

## Evidence files

All files are in `screenshots/Wisdom Pairing/`.

**Part A (page)**

| File | Shows |
|---|---|
| page-01-page-loaded.png | Initial state, 1 / 4 paired |
| page-02-select-all-checked.png | All 4 selected, button enabled |
| page-03-single-selection.png | 1 selected, header indeterminate |
| page-04-multi-selection.png | 3 selected |
| page-05-search-pearl-hidden-selection.png | PG-01: 1 visible row, "4 selected" |
| page-06-search-no-results-button-enabled.png | PG-01: empty state, button enabled |
| page-07-button-disabled-no-selection-hover.png | PG-02: disabled button, no hint |
| page-08-final-state-reset.png | Page after reset |

**Part B (workflow)**

| File | Shows |
|---|---|
| workflow-01-dialog-opened-next-disabled.png | Step 1 opened, Next disabled |
| workflow-02-guide-dropdown-duplicate-names.png | WF-02 duplicate "Bhavesh Radadiya" |
| workflow-03-guide-wise-selection-not-carried.png | A-2 Guide wise empty after Participant wise choice |
| workflow-04-guide-wise-filled-next-enabled.png | Guide wise filled, new row added |
| workflow-05-assign-sow-opened.png | Assign SOW step |
| workflow-06-save-empty-validation.png | Required-field validation |
| workflow-07-raw-field-names-in-errors.png | WF-03 / WF-04 |
| workflow-08-datepicker-wrong-year.png | WF-01 September 2025 |
| workflow-09-sow-filled-before-save.png | Valid SOW before Save |
| workflow-10-after-save-table-updated.png | Table after Save, 2 / 4 paired |
| workflow-11-repair-already-paired-no-prefill.png | A-4 paired participant, empty guide |
| workflow-12-guide-wise-two-rows.png | Guide wise duplicate prevention |
| workflow-13-participant-wise-partial-next-enabled.png | A-3 partial assignment |
