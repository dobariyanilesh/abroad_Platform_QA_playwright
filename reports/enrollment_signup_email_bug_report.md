# Bug Report: Enrollment Signup Page & Welcome Email

| | |
|---|---|
| **Environment** | RC / QA — `https://rc-admin.abroad.io` (admin build 3.1.48), Chrome 153, Windows 10 |
| **Experience** | QA Field Test Experience 2K26 (`6ab3648f6762f1a06edb9a27`), Published · Upcoming |
| **Pages** | `/build/enrol-signup` and `/build/enrol-email` |
| **Tested** | 2026-09-23, account `rc.abroad.io@gmail.com` |
| **Screenshots** | All evidence files are in `screenshots/enrol/` |
| **Save endpoints** | Signup: `PUT rc-api/entity/network/{id}/invite-link` · Email: `PUT rc-api/quests/welcome-email/{questId}` |

Both pages autosave on blur. Every test value was restored afterwards and verified after a reload (email template byte-identical to the original; all four signup fields identical).

## Summary

| ID | Severity | Page | Title |
|---|---|---|---|
| BUG-01 | Critical | Welcome email | `{{ button }}` (signup link) can be removed and the email still saves |
| BUG-02 | High | Welcome email | Empty email body is accepted and saved |
| BUG-03 | Medium | Welcome email | `{{ fullName }}` removal / misspelled variables accepted without warning |
| BUG-04 | High | Signup | Welcome letter description 4000-char limit not enforced |
| BUG-05 | High | Signup | Signup page description 450-char limit not enforced; breaks participant signup layout |
| BUG-06 | Medium | Signup | Required fields accept empty / whitespace-only values; readiness stays ✓ |
| BUG-07 | Medium | Both | Readiness indicators disagree (header pill ✓ while section is incomplete) |
| BUG-08 | Medium | Signup | Inputs disabled during autosave — focus lost and typed text silently dropped |
| BUG-09 | Low | Signup | Emoji counted as 2 characters — only 20 emoji fit in a "40 char" field |
| BUG-10 | Low | Signup | Over-limit counters have no error state (same amber as valid counts) |
| BUG-11 | Low | Welcome email | `javascript:` URLs kept in email-body links |

---

## BUG-01 — Signup-link variable `{{ button }}` can be removed; email still saves
**Severity:** Critical · **Page:** Welcome email

**Steps**
1. Open `/build/enrol-email`.
2. In *Email body*, delete the `{{ button }}` line.
3. Click outside the editor.

**Expected:** Save blocked with an inline error such as "`{{ button }}` is required — it is the signup link". The Welcome email step is flagged as incomplete.
**Actual:** `PUT /quests/welcome-email` → 200 "email template updated successfully". Header shows "All changes saved". The Welcome email rail item stays green and Enrollment stays ✓. The page's own helper text says "Keep these variables. {{ button }} is the signup link", but nothing enforces it.
**Impact:** Invited participants get an email with no way to sign up or enroll.
**Evidence:** `screenshots/enrol/email_BUG02_button_var_removed_saved.png`

## BUG-02 — Empty email body is saved
**Severity:** High · **Page:** Welcome email

**Steps:** Select all text in *Email body* → Delete → click outside.
**Expected:** "Email body is required" error; no save.
**Actual:** Saved with an empty content block (PUT 200). No inline error. Only the sidebar dot turns red, while the header pill still reads **Enrollment ✓** (see BUG-07).
**Impact:** Enrolled people receive a blank branded email with no text and no signup link.
**Evidence:** `screenshots/enrol/email_BUG01_empty_body_saved.png`

## BUG-03 — `{{ fullName }}` removal and misspelled variables accepted
**Severity:** Medium · **Page:** Welcome email

**Steps**
- A: delete `{{ fullName }}` from "Dear {{ fullName }}," → blur.
- B: change `{{ button }}` to `{{ buton }}` → blur.

**Expected:** Warn about or block a missing required variable. Reject unknown `{{ … }}` tokens.
**Actual:** Both saved (PUT 200). A is stored as "Dear ,". B stores an unknown token that will render as blank or raw text and also drops the signup link. The rail item stays green in both cases.
**Evidence:** `email_BUG03_fullname_removed_saved.png`, `email_E4_typo_variable.png`

## BUG-04 — Welcome letter description: 4000-char limit not enforced
**Severity:** High · **Page:** Signup

**Steps:** In *Welcome letter description*, (a) paste 5000 characters, or (b) type past 4000.
**Expected:** Input stops at 4000, or save is blocked with an error.
**Actual:** Counter shows **5000 / 4000** (or 4010 / 4000). Content saves (`welcomeLetter` holds 5000 characters) and the header shows "All changes saved".
**Evidence:** `signup_WL_paste_5000.png`, `signup_WL_type_past_4000.png`

## BUG-05 — Signup page description: 450-char limit not enforced
**Severity:** High · **Page:** Signup

**Steps:** In *Signup page description*, (a) paste 600 characters, or (b) type past 450.
**Expected:** Hard stop at 450, or save blocked. The helper text says "Maximum 450 characters".
**Actual:** Counter shows **600 / 450** (or 460 / 450) and the text saves. In Preview, the participant signup page overflows: the description runs past the viewport and the page scrolls.
**Evidence:** `signup_BUG_desc_600_over_450_viewport.png`, `signup_SD_paste_600.png`, `signup_SD_type_past_450.png`, `signup_BUG_preview_600char_desc.png`

## BUG-06 — Required signup fields accept empty / whitespace-only values
**Severity:** Medium · **Page:** Signup

**Steps:** Clear *Welcome letter title*, *Signup page header*, *Welcome letter description* or *Signup page description* (or enter only spaces) → blur.
**Expected:** Required-field error. Signup page step and Enrollment readiness become incomplete.
**Actual:** Saved as `null` (or as `"     "` for spaces). No error. Signup page stays green and **Enrollment 4 of 4 ✓** is unchanged.
**Evidence:** `v2_BUG06_title_header_empty_saved.png` (title and header both 0 / 40, saved, Enrollment 4 of 4 ✓), `signup_SD_empty.png` (description 0 / 450, saved)

## BUG-07 — Readiness indicators are inconsistent
**Severity:** Medium · **Pages:** Both

- With an empty email body, the sidebar marks Welcome email red and shows *Enrollment 3 of 4*, but the header pill still says **Enrollment ✓** (`email_BUG01_empty_body_saved.png`).
- On first load, before any edit, the rail showed *Enrollment 2 of 4* and *Participant prep 2 issues*. After visiting the other sub-sections, the same unchanged data showed *4 of 4* and *1 issue*. Counts seem to be computed only for sections that have been opened.

**Expected:** The header pill, rail count and dots all derive from the same validation and are correct on first load.

## BUG-08 — Autosave disables inputs; keystrokes typed right after moving fields are lost
**Severity:** Medium (silent data loss) · **Page:** Signup

**Steps**
1. Change *Welcome letter title*.
2. Immediately click *Signup page header* and start typing.
3. Blur and reload.

**Expected:** Header text is kept.
**Actual:** While the title save runs (about 750 ms), all inputs are `disabled`. The header loses focus and doesn't get it back when re-enabled, so the typed text is dropped. Reproduced three times, including with a 1.5 s pause before typing. Only the title change persists.
**Evidence:** `v2_BUG08_a_fields_locked_during_save.png` ("Saving…", all inputs greyed out), `v2_BUG08_b_typed_text_lost.png` (saved; header text unchanged)

## BUG-09 — Emoji counted as two characters
**Severity:** Low · **Page:** Signup (title & header)

Pasting 25 × 😀 leaves 20 emoji and the counter reads **40 / 40**. Both `maxlength` and the counter count UTF-16 code units, not visible characters.
**Evidence:** `v2_BUG09_emoji_20_of_40.png`

## BUG-10 — Over-limit counter has no error styling
**Severity:** Low · **Page:** Signup

"600 / 450" uses the same amber `experience-char-count warn` style as a valid "29 / 40". There is no red state, message or field highlight.
**Evidence:** `signup_BUG_desc_600_over_450_viewport.png`

## BUG-11 — `javascript:` links kept in email body
**Severity:** Low · **Page:** Welcome email

CKEditor strips `<script>` and `onerror` attributes but keeps `<a href="javascript:alert(1)">`. Most mail clients block these links, but the editor should allow only `http(s):` and `mailto:` links.

---

## Tests that passed

| Area | Result |
|---|---|
| Welcome letter title / Signup page header, typing 45 characters | Stops at 40; counter 40 / 40 ✅ |
| Same fields, pasting 60 characters | Truncated to 40 ✅ |
| Exactly 40 characters (boundary) | Accepted and saved ✅ |
| Signup page description, "lists only" rule | Ctrl+B/I/U ignored. Pasted headings, bold, links, colours, tables and images stripped to plain text; bullet lists kept ✅ |
| Counter on list content | Counts text only (e.g. "One/Two" = 6) ✅ |
| `<script>` / `onerror` in rich editors | Stripped ✅ |
| HTML typed in title / header | Stored as literal text ✅ (participant-side rendering not verified) |
| Email *Subject* | Read-only, system-set ✅ |
| Blur without a change | No save request sent ✅ |
| Real change | Autosaves; persists after reload ✅ |
| Normal email edit | Saves; `{{ button }}` becomes an ENROLL button linked to `{{ link }}` ✅ |

## Not tested
- **Send test to myself**: it sends a real email and wasn't needed to check validation.
- Enrollment form and Enrollment process sub-sections: out of scope.
- Direct API calls bypassing the UI (server-side validation was only seen through UI-triggered saves, where the server accepted every invalid value).

---

# Enrollment Form (`/build/enrol-form`)

Tested 2026-09-23 end to end: Copy from, Preview (participant view), all 10 answer types, Direct/Dependent question types, dependent logic, question images and character limits. Save endpoint: `PUT rc-api/quests/{questId}/custom-form`.

| ID | Severity | Title |
|---|---|---|
| BUG-12 | High | A dropdown question can be saved with no options, so participants can't answer it |
| BUG-13 | Medium | A dependent question can be saved with a condition that no answer can ever meet |
| BUG-14 | Medium | No character limits on Question, Instruction or export column; long text breaks the question list |
| BUG-15 | Medium | Nothing is checked before saving; admins see raw server messages and no field is highlighted |
| BUG-16 | Low | Duplicate dropdown options are accepted |
| BUG-17 | Low | The Copy from dialogs contradict each other: "replaced" vs "added" |
| BUG-18 | Low | A date of birth in the future (2035) is accepted |
| BUG-19 | Low | The phone field defaults to US even after the participant picked India in the Country code question |

## BUG-12 — A dropdown question can be saved with no options
**Steps:** Add question → Answer type *Single Selection Dropdown* → leave "Option 1" blank → Save → Preview.
**Expected:** Save blocked with "Add at least one option".
**Actual:** Saved with `"options": []` and no message. In Preview the dropdown shows "No suggestions found". If the question is required, participants can't finish enrollment.
**Evidence:** `form_BUG_preview_dropdown_no_options.png`, `form_F2_empty_option.png`

## BUG-13 — A dependent question can have an impossible condition
**Steps:** Make the parent a dropdown with no options → add a Dependent question on it → Condition shows as a free-text box → type "Deluxe" → Save.
**Actual:** Saved with `condition: ["Deluxe"]` against a parent whose options are `[]`, so the question can never appear.
**Evidence:** `form_F4_dependent_invalid_condition_saved.png`

## BUG-14 — No character limits
Question 5,000 / Instruction 20,000 / export column 1,000 characters all saved in full (4,997 / 19,996 / 1,000). No counters, no `maxlength`. The list row grows to 2,393 px and the unbroken question text covers the Optional / + / Delete controls.
**Evidence:** `form_BUG_long_question_list_row.png`, `form_L1_long_values_editor.png`

## BUG-15 — No client-side validation; raw server messages
- An empty or spaces-only question returns 400, and the toast shows `"questions" must contain at least 1 items`.
- A dependent question without a condition returns 400, and the toast shows `"questions[0].condition" is required`.
- An image of the wrong type shows `Filetype must be one of [JPG, JPEG, PNG]`.

No field is highlighted in any case.
**Evidence:** `form_F1_empty_save.png`, `form_ERR_6.png`, `form_V1_spaces_question.png`

## BUG-16 — Duplicate options accepted
Options "Yes", "Yes" save with "Question saved successfully!". **Evidence:** `form_V2_duplicate_blank_options.png` plus the save payload.

## BUG-17 — Copy from wording contradicts itself
The first dialog says "Existing answers on this form are replaced". The second says questions "will be added to your current form". Copy from only shows when the form is empty. **Evidence:** `form_C1_copy_from_dialog.png`, `form_C5_copy_preview_source.png`

## BUG-18 — Future date of birth accepted
In Preview, 01/15/2035 is accepted for Date of birth. The Date type has no min/max setting. **Evidence:** `form_P17_date_future.png`, `form_BUG_future_dob_accepted.png`

## BUG-19 — Phone field isn't linked to the Country code answer
After picking India +91 in the Country code question, the phone field still defaults to the US flag. **Evidence:** `form_P12b_country_dropdown.png`, `form_P14_phone_short.png`

## Passed (Enrollment form)
Copy from search (partial, case-insensitive, trimmed, empty state, own experience excluded); Copy questions disabled for an empty source; copying 6 questions incl. dependents (IDs consistent, images kept); all 10 answer types; all 4 File categories; Scale 5–10 with subtitles; Direct/Dependent (Dependent disabled until a parent exists); switching answer type clears old data; JPG/PNG/5.7 MB image with 2:1 crop; AVIF/PDF rejected; deleting a parent warns and removes its dependents; + inserts below; Preview dependent show/skip; required messages; email/phone/date format checks; Preview end screen.

## Design limits / not verified
- Each parent option can drive only one dependent question ("Yes (Used)").
- Copied questions keep the source's question and option IDs.
- Drag-to-reorder not verified (automated drag didn't trigger react-dnd).

## Final form state (10 questions, as requested)
1. Medical conditions? — Single dropdown, required, image
2. Upload a doctor's note — File Upload (Insurance), Dependent on #1 = Yes, required
3. Full legal name — Text, required
4. Personal email address — Email, required
5. Country code — Country Code, required
6. Mobile phone number — Phone, required
7. Date of birth — Date, required
8. Home address — Address, required
9. Dietary preferences — Multiple dropdown, required, image
10. Fitness level — Scale 1–10, required, image

All other test questions (copied set, uploads, TEMP and char-limit questions) were deleted. Before testing, the form had no active questions: its one question had been deleted at 11:13, before this session.
