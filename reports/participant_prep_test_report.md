# Test Report: Build › Participant prep (Learning Resource, Itinerary, Travel Checklist)

| | |
|---|---|
| **Environment** | RC: `https://rc-admin.abroad.io` / `rc-api.abroad.io`, Chrome 153, Windows 10 |
| **Experience** | QA Field Test Experience 2K26 (`6ab3648f6762f1a06edb9a27`), Published · Upcoming |
| **Pages** | `/build/prep-learning`, `/build/prep-schedule`, `/build/prep-checklist` |
| **Tested** | 2026-09-24, QA admin account |
| **Evidence** | `screenshots/prep/` (identity-document upload blurred) |
| **Interactive report** | https://claude.ai/artifact/UF9fNTmPQA6WMUoM1nAopd |

**Result:** 93 test cases: 61 passed, 31 failed, 1 not executed. 19 bugs: 3 High, 9 Medium, 7 Low.

All test data was reverted. The Learning Resource tabs, the itinerary and the travel checklist match their pre-test state, verified via the API after a reload. The shared library still has two QA records the UI cannot delete: video "QA Test Video - Prep Learning" and article "QA Test Blog - Prep Learning", both detached. **Please delete the PDF uploaded by the BUG-03 test from the media bucket** (it is an identity-document scan; exact object key shared with the dev team separately). Send Notification was not executed because it would message real participants.

## Bug summary

| ID | Severity | Area | Title |
|---|---|---|---|
| BUG-01 | High | Learning › Read | Link-type article accepts a javascript: URL and attaches it to the experience |
| BUG-02 | High | Itinerary › Entries | “Add row below” silently shifts the times of every later entry, and the shift is saved |
| BUG-03 | High | Learning › Watch | Video thumbnail accepts a PDF; the raw file is uploaded to S3 and served by imgix |
| BUG-04 | Medium | Itinerary › PDF | PDF day numbers skip empty days and no longer match the admin |
| BUG-05 | Medium | Itinerary › Entries | Overlapping entries allowed; editing one row silently changes the next |
| BUG-06 | Medium | Itinerary › Entries | Incomplete entries are saved; entries without a title are silently dropped |
| BUG-07 | Medium | Itinerary › Entries | A saved From time is shown blank when it is earlier than the previous row's end |
| BUG-08 | Medium | Learning › Watch / Read | Raw backend validation messages reach users; required fields aren't marked or checked |
| BUG-09 | Medium | Learning › Listen | A track can be attached twice: on its own and again inside its module |
| BUG-10 | Medium | Learning › Watch | Video duration accepts 0, decimals and 99,999,999; negatives rejected only by the server |
| BUG-11 | Medium | Travel Checklist | Whitespace-only section title is saved; the PDF prints a section with no heading |
| BUG-12 | Medium | All three pages | No character limits or counters on any Participant prep text field |
| BUG-13 | Low | Itinerary / Checklist PDFs | Long unbroken text (e.g. URLs) overflows the day list and is clipped in both PDFs |
| BUG-14 | Low | Itinerary › Day image | Unsupported day-image files are ignored without a message; no minimum resolution |
| BUG-15 | Low | Learning › Listen | Search with no results says “All matching audio is already attached.” |
| BUG-16 | Low | Itinerary › Copy | Copy itinerary overwrites existing days without saying so; dates shown MM/DD/YYYY |
| BUG-17 | Low | Travel Checklist › Add section | New section: the blank item row disappears when the title autosaves |
| BUG-18 | Low | Travel Checklist | Counts read “1 sections · 1 items”; sidebar “2 / 3” is unlabeled |
| BUG-19 | Low | Travel Checklist | Section title input is force-capitalized, so it doesn't show what was typed |

---

## BUG-01: Link-type article accepts a javascript: URL and attaches it to the experience
**Severity:** High · **Area:** Learning › Read

**Steps**
1. Read tab → Add new blog.
2. Type = Link. Fill Title, Author, Short description.
3. Link URL = javascript:alert(1) → Save blog.

**Expected:** Only http(s) URLs are accepted, with an inline error for anything else.

**Actual:** POST /quests/blogs → 200 with blogLink "javascript:alert(1)". The article is created and auto-attached (Read · 3), so participants would get a script link. No URL validation of any kind on the Link field.

**Impact:** Stored script-URL (XSS) risk on the participant platform wherever blogLink is rendered as an href.

**Evidence:** `screenshots/prep/BUG_LR_blog_link_js_saved.png`

## BUG-02: “Add row below” silently shifts the times of every later entry, and the shift is saved
**Severity:** High · **Area:** Itinerary › Entries

**Steps**
1. Day with entries 12:00–17:00, (no time), 14:00–15:00, 15:30–16:00.
2. Click + (Add row below) on the first entry.
3. Type a title in the new row and tab out.

**Expected:** An empty row is inserted. Existing entries keep their times.

**Actual:** The new row gets 17:00–17:15 and every row below is pushed down with its length kept: 14:00–15:00 becomes 17:30–18:30, 15:30–16:00 becomes 18:30–19:00. The header still says “All changes saved”. Preview PDF shows the shifted times straight away. The next autosave persists them, confirmed by GET /itinerary.

**Impact:** The participant schedule is rewritten with no warning. Admins won't notice unless they re-check every time.

**Evidence:** `screenshots/prep/BUG_IT_add_row_below_shifts_times.png`, `screenshots/prep/BUG_IT_add_row_below_shifts_times_saved.png`, `screenshots/prep/IT_17_preview_pdf_day2.png`

## BUG-03: Video thumbnail accepts a PDF; the raw file is uploaded to S3 and served by imgix
**Severity:** High · **Area:** Learning › Watch

**Steps**
1. Watch tab → Add new video → Upload image.
2. Pick a .pdf (file dialog set to All files).
3. Crop dialog shows a broken image → Apply crop.

**Expected:** Rejected with “JPG, JPEG or PNG only”, as the helper text says. The Itinerary day image already rejects PDFs.

**Actual:** GET /video/signed-url?fileType=PDF issues a signed URL. The original PDF is PUT to `images/videos/video-<timestamp>.pdf` with no cropping, and imgix renders it as the thumbnail. The form is locked on “Uploading…” for about 15 s.

**Impact:** Any document can be published to the public CDN from a thumbnail slot. The tested file contained personal data (blurred here).

**Evidence:** `screenshots/prep/BUG_LR_thumb_pdf_crop_broken.png`, `screenshots/prep/BUG_LR_thumb_pdf_apply_crop.png`, `screenshots/prep/BUG_LR_thumb_pdf_uploaded.png`

## BUG-04: PDF day numbers skip empty days and no longer match the admin
**Severity:** Medium · **Area:** Itinerary › PDF

**Steps**
1. Leave Day 2 (16 Nov) empty and fill Day 3 (17 Nov).
2. Preview PDF or Download PDF.

**Expected:** 17 Nov is titled “Day Three”, matching Day 3 in the admin.

**Actual:** 17 Nov is printed as “Day Two - …” and every later day is off by one. The PDF numbers days by their position among non-empty days.

**Impact:** Participants and staff refer to different day numbers.

**Evidence:** `screenshots/prep/BUG_IT_pdf_day_numbering_skips_empty.png`, `screenshots/prep/BUG_IT_pdf_day_numbering_admin_day3.png`

## BUG-05: Overlapping entries allowed; editing one row silently changes the next
**Severity:** Medium · **Area:** Itinerary › Entries

**Steps**
1. Entries 12:00–(none), (none), 14:00–15:00, 15:30–16:00.
2. Set the first entry's To = 17:00.

**Expected:** Overlap is blocked or flagged, and other rows don't change.

**Actual:** Saved 12:00–17:00 overlapping 14:00–15:00 and 15:30–16:00. The untimed row was auto-set to 17:00–17:15 without any input. The list is not sorted by time, and the overlap is still there after a reload.

**Evidence:** `screenshots/prep/BUG_IT_overlap_entries.png`, `screenshots/prep/IT_12_after_reload_entries.png`

## BUG-06: Incomplete entries are saved; entries without a title are silently dropped
**Severity:** Medium · **Area:** Itinerary › Entries

**Steps**
1. Add entry with only a title.
2. Add entry with From only (To cleared by moving From past To).
3. Add entry with From/To but no title → reload.

**Expected:** From, To and Title are all required, with an inline message.

**Actual:** Title-only is saved with fromTime "" and toTime "". From-only is saved with toTime "". A time-only row is never sent to the API but stays on screen, so it disappears on reload. The Day's entry count doesn't include it.

**Evidence:** `screenshots/prep/BUG_IT_incomplete_entries_saved.png`, `screenshots/prep/BUG_IT_from_after_to_saved.png`

## BUG-07: A saved From time is shown blank when it is earlier than the previous row's end
**Severity:** Medium · **Area:** Itinerary › Entries

**Steps**
1. After BUG-05, look at the “QA 14-15 session” row, or reload the page.

**Expected:** The row shows From 14:00.

**Actual:** From shows the “From” placeholder, while Length still says 1h and the API has 14:00. The value is hidden because the dropdown only lists times after the previous row's To.

**Evidence:** `screenshots/prep/IT_12_after_reload_entries.png`

## BUG-08: Raw backend validation messages reach users; required fields aren't marked or checked
**Severity:** Medium · **Area:** Learning › Watch / Read

**Steps**
1. Add new video: Title + URL “not-a-url” → Save.
2. Valid URL, no thumbnail → Save.
3. Add new blog: Title only → Save.

**Expected:** Readable inline messages next to each field. Required fields (thumbnail, author, short description, body) are marked and checked before saving.

**Actual:** Toasts show Joi text, including the URL regex: “"url" with value "not-a-url" fails to match the required pattern: /(?:https?:\/\/)?…/”, “"thumbnail" is required”, “"subTitle" is not allowed to be empty…”. The client only checks Title (and URL for video). No field is highlighted.

**Evidence:** `screenshots/prep/BUG_LR_raw_regex_error_toast.png`, `screenshots/prep/BUG_LR_video_thumbnail_required_raw_error.png`, `screenshots/prep/LR_31_blog_title_only.png`

## BUG-09: A track can be attached twice: on its own and again inside its module
**Severity:** Medium · **Area:** Learning › Listen

**Steps**
1. Expand Module Two → Add “The Universality of Human Emotion with Exercise”.
2. Click Add module on Module Two.

**Expected:** Adding the module is blocked or merged, or the standalone track is removed.

**Actual:** Both are attached (PUT /journey 204). Participants get the track twice.

**Evidence:** `screenshots/prep/BUG_LR_duplicate_track_and_module.png`

## BUG-10: Video duration accepts 0, decimals and 99,999,999; negatives rejected only by the server
**Severity:** Medium · **Area:** Learning › Watch

**Steps**
1. Add new video → Duration = 0 / 1.5 / 99999999 / -5 → Save.

**Expected:** Whole minutes from 1 to a sensible maximum. The input has min="1" but it isn't enforced.

**Actual:** 0, 1.5 and 99999999 are sent to the API and pass its validation (the request failed only on the missing thumbnail). -5 is rejected by the server with the raw “"timeInMinute" must be greater than or equal to 0”.

**Evidence:** `screenshots/prep/BUG_LR_video_duration_zero.png`, `screenshots/prep/BUG_LR_video_duration_negative.png`

## BUG-11: Whitespace-only section title is saved; the PDF prints a section with no heading
**Severity:** Medium · **Area:** Travel Checklist

**Steps**
1. Section title = four spaces → blur.
2. Preview PDF.

**Expected:** The title is trimmed and required, with an inline error.

**Actual:** PUT /quests saves title "    ". The admin shows an untitled row and the PDF shows an icon with no heading. An empty title is silently discarded (no request, no message), so the admin gets no feedback either way.

**Evidence:** `screenshots/prep/BUG_TC_whitespace_section_title_saved.png`, `screenshots/prep/BUG_TC_whitespace_title_pdf.png`, `screenshots/prep/BUG_TC_empty_section_title_saved.png`

## BUG-12: No character limits or counters on any Participant prep text field
**Severity:** Medium · **Area:** All three pages

**Steps**
1. Paste long values into each field (see “Character limits found” on the Coverage tab).

**Expected:** Each field has a documented max length, enforced in the UI with a counter and matched on the server.

**Actual:** Video title (1,000), video description (10,000), day subtitle (1,000), entry title (1,000), checklist description (5,000), section title (1,000), item (1,000) and notes (5,000) all save. Article fields have server limits (200/500/100) that the UI doesn't show until a raw error appears on save.

**Evidence:** `screenshots/prep/BUG_LR_video_title_1000_chars.png`, `screenshots/prep/BUG_LR_blog_no_char_limit.png`, `screenshots/prep/BUG_IT_subtitle_1000_chars.png`, `screenshots/prep/BUG_TC_no_char_limits.png`, `screenshots/prep/BUG_TC_long_values_after_reload.png`

## BUG-13: Long unbroken text (e.g. URLs) overflows the day list and is clipped in both PDFs
**Severity:** Low · **Area:** Itinerary / Checklist PDFs

**Steps**
1. Enter a long string without spaces in a day subtitle, entry title, or checklist item/notes.
2. Open the Days list, Preview PDF and Download PDF.

**Expected:** Text wraps (overflow-wrap:anywhere).

**Actual:** The day card text runs outside its border. In both PDFs the line runs off the page and the rest is lost. Normal text with spaces wraps correctly (TC_05).

**Evidence:** `screenshots/prep/BUG_IT_subtitle_1000_chars_daylist.png`, `screenshots/prep/BUG_IT_pdf_long_title.png`, `screenshots/prep/BUG_TC_pdf_long_text_overflow.png`

## BUG-14: Unsupported day-image files are ignored without a message; no minimum resolution
**Severity:** Low · **Area:** Itinerary › Day image

**Steps**
1. Day image → choose .avif, then .pdf.
2. Choose a 5 KB logo PNG.

**Expected:** “Only JPG, JPEG or PNG” message. Warn when an image is too small for a 2:1 banner.

**Actual:** AVIF and PDF: nothing happens, with no request and no message. The tiny PNG is accepted and stretched to a blurry banner.

**Evidence:** `screenshots/prep/IT_20_day_image_avif.png`, `screenshots/prep/IT_24_day_image_tiny.png`

## BUG-15: Search with no results says “All matching audio is already attached.”
**Severity:** Low · **Area:** Learning › Listen

**Steps**
1. Listen → Search audio title = zzqqxx.

**Expected:** “No audio matches ‘zzqqxx’.”

**Actual:** “All matching audio is already attached.” This is misleading because nothing matched.

**Evidence:** `screenshots/prep/LR_05_search_nomatch.png`

## BUG-16: Copy itinerary overwrites existing days without saying so; dates shown MM/DD/YYYY
**Severity:** Low · **Area:** Itinerary › Copy

**Steps**
1. Day 1 has content → Copy from another experience → pick a source → Copy itinerary.

**Expected:** The dialog warns that existing days will be replaced, and dates use the page's own format (Sun 15 Nov).

**Actual:** Day 1's subtitle, image and entry were replaced with no mention in the dialog. The mapping uses 01/17/2027 → 11/15/2026. The mapping itself was correct (Keep Empty and remapped days verified via API).

**Evidence:** `screenshots/prep/IT_29_copy_confirm.png`, `screenshots/prep/IT_35_copy_done.png`

## BUG-17: New section: the blank item row disappears when the title autosaves
**Severity:** Low · **Area:** Travel Checklist › Add section

**Steps**
1. Add section → type a title → Tab into the blank “Checklist item” row → start typing.

**Expected:** The blank item row stays and focus is kept.

**Actual:** The title blur saves the section with 0 items and removes the placeholder row, so the admin must click “+ Add item” again. Focus also doesn't move to the new section's title after Add section.

**Evidence:** `screenshots/prep/TC_02_add_section.png`, `screenshots/prep/TC_03b_after_title_save.png`

## BUG-18: Counts read “1 sections · 1 items”; sidebar “2 / 3” is unlabeled
**Severity:** Low · **Area:** Travel Checklist

**Steps**
1. Open Travel Checklist with one section and one item.

**Expected:** “1 section · 1 item”, with the sidebar count labeled.

**Actual:** Plural is always used, and the sidebar shows a bare sections/items ratio.

**Evidence:** `screenshots/prep/TC_01_baseline.png`

## BUG-19: Section title input is force-capitalized, so it doesn't show what was typed
**Severity:** Low · **Area:** Travel Checklist

**Steps**
1. Type “QA Health and Safety requirements for all participants…”.

**Expected:** The input shows the text as typed.

**Actual:** CSS text-transform:capitalize displays “Health And Safety Requirements For All…”, while the PDF prints it in uppercase. The admin can't see the real casing.

**Evidence:** `screenshots/prep/BUG_TC_title_capitalize_transform.png`

---

## Test cases

### Learning Resource › General

| ID | Scenario | Steps / data | Expected | Actual | Status | Bug |
|---|---|---|---|---|---|---|
| LR-01 | Page loads with Listen / Watch / Read tabs and counts | Open /build/prep-learning | Header count and tab counts match attached items; sidebar total matches | 1 listen · 1 watch · 1 read; sidebar 3 | Pass |  |
| LR-02 | Switch between tabs | Click Listen → Watch → Read | Each tab shows its attached list, library and search | As expected | Pass |  |

### Learning Resource › Listen · 1

| ID | Scenario | Steps / data | Expected | Actual | Status | Bug |
|---|---|---|---|---|---|---|
| LR-03 | Expand and collapse a library module | Click ▾ on Module Two | Tracks of the module listed with Add buttons | As expected | Pass |  |
| LR-04 | Attach a single track | Add “The Universality of Human Emotion…” | Track appended as #2 (TRACK), removed from library, counts +1, autosaved | PUT /journey 204; Listen · 2 | Pass |  |
| LR-05 | Attach a whole module | Add module on Module Three/Two | Module appended as MODULE | As expected | Pass |  |
| LR-06 | Duplicate prevention for track + parent module | Attach track, then its module | Blocked or merged | Both attached, so the track is duplicated | Fail | BUG-09 |
| LR-07 | Search: valid keyword | Search = Burnout | Module Seven and its 3 burnout tracks | As expected (about 2 s) | Pass |  |
| LR-08 | Search: case-insensitive | BURNOUT / burnout | Same results | Same results | Pass |  |
| LR-09 | Search: leading and trailing spaces | “  Burnout  ” | Trimmed, same results | Same results | Pass |  |
| LR-10 | Search: no match | zzqqxx | “No results” message | “All matching audio is already attached.” | Fail | BUG-15 |
| LR-11 | Search: script and special characters | &lt;script>alert(1)&lt;/script>, %_*, 300 × a | No execution, no crash | Handled safely | Pass |  |
| LR-12 | Program dropdown | Open dropdown → select Evolution | 8 programs; library switches to Evolution modules | As expected | Pass |  |
| LR-13 | Drag to reorder attached items | Drag #3 to top → reload | New order saved and kept after reload | PUT /journey with new order; kept | Pass |  |
| LR-14 | Remove attached item | Trash → Cancel; trash → Esc; trash → Delete | Confirm dialog; Cancel/Esc keep; Delete detaches | As expected; item back in library | Pass |  |

### Learning Resource › Watch · 1

| ID | Scenario | Steps / data | Expected | Actual | Status | Bug |
|---|---|---|---|---|---|---|
| LR-15 | Attach a library video (with search) | Search “regeneration” → Add | Attached as #2 | As expected | Pass |  |
| LR-16 | Open an attached video for editing | Click the video row | Edit form prefilled (Title, YouTube URL, Description, Duration, Thumbnail) | As expected | Pass |  |
| LR-17 | Add new video: empty save | Add new video → Save video | Required-field message | Toast “Title and YouTube URL are required.” with no field highlight | Pass |  |
| LR-18 | Whitespace-only title and URL | Title = URL = spaces | Treated as empty | Same toast; nothing sent | Pass |  |
| LR-19 | Invalid YouTube URL | URL = not-a-url | Friendly inline error | Raw Joi regex in toast (400) | Fail | BUG-08 |
| LR-20 | Thumbnail requirement visible up front | Valid title/URL, no thumbnail | Thumbnail marked required and checked client-side | Server-only raw “"thumbnail" is required” | Fail | BUG-08 |
| LR-21 | Duration validation | 0, 1.5, 99999999, -5, typing e/+/- | Whole minutes ≥ 1 only | 0/1.5/huge pass; -5 raw server error; letters blocked | Fail | BUG-10 |
| LR-22 | Thumbnail rejects non-image files | Upload Headshot.pdf | Rejected | Uploaded to S3 as PDF and shown as thumbnail | Fail | BUG-03 |
| LR-23 | Thumbnail crop flow | Upload banner-2.jpg → Cancel; upload again → Apply crop | 2:1 crop dialog; Cancel discards; Apply uploads | As expected | Pass |  |
| LR-24 | Remove thumbnail | × on thumbnail | “Remove this image?” confirm, then cleared | As expected | Pass |  |
| LR-25 | Create a video end to end | Title, URL, description, duration 3, thumbnail → Save | Created in library and attached | POST /video 201 + attach; toast “Video created and attached.” | Pass |  |
| LR-26 | Video title and description length | 1,000-char title, 10,000-char description | Limited with a counter | Both saved (“Video updated.”) | Fail | BUG-12 |
| LR-27 | Detach a video | Trash → “Remove this resource?” → Delete | Detached, kept in library | As expected | Pass |  |

### Learning Resource › Read · 1

| ID | Scenario | Steps / data | Expected | Actual | Status | Bug |
|---|---|---|---|---|---|---|
| LR-28 | Attach an article (with search) | Search “trilogy” → Add | Attached as ARTICLE #2 | As expected | Pass |  |
| LR-29 | Add new blog form | Add new blog | Title, Author, Short description, Type (Written/Link), Body editor, Image | As expected; labels use different casing from the video form | Pass |  |
| LR-30 | Blog: empty save | Save blog | Required message | Toast “Title is required.” | Pass |  |
| LR-31 | Blog: title only | Title filled, the rest empty | All required fields flagged inline | Raw server errors for subTitle, blog, author | Fail | BUG-08 |
| LR-32 | Link type URL validation | Type Link, URL javascript:alert(1) | Rejected | Saved and attached | Fail | BUG-01 |
| LR-33 | Blog length limits shown in UI | Title 1,000 / Short 5,000 / Author 500 | Counter or maxlength before save | Raw “length must be ≤ 200 / 500 / 100” on save | Fail | BUG-12 |
| LR-34 | Blog boundary values | Title 200, Short 500, Author 100 | Saved | PUT 200 | Pass |  |
| LR-35 | Empty state | Detach the only article | “Nothing attached yet” state | As expected; Read · 0 | Pass |  |

### Itinerary › Days & entries

| ID | Scenario | Steps / data | Expected | Actual | Status | Bug |
|---|---|---|---|---|---|---|
| IT-01 | Itinerary loads | Open /build/prep-schedule | 8 days 15–22 Nov, Day 1 open with subtitle, image, entries | As expected | Pass |  |
| IT-02 | Select a day | Click Day 2 | Heading “Monday, 16 November 2026 · Day 2” | As expected | Pass |  |
| IT-03 | Day subtitle autosave | Type subtitle → Tab | Saved, shown in Days list | PUT /itinerary 200 | Pass |  |
| IT-04 | Day subtitle length | 1,000 chars | Limited | Saved; overflows day card | Fail | BUG-12 |
| IT-05 | Time options | Open From | 00:00–23:45 every 15 min | 96 options | Pass |  |
| IT-06 | To must be after From | From 10:00 → open To | Only later times | Starts 10:15 | Pass |  |
| IT-07 | Move From past To | To 11:00, then From 12:00 | To cleared or flagged | To cleared; entry still saved without To | Fail | BUG-06 |
| IT-08 | Required entry fields | Title only / times only | All three required | Title-only saved; time-only silently dropped | Fail | BUG-06 |
| IT-09 | New entry starts after previous | + Add entry → open From | Starts at previous To | Starts 15:00 | Pass |  |
| IT-10 | Overlap prevention on edit | Row 1 To = 17:00 over later rows | Blocked or flagged | Overlap saved; next row auto-shifted | Fail | BUG-05 |
| IT-11 | Saved values always displayed | Reload after IT-10 | All saved times visible | 14:00 From shown blank | Fail | BUG-07 |
| IT-12 | Add row below | + on row 1 | Blank row inserted, others unchanged | All later rows shifted and saved | Fail | BUG-02 |
| IT-13 | Entry title length | 1,000 chars | Limited | Saved; clipped in PDF | Fail | BUG-12 |
| IT-14 | Delete entry | Trash → “Delete this itinerary entry?” | Confirm then remove | As expected | Pass |  |
| IT-15 | Length column | 12:00–17:00, 14:00–15:00, 15:30–16:00 | 5h, 1h, 30m | As expected | Pass |  |

### Itinerary › Day image

| ID | Scenario | Steps / data | Expected | Actual | Status | Bug |
|---|---|---|---|---|---|---|
| IMG-01 | Upload and crop | Upload quest JPG → move crop → Apply | 2:1 crop; S3 upload; itinerary saved | S3 PUT 200 + PUT /itinerary 200 | Pass |  |
| IMG-02 | Remove image | × → Delete | Cleared and saved | As expected | Pass |  |
| IMG-03 | Reject AVIF | Choose .avif | Clear error | Ignored silently | Fail | BUG-14 |
| IMG-04 | Reject PDF | Choose .pdf | Clear error | Rejected, but no message | Fail | BUG-14 |
| IMG-05 | Large file | 5.7 MB JPG | Uploads with progress | About 12 s with “Uploading…” overlay | Pass |  |
| IMG-06 | Low-resolution image | 5 KB logo PNG | Warning | Accepted and stretched | Fail | BUG-14 |

### Itinerary › Copy from another experience

| ID | Scenario | Steps / data | Expected | Actual | Status | Bug |
|---|---|---|---|---|---|---|
| CP-01 | Source list | Open Copy from another experience | Other experiences with status and dates; current one excluded | As expected | Pass |  |
| CP-02 | Search sources | “bhutan”, “zzzqqq”, own name | Filtered; “No experiences match that search.” | As expected | Pass |  |
| CP-03 | Mapping dialog | Pick “Wisdom Four Thousand…QA`ND” (11 days) | Old → new date mapping for 8 days | As expected | Pass |  |
| CP-04 | See original | Click (See original) | Opens source itinerary | Opens in a new tab | Pass |  |
| CP-05 | Mapping options | Open row 2 dropdown | Keep Empty plus unused dates only | As expected; duplicates impossible | Pass |  |
| CP-06 | Copy result | Row 2 = Keep Empty, row 3 = 01/27 → Copy | Days copied per mapping | All 8 days match source per mapping (API); toast shown | Pass |  |
| CP-07 | Overwrite warning | Day 1 had content before the copy | Warn before replacing | Replaced without warning | Fail | BUG-16 |

### Itinerary › Preview / Download PDF

| ID | Scenario | Steps / data | Expected | Actual | Status | Bug |
|---|---|---|---|---|---|---|
| IPDF-01 | Preview PDF | Click Preview PDF | Modal with title, day images, 12-hour times, entries | As expected | Pass |  |
| IPDF-02 | Download PDF | Click Download PDF | File downloads, content matches | “Discover Your Path A Journey of Growth_Itinerary.pdf”, 2 pages, matches | Pass |  |
| IPDF-03 | Day numbering | Empty Day 2, filled Day 3 | 17 Nov = Day Three | 17 Nov = Day Two | Fail | BUG-04 |
| IPDF-04 | Long text wraps | 1,000-char entry title | Wraps | Clipped at page edge | Fail | BUG-13 |
| IPDF-05 | Send Notification | Not clicked | n/a | Not executed: would notify real participants | Not run |  |

### Travel Checklist

| ID | Scenario | Steps / data | Expected | Actual | Status | Bug |
|---|---|---|---|---|---|---|
| TC-01 | Checklist loads | Open /build/prep-checklist | Description, sections, items, counts | As expected | Pass |  |
| TC-02 | Count wording | 1 section, 1 item | “1 section · 1 item” | “1 sections · 1 items” | Fail | BUG-18 |
| TC-03 | Description autosave | Edit → Tab | Saved | PUT /quests 200 | Pass |  |
| TC-04 | Field length limits | Description 5,000; title 1,000; item 1,000; notes 5,000 | Limited | All saved | Fail | BUG-12 |
| TC-05 | Empty section title | Clear title → Tab | Inline required error | Not saved, no message | Fail | BUG-11 |
| TC-06 | Whitespace section title | Four spaces → Tab | Rejected | Saved | Fail | BUG-11 |
| TC-07 | Reorder sections | Drag section 2 above 1 | Order saved | As expected | Pass |  |
| TC-08 | Reorder items | Drag item 2 above 1 | Order saved | As expected | Pass |  |
| TC-09 | Collapse and expand | ▸ / ▾ | Toggles section body | As expected | Pass |  |
| TC-10 | Delete section | Trash → Cancel; trash → Delete | “Delete this checklist section?” confirm | As expected | Pass |  |
| TC-11 | Last section | One section left | Can't delete the last section | Delete button hidden | Pass |  |
| TC-12 | Delete item | 2+ items → trash → Delete | “Delete this checklist item?” confirm | As expected (trash hidden when only 1 item) | Pass |  |
| TC-13 | Clear an item's text | Empty the item → Tab | Item removed | Removed without confirmation | Pass |  |
| TC-14 | HTML / script in an item | &lt;b>Bold&lt;/b>&lt;img src=x onerror=alert()> | Rendered as text | Escaped in preview; no dialog | Pass |  |
| TC-15 | Title shown as typed | “…Health and Safety requirements…” | As typed | Force-capitalized | Fail | BUG-19 |

### Travel Checklist › Add section

| ID | Scenario | Steps / data | Expected | Actual | Status | Bug |
|---|---|---|---|---|---|---|
| AS-01 | Add a section | Click Add section | New expanded section, blank title and one blank item; others collapse | As expected; focus stays on the button | Pass |  |
| AS-02 | Name the section | Title → Tab | Saved; counts update | “2 sections”, sidebar 2 / 1 | Pass |  |
| AS-03 | Blank item row survives autosave | Title → Tab into item row | Row kept | Row removed (0 items) | Fail | BUG-17 |
| AS-04 | Add items | + Add item → type → Enter / Tab | Item saved; focus in new item | As expected; counts 2 sections · 3 items | Pass |  |
| AS-05 | Section notes | Type notes → Tab | Saved | As expected | Pass |  |

### Travel Checklist › Preview / Download PDF

| ID | Scenario | Steps / data | Expected | Actual | Status | Bug |
|---|---|---|---|---|---|---|
| TPDF-01 | Preview PDF | Click Preview PDF | Title, description, sections in two columns, items with boxes, notes | As expected; normal long text wraps | Pass |  |
| TPDF-02 | Untitled section | After TC-06 | Not possible | Section with no heading | Fail | BUG-11 |
| TPDF-03 | Unbroken long text | 1,000-char item / 5,000-char notes | Wraps | Clipped at page edge | Fail | BUG-13 |
| TPDF-04 | Download PDF | Click Download PDF | File matches admin incl. order | “…_Travel Checklist.pdf”, 1 page, matches reordered content | Pass |  |
| TPDF-05 | Close preview | × in preview | Returns to page | As expected | Pass |  |
