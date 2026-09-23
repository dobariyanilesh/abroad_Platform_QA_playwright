# Experiences Admin Page Field Context

Inspected page: https://rc-admin.abroad.io/admin/experiences

Scope: I inspected the Experiences list and one existing experience in read-only fashion. I did not create a new experience, submit a form, delete anything, or save edits.

Legend:
- Admin: internal team/admin use only.
- Prosperity: public Prosperity marketing page.
- Participant: enrolled participant portal or participant-facing flow.

## 1. Experiences List Page

| Field / control | Context for testing |
| --- | --- |
| New experience | Menu to start a new experience. Options: `Start from scratch` and `Copy from another experience`. Test that it opens the correct create flow without affecting the list until saved. |
| Start from scratch | Creates or opens a blank experience setup path. Use when all name, dates, pricing, and content will be entered manually. |
| Copy from another experience | Reuses existing content, enrollment, and prep setup, then lets admin change unique details. |
| Active / Archive tabs | Switches between active and archived experiences. Test count/list changes and URL/state. |
| Search experiences | Filters list by experience name/location. Test partial name, location, empty state, and clearing search. |
| Filter experiences | Dropdown with Active/Archive status. Test it matches the selected tab/list state. |
| Experience Name | Internal/display name shown in admin list; row opens experience detail. |
| Start Date / End Date | Main experience date range used to calculate duration and status. |
| Status | Experience lifecycle, such as Draft, Published, Upcoming. |
| Readiness | Build readiness indicators for Prosperity, Enrollment, and Prep. Check mark means complete; numbers indicate issues/missing items. |
| Participants | Count of enrolled participants for that experience. |

## 2. Experience Header And Overview

| Field / control | Context for testing |
| --- | --- |
| Breadcrumb: Experiences | Returns to the Experiences list. |
| Experience title | Current experience name in the header. |
| Published/Draft status | Publication state dropdown. Treat as high-impact because it affects public/participant visibility. |
| Preview | Opens preview options for public/participant views. |
| Overview tab | Summary dashboard for readiness and operational status. |
| Build tab | Main editor for setup, public content, enrollment, and participant prep. |
| Manage tab | Operational area for participants, payments, and inquiries. |
| Readiness cards | Prosperity page, Enrollment, and Departure prep status. Use these to verify missing fields and completed sections. |
| Current snapshot | Roster count, collected amount, outstanding amount, missing documents, and attention items. |
| Experience status | Published/Draft plus timing status, start date, capacity, and prep state. |

## 3. Build - Set Up

| Field / control | Context for testing |
| --- | --- |
| Internal Name | Admin-only name used internally and in admin lists. |
| Public Title | Prosperity + Participant title. This is what users should see publicly and in their experience. |
| Experience Program Type | Prosperity free text, for example Quest, Retreat, Pilgrimage. Clients see exactly what is typed. |
| Experience Leader Emails | Admin-only owner/leader email selector. Test valid emails and multiple entries. |
| Summary | Prosperity short/long summary shown on open experience pages. |
| Show in open experiences | Prosperity visibility toggle for public/open listing. |
| Experience Starts | Main start date for programme. |
| Experience Ends | Main end date for programme. Duration is calculated from start/end dates. |
| Additional Date - Description | Participant-facing label for extra dates, such as pre-tour, capstone, or prep event. |
| Additional Date - Starts / Ends | Participant-facing extra date range. |
| Add new date / Remove | Adds or removes additional participant-visible dates. |
| Duration | Prosperity + Participant duration copy. Can be calculated or manually described. |
| Group Size | Prosperity + Participant cohort size copy. |
| Location | Prosperity + Participant location label. |
| Quest Location Timezone | Time zone selector used for experience/local scheduling. |
| Shared Room | Prosperity shared-room price. |
| Single Occupancy Rate | Prosperity single-occupancy supplement or price. Optional. |
| Deposit | Participant payment setting, default percentage to hold place. |
| Balance Due | Participant payment setting, days/date before departure when balance is due. |
| Header Image | Participant/admin thumbnail image. Used in admin list and participant experience header, not the rotating Prosperity slider. |

## 4. Build - Content

| Field / control | Context for testing |
| --- | --- |
| Slider Images | Prosperity rotating hero images. Includes upload/replace/remove, image order, and alt text fields. First image loads first. |
| Slider Image Alt Text | One-line explanation of each hero image for accessibility/SEO. |
| Add New Image | Adds another Prosperity hero slider image. |
| Inclusions - Experiential | Repeatable Prosperity list of in-person/in-trip inclusions. Supports reorder, add, delete. |
| Inclusions - Digital | Repeatable Prosperity list of digital/platform/coaching inclusions. Supports reorder, add, delete. |
| Complementary support checkbox | Indicates whether the experience includes pre/post coaching or similar support. |
| Faculty | Prosperity + Participant repeatable faculty list. Each card has image, name, role/credential/description, order, add, delete. |
| Your Journey | Prosperity repeatable marketing phase list. Each phase has image, title, and description. Not the dated itinerary. |
| FAQs | Prosperity repeatable FAQ list. Each item has question and answer; supports reorder, add, delete. |
| Express Interest - Button Label | Prosperity CTA label, for example Apply Now. |
| Express Interest - Full Name | Locked required inquiry field, always collected. |
| Express Interest - Email | Locked required inquiry field, always collected. |
| Express Interest - Referral Name | Locked optional inquiry field. |
| Express Interest - LinkedIn / Website | Locked optional inquiry field for profile or website. |
| Express Interest - Occupancy Preference | Locked required inquiry field, used to show matching price. |
| Express Interest - Extra Questions | Repeatable optional inquiry questions with title and prompt. Submissions appear under Manage - Inquiries and do not enroll the person. |
| RSVP Type | Prosperity RSVP event type, such as upcoming session. |
| RSVP Date | Public RSVP date. |
| RSVP Pacific Time | Public RSVP time shown in Pacific time. |
| RSVP Link | Public RSVP URL, typically Zoom or event link. |
| Partners | Optional Prosperity partner list. Each item has partner name, description/copy, and likely logo/media. |
| Main Video Title | Prosperity video section title. |
| Main Video YouTube Link | YouTube URL for main video. |
| Main Video Poster Image | Image used before the video plays. |
| Testimonials | Optional Prosperity testimonials. Supports up to three sections, each with up to three videos. Test title, video details, ordering, and empty section behavior. |

## 5. Build - Enrollment

| Field / control | Context for testing |
| --- | --- |
| Signup Page - Welcome Letter Title | Participant welcome-letter title. Observed limit: 40 characters. |
| Signup Page - Welcome Letter Description | Rich text/body shown in first welcome screen before signup. |
| Signup Page Header | Participant signup page header. Observed limit: 40 characters. |
| Signup Page Description | Participant signup page description. Observed limit: 450 characters, simple formatting/lists only. |
| Welcome Email Subject | System-set email subject. Not editable. |
| Welcome Email Body | Editable email body. Must preserve `{{ fullName }}` and `{{ button }}` variables; `{{ button }}` is the signup link. |
| Enrollment Form Questions | Participant questions shown during enrollment. Supports reorder, add, delete. |
| Question | Question title. |
| Instruction | Supporting question prompt/instruction text. |
| Answer Type | Field type, for example multiple-selection dropdown. |
| Question Text For Export Report | Optional alternate column name for exported responses. |
| Options | Answer options for dropdown/multiple-choice style questions. |
| Question Type | Direct or dependent/conditional question behavior. |
| Required Question | Toggle that controls whether participant must answer. |
| Question Image | Optional image attached to a question. |
| Position Of Image | Placement of question image, for example left. |
| Enrollment Process Step | Participant post-enrollment checklist step. |
| Enable This Step | Toggle to include/skip the step for participants. |
| Step Title | Participant-facing step title. |
| Step Description | Participant-facing guidance for that step. |

## 6. Build - Participant Prep

| Field / control | Context for testing |
| --- | --- |
| Learning Resource Tabs | Listen, Watch, Read resource categories. Test counts and switching. |
| Search Audio Title | Filters learning-resource library by title. |
| Resource/Module Selector | Selects/filter modules/resources from library. |
| On This Experience | Attached resources list. Supports order and remove. |
| Library - Add Module | Adds library modules/resources to this experience. |
| Itinerary - Copy From Another Experience | Reuses a schedule from another experience. |
| Itinerary Days | Day list with date, subtitle, and entry count. |
| Day Subtitle | Participant-facing subtitle for selected itinerary day. |
| Day Image | Image for selected itinerary day. |
| Entry From / To / Length | Timed itinerary entry schedule. Length is derived from from/to. |
| Entry Title | Participant-facing itinerary item title. |
| Add Entry | Adds another timed entry to the selected day. |
| Preview PDF / Download PDF | Itinerary PDF preview/download actions. |
| Send Notification | Sends participant notification about itinerary/prep update. Confirm before use in testing. |
| Travel Checklist Description | Overall checklist description for participants. |
| Add Section | Adds checklist section. |
| Section Title | Title for a checklist section. |
| Checklist Item | Repeatable item participants tick off. |
| Section Notes | Optional notes for a checklist section. |
| Add Item | Adds another checklist item in the section. |
| Orientation Call Link | Participant link to book/join orientation. |
| Orientation Call Date | Participant-facing orientation date. |

## 7. Manage

| Field / control | Context for testing |
| --- | --- |
| Participants tab | Roster management for enrolled people. |
| Add Participant | Starts adding/enrolling a participant. Treat as side-effecting if submitted. |
| Export Form Answers | Downloads participant enrollment responses. |
| Download Travel Documents | Downloads participant uploaded travel documents. |
| On The Roster | Count of enrolled participants against capacity. |
| Outstanding | Outstanding payment amount and number of people. |
| Documents Missing | Count of missing documents across participants. |
| Participant Name / Email | Participant identity columns. |
| Payment | Amount paid vs required amount. |
| Enrollment Form | Link/status for enrollment responses. |
| Air Ticket / Insurance / Passport / Headshot | Travel document status columns. |
| Signup Date | Date participant signed up. |
| Actions | Row-level menu, likely participant-specific actions. |
| Payments tab | Transaction management for the experience. |
| Collected / Outstanding | Payment summary totals for the experience. |
| Succeeded / Failed / All | Payment outcome filters. |
| Payment User | Participant/customer attached to transaction. |
| Payment Type / Method | Full/manual/payment method such as card or ACH. |
| Amount | Transaction amount. |
| Date | Transaction date. |
| Status | Transaction status. |
| View Record / Open In Stripe | Transaction detail actions. Opening Stripe leaves admin context. |
| Inquiries tab | Express Interest submissions. Empty state shown when no inquiries exist. |
| Inquiry Name / Email | Person who submitted Express Interest. |
| Inquiry Date | Date submitted. |
| Occupancy | Occupancy preference from inquiry. |
| Inquiry Status | New/enrolled state. |
| Inquiry Actions | Read answers or enroll from inquiry. Enrolling is side-effecting. |

## Suggested QA Focus

- Verify no autosave fires when only navigating sections.
- Test character limits on title/header/description fields.
- Test image upload/replace/remove in a non-production-safe record only.
- Test dependent enrollment questions with valid and invalid dependency selections.
- Test readiness numbers update when required fields are missing or completed.
- Test Preview views for Prosperity and Participant after editing public fields.
- Confirm status changes and participant/inquiry enrollment actions only with explicit approval because they affect live admin state.
