# Test Report: Experience › Manage › Participants

The Participants page and its three header actions (**Add participant**, **Export form answers**, **Download travel documents**), the per-row action menu, enrollment forms and travel documents.

| | |
|---|---|
| **Environment** | RC: `https://rc-admin.abroad.io` / `rc-api.abroad.io`, Chromium (Playwright), Windows 10 |
| **Experience** | Transform. Discover. Grow (`6a844e22f4c72cccd7a60f35`), Published · Upcoming |
| **Page** | `/admin/experiences/6a844e22f4c72cccd7a60f35/manage/participants` |
| **Tested** | 2026-09-30, QA admin account, Playwright MCP (interactive) + Playwright Test (automated regression) |
| **Evidence** | `screenshots/participants/` (files `01`–`11`), downloaded `.xlsx` / `.zip` inspected locally |
| **Automation** | `tests/participants.spec.ts`, `tests/participants.header-actions.spec.ts`, `tests/auth.setup.ts` (see "Generated tests") |

## Test plan (short)
1. Inspect the live page and baseline data (4 participants).
2. Read-only checks: list, cards, sorting, enrollment forms, document viewers, downloads, export, action menu, responsive and keyboard.
3. Mutating checks on **disposable participants only** (`qa.*@getnada.com`): invite, payment, copy link, resend, remove. Pre-existing participants were never modified.
4. Inspect downloaded files on disk (xlsx rows/columns, zip entries, hashes).
5. Generate and run Playwright tests for the stable flows.
6. Clean up and confirm the baseline is restored.

## Baseline (observed)

| Participant | Payment | Form | Air / Ins / Pass / Head | Signup |
|---|---|---|---|---|
| Jaquelyn Bentley | $12,000 of $10,000 (**overpaid**) | Submitted | — — — — | 08/20/2026 |
| Kessie Kane | $10,000 of $10,000 (fully paid) | Submitted | — — — — | 08/20/2026 |
| Pearl Salazaro | $1,250 of $4,999 (**partial**) | Submitted | all four present | 09/29/2026 |
| Rafael Solomon | $10,000 of $10,000 (fully paid) | none | — — — — | 08/20/2026 |

Cards: **On the roster 3 of 4**, **Outstanding $3,749 (1 person)**, **Documents missing 12 across 3 people**. No "unpaid" participant exists at baseline; the disposable invitee covered "Nothing paid".

## Results

Status: **Pass** / **Fail** / **Blocked** / **Untested**. "Obs" = observed behaviour, expected result not confirmed by any requirement.

### 1. List and summary cards

| ID | Scenario | Expected | Actual | Status | Defect / Observation |
|---|---|---|---|---|---|
| PL-01 | Names, emails, payments, dates render per row | Match the API data | All 4 rows render; links go to `/admin/users/<id>` | Pass | |
| PL-02 | Outstanding = sum of shortfalls | $3,749 (4,999 − 1,250); overpaid not negative | $3,749 · 1 person | Pass | |
| PL-03 | Documents missing | 12 across 3 people (3 × 4 docs; Pearl complete) | 12 across 3 people | Pass | |
| PL-04 | "On the roster 3 of 4 people" | Explainable from data | 4 rows, sidebar badge 3, card 3 of 4. Roster definition undocumented. Hypothesis: roster = submitted enrollment form (Jaquelyn, Kessie, Pearl = 3). **Not confirmed.** | Obs | OBS-01 |
| PL-05 | Overpaid / partial / full / unpaid display | Distinct, correct text | `$12,000 of $10,000`, `$1,250 of $4,999`, `$10,000 of $10,000`, `Nothing paid` | Pass | Overpaid has no explicit flag (OBS-02) |
| PL-06 | Sort by Name, both directions | Alphabetical asc/desc | Toggles correctly | Pass | |
| PL-07 | Sort by Signup Date, both directions | Chronological asc/desc | Correct; ties (08/20) have no stable order | Pass | |
| PL-08 | Default sort indicator | Indicator matches row order | Signup Date arrow shown on load while rows are in name order | Fail | DEF-09 |
| PL-09 | Empty state | Empty-state message | Would require removing pre-existing participants | Untested | Not permitted by the rules |
| PL-10 | Summary counts after adding an unpaid invitee | Consistent inclusion | Total 3 of **5**, Outstanding +$10,000 (2 people), roster 3, docs missing unchanged. After a payment: docs missing 12 → **16 across 4**. Invitee is counted by some cards and not others | Obs | DEF-05 |

### 2. Add participant (header button)

| ID | Scenario | Expected | Actual | Status | Defect / Observation |
|---|---|---|---|---|---|
| AP-01 | Open dialog | "Add participant" dialog, Continue disabled while empty | As expected | Pass | |
| AP-02 | Cancel | Closes, nothing created | Closes; row count unchanged | Pass | |
| AP-03 | Malformed emails (`not-an-email`, `a@b`, `@getnada.com`, `a b@…`) | Inline error | "Enter a valid email address (e.g., name@example.com)." | Pass | |
| AP-04 | Duplicate email (`jabe@getnada.com`, `JABE@GETNADA.COM`, padded) | Blocked | "This person is already on the roster." (case-insensitive, trimmed) | Pass | Race, see OBS-05 |
| AP-05 | Whitespace / case | Trimmed, normalised | Trimmed; server lowercases (`QA.Run…@GetNada.com` → `qa.run…@getnada.com`) | Pass | Dialog heading keeps typed case |
| AP-06 | First / last name required | Send invite disabled until both filled | Disabled with first only; enabled with both | Pass | |
| AP-07 | Deposit above price ($20,000) | Blocked | "Deposit amount must be less than actual cost", Send disabled | Pass | |
| AP-08 | Deposit equal to price ($10,000) / $0 | Blocked per the same message ("less than") | **Accepted**, Send enabled | Fail | DEF-06 |
| AP-09 | Deposit precision (`2500.555`) | Rejected or rounded | Mask drops the decimal point: **$25,005** (set programmatically; not re-verified by keystroke) | Obs | DEF-07 |
| AP-10 | Successful invite | Row appears, "Nothing paid", persists | Row appears with signup 09/30/2026; persists after reload | Pass | |
| AP-11 | Double-click on Send invite | One participant | One row (automated test) | Pass | |
| AP-12 | Summary/sidebar update after invite | Consistent | See PL-10 | Obs | DEF-05 |

### 3. Export form answers (header button)

| ID | Scenario | Expected | Actual | Status | Defect / Observation |
|---|---|---|---|---|---|
| EX-01 | Download | `.xlsx` download | `Transform. Discover. Grow. (Experience) - Answer Report.xlsx`, 7,563 B, valid xlsx | Pass | |
| EX-02 | Headers | Question titles | `Client Name, Clothing Size, Cloths Depends on Question, Consent for Event Highlight, Depends on: Question, Prosperity score, Number` | Obs | OBS-03: last column "Number" but the UI calls the question "Test Question"; conditional headers are internal-sounding |
| EX-03 | Row count / mapping | One row per submitted form | 3 data rows (Kessie, Jaquelyn, Pearl), answers match the UI | Pass | Row 2 is blank (OBS-03) |
| EX-04 | Participant without a form (Rafael) | Excluded or shown as empty | Excluded | Pass | |
| EX-05 | Data quality | Full option text | `Extra Large (XL` (missing `)`) also in the export | Fail | DEF-08 |
| EX-06 | Button usable after download | Not stuck loading | Yes (automated) | Pass | Button is disabled while the roster loads |

### 4. Download travel documents (header button) and per-row documents

| ID | Scenario | Expected | Actual | Status | Defect / Observation |
|---|---|---|---|---|---|
| TD-01 | Zip download | Dated `.zip` | `Transform. Discover. Grow. - 09-30-2026.zip`, 20.3 MB | Pass | |
| TD-02 | Zip contents | Only participants with documents | 4 entries, all `Pearl Salazaro - {Passport.jpg, Insurance.pdf, Headshot.jpg, Ticket.pdf}`; magic bytes valid (`%PDF`, JPEG). No entries for Rafael | Pass | File contents (images/pages) not visually verified |
| TD-03 | Ticket vs Insurance | Distinct documents | Byte-identical (same SHA-256; 9,742,486 B) | Obs | OBS-04, probably reused test data |
| TD-04 | View Air Ticket / Insurance / Passport / Headshot (Pearl) | Viewer for Pearl, correct file | Titles, "Pearl Salazaro", filenames `ticket-…pdf`, `insurance-…pdf`, `passport-…jpg`, `headshot-…jpg`; requests target Pearl's id and return 200 | Pass | Viewer shows 1/4…4/4 paging |
| TD-05 | Individual download (Headshot) | Named after participant | `… - Pearl Salazaro - Headshot.jpg` | Pass | Ticket/Insurance/Passport downloads **not run individually** |
| TD-06 | Missing documents | No controls | `—` and no buttons for the three participants | Pass | |
| TD-07 | Esc / Close returns to the list | Same page state | Yes | Pass | |

### 5. Enrollment forms

| ID | Scenario | Expected | Actual | Status | Defect / Observation |
|---|---|---|---|---|---|
| EF-01 | Open each form (Jaquelyn, Kessie, Pearl) | Correct owner, "Submitted", date | Name/email/date match the row; answers match the export | Pass | |
| EF-02 | Missing form (Rafael) | Distinct state | `—`, no control | Pass | |
| EF-03 | Close returns to the list | Page state kept | Yes; URL unchanged | Pass | |

### 6. Row action menu (disposable participant unless stated)

| ID | Scenario | Expected | Actual | Status | Defect / Observation |
|---|---|---|---|---|---|
| AM-01 | Menu opens for the right row (Pearl, read-only) | Scoped to the row | Items: Resend Invitation Email, Copy Invitation Link, Manual Payment, Update Payment, Remove | Pass | |
| AM-02 | Esc closes the menu | Closed | Closed | Pass | |
| AM-03 | Copy Invitation Link | Link for this participant | Toast "Invitation link copied successfully."; clipboard = `rc.abroad.io/account?mode=invite&fname&lname&email&token&e`; name and email match the participant; token present (36 chars, **not recorded here**) | Pass | OBS-06: name/email in the URL |
| AM-04 | Resend Invitation Email | Request sent | Toast "Invitation email has been resent successfully."; `POST …/resent-invitation-email` → 200 | Pass | **Delivery not verified** (UI/API acceptance only) |
| AM-05 | Manual Payment required fields | Errors | "Amount is required." / "Payment method is required." | Pass | |
| AM-06 | Manual Payment `$0` | Clear rejection | Save does nothing visible; `POST …/external-payments` → **400**; console error | Fail | DEF-03 |
| AM-07 | Manual Payment amount mask | Numeric only | `-100` → `$100`, `abc` → empty, max 6 digits (`99999999` → `$999,999`) | Obs | Minus sign is silently dropped |
| AM-08 | Manual Payment $2,500 via ACH | Recorded; totals update | Row `$2,500 of $10,000`; Outstanding −$2,500 exactly; sidebar Payments $33.3k → $35.8k; persisted after reload | Pass | Option label "ACH" posts value `wire_transfer` (OBS-07) |
| AM-09 | Update Payment | Edit payment | Opens a dialog titled **"Invite …"**, all fields disabled, only Cancel, text "They will receive an email with a link to enroll." | Fail | DEF-04 |
| AM-10 | Remove: confirm/cancel | Confirmation step | **No confirmation.** `DELETE` fires immediately (204) | Fail | DEF-01 |
| AM-11 | Remove updates list and cards | Row gone; cards back to baseline | Row gone; cards back to 3 of 4 / $3,749 / 12; **sidebar Payments still $35.8k** | Fail | DEF-02 |
| AM-12 | Payment: duplicates, precision, repeated clicks | Single payment | Not exercised | Untested | |

### 7. Reliability and usability

| ID | Scenario | Expected | Actual | Status | Defect / Observation |
|---|---|---|---|---|---|
| RU-01 | Keyboard: Tab order of the 3 buttons; Enter opens dialog; Esc closes; focus returns | Yes | Yes | Pass | |
| RU-02 | Accessible names | All controls named | 0 unnamed buttons; row buttons named per column (`View Air Ticket`), row menu is `•••` (no participant in the name) | Pass | OBS-08 |
| RU-03 | Narrow viewport (390 px) | Usable | No page-level horizontal scroll; table scrolls inside its container; buttons stack | Pass | |
| RU-04 | Console errors | None | Only the expected 400 in AM-06 | Pass | |
| RU-05 | Duplicate requests on repeat clicks | One request | Only the double-click invite was tested (one row) | Untested | |
| RU-06 | Controlled error states | Handled messages | Only the `$0` 400 (see AM-06). No network fault injection | Untested | |
| RU-07 | Stale/slow load | Actions blocked until ready | Header buttons are disabled while loading; the duplicate check succeeded before the roster loaded in one automated run | Obs | OBS-05 |

## Defects

| ID | Severity | Title |
|---|---|---|
| DEF-01 | **High** | Remove deletes the participant immediately with no confirmation |
| DEF-02 | Medium | Sidebar Payments total keeps a removed participant's payment |
| DEF-03 | Medium | Manual Payment of $0 fails silently (API 400, no message) |
| DEF-04 | Medium | "Update Payment" opens a read-only "Invite" dialog and cannot update anything |
| DEF-05 | Low | Summary cards include an invited participant inconsistently |
| DEF-06 | Low | Deposit equal to price or $0 accepted despite "must be less than actual cost" |
| DEF-07 | Low | Currency mask drops the decimal point instead of rejecting or rounding |
| DEF-08 | Low | Enrollment answer "Extra Large (XL" is missing its closing parenthesis (UI and export) |
| DEF-09 | Low | Signup Date shows an active sort arrow on load while rows are in name order |

### DEF-01: Remove has no confirmation (High)
- **Steps:** 1. Add a disposable participant. 2. Row **•••** → **Remove**.
- **Expected:** a confirm/cancel step before a destructive action.
- **Actual:** `DELETE /quests/<id>/participants/<id>` → 204 at once; the row disappears. Removing a participant who has paid ($2,500 in the test) is one misclick away.
- **Evidence:** network log (DELETE 204 immediately after the click); `screenshots/participants/08_after_invite_reload.png` (before state). Cancel path could not be tested because none exists.

### DEF-02: Payments total still counts a removed participant (Medium, needs confirmation)
- **Steps:** 1. Invite a participant, record $2,500. 2. Remove them. 3. Reload.
- **Expected:** if the badge is "sum of current participants' payments", $33.3k ($33,250).
- **Actual:** badge stays **$35.8k**. Cards return to baseline. May be intended (ledger of received money); no documentation to confirm.

### DEF-03: $0 manual payment fails silently (Medium)
- **Steps:** •••  → Manual Payment → Amount `0`, method ACH → Save.
- **Expected:** a visible validation message ("Amount must be greater than 0").
- **Actual:** dialog stays open, nothing changes; `POST …/external-payments` → 400; one console error.
- **Evidence:** `screenshots/participants/09_manual_payment_zero_silent_400.png`.

### DEF-04: Update Payment is not an update form (Medium, expected behaviour unconfirmed)
- **Steps:** •••  → Update Payment on a participant with a payment.
- **Expected:** a form to edit the recorded payment/plan.
- **Actual:** dialog "Invite <email>" labelled "Existing account", all inputs disabled, only **Cancel**, and the text "They will receive an email with a link to enroll."
- **Evidence:** `screenshots/participants/10_update_payment_readonly_invite_dialog.png`.

### DEF-05: Summary cards treat an invitee inconsistently (Low)
- **Steps:** invite an unpaid participant ($10,000); reload; then record a payment.
- **Actual:** after the invite, total 3 of **5**, Outstanding **+$10,000 (2 people)**, roster and docs-missing unchanged; after a payment, docs missing **16 across 4**. The definitions of "roster", "outstanding" and "documents missing" are not documented, so which card is wrong is undetermined.

### DEF-06: Deposit boundary (Low)
- Message says "must be less than actual cost", but `deposit = price` ($10,000) and `$0` are accepted (Send invite stays enabled).

### DEF-07: Currency mask precision (Low)
- Setting `2500.555` yields **$25,005**: the decimal point is removed, so the value is ×10. Set via script events; a real keystroke test is still advisable before filing.

### DEF-08: Truncated option text (Low)
- "Extra Large (XL" in Jaquelyn's form and in the export. Likely stored that way in the form option; the stored value should be corrected.

### DEF-09: Default sort indicator (Low)
- On load the Signup Date header shows the ▲ indicator, but rows are in name order (Pearl 09/29 sits before Rafael 08/20).

## Observations (no expected result confirmed)
- **OBS-01** "3 of 4 people" vs 4 rows: see PL-04. Please confirm the intended definition.
- **OBS-02** Overpaid ($12,000 of $10,000) has no visual flag, and the overpayment is not reflected in any card.
- **OBS-03** Export has a blank row 2, and the conditional-question headers ("Cloths Depends on Question", "Depends on: Question") and "Number" look like internal names.
- **OBS-04** Ticket and Insurance for Pearl are the same file.
- **OBS-05** In one automated run the "already on the roster" check did not fire when clicked immediately after the page load; it passed when the roster had loaded. Suggests the check depends on client-side roster data. Not reproduced deterministically.
- **OBS-06** The invitation link carries first name, last name and email in the query string.
- **OBS-07** Payment method "ACH" posts `wire_transfer`.
- **OBS-08** Every row's action button is named just "•••" (no participant name), which is ambiguous for screen readers.
- **OBS-09** A second browser tab (`…/build/prep-guide-pairing`) appeared once during the session without a matching action from this run; not reproduced.

## Summary

| Status | Count |
|---|---|
| Pass | 38 |
| Fail | 7 (PL-08, AP-08, EX-05, AM-06, AM-09, AM-10, AM-11) |
| Observation (expected result unconfirmed) | 8 |
| Untested | 4 (PL-09, AM-12, RU-05, RU-06) |
| Blocked | 0 |
| **Total** | **57 test cases, 9 defects (1 High, 3 Medium, 5 Low)** |

The 9 defects map onto the 7 failed cases plus PL-10 (DEF-05) and AP-09 (DEF-07), which are recorded as observations because the requirement is not documented.

## Data and side effects
- **Pre-existing participants: not modified.**
- **Created and removed:** disposable `QAtest Run…` participants (`qa.*@getnada.com`). 3 were left behind by failed automated runs (hit the 30 s timeout before cleanup) and were **removed manually**; the roster was verified back to baseline (3 of 4 · $3,749 · 12).
- **Emails:** each invite sent an invitation email to a `getnada.com` address (public disposable inbox, the domain used by the existing test data) and one was resent. No inbox was read, so delivery is **unverified**.
- **Payments:** one recorded ACH payment ($2,500) on a disposable participant; no real card or payment method was used. The payments badge still reflects it (DEF-02).
- Downloads kept locally under `.playwright-mcp/` (git-ignored). Screenshots are in `screenshots/participants/`; personal data is test data (`getnada.com`) and the invitation token was never captured.

## Generated tests

| File | Purpose |
|---|---|
| `tests/auth.setup.ts` | Logs in once (E2E_EMAIL / E2E_PASSWORD / E2E_2FA_CODE from the environment) and saves the session to `playwright/.auth/admin.json` (git-ignored) |
| `tests/auth.constants.ts` | Shared auth file path |
| `tests/participants.spec.ts` | Cards, sorting, forms, documents, downloads, action menu, keyboard, invite → pay → copy link → remove lifecycle |
| `tests/participants.header-actions.spec.ts` | The three header buttons (accessibility, validation, create/persist/cleanup, xlsx and zip content checks) |

Run: `E2E_EMAIL=… E2E_PASSWORD=… E2E_2FA_CODE=… npx playwright test --project=setup` and then `npx playwright test tests/participants*.spec.ts --project=chromium --workers=1`. The tests assert **current** behaviour; the failing checks above (DEF-01, DEF-03, DEF-04, …) are deliberately not encoded as passing tests.

## Remaining risks
- Email delivery, PDF page content, and the meaning of the roster/outstanding/missing-document rules are unverified.
- Running the suite repeatedly creates invitation emails; keep `workers=1`.
- The RC environment is slow: page loads occasionally exceeded 30–90 s.
