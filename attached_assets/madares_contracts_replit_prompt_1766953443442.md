# Madares Business Platform - Contract Management & Archiving

## Project Overview
Build a comprehensive Contract Management system to digitize and track investment contracts currently managed manually in Excel and paper files. The system handles contract registration, installment payment tracking, bulk uploads, archiving, and detailed reporting.

## Tech Stack Requirements
- **Frontend**: React.js with TypeScript
- **Backend**: Node.js with Express
- **Database**: PostgreSQL (for relational contract data)
- **File Storage**: AWS S3 or similar (for contract PDFs and receipts)
- **PDF Generation**: PDFKit or Puppeteer (for exports with watermarks)
- **Excel Processing**: ExcelJS (for bulk upload/export)
- **UI Framework**: Material-UI or Ant Design
- **State Management**: Redux or Context API
- **Notifications**: Email notifications (optional future enhancement)

## Core Features

### 1. Contract Management System

The Contract Management module replaces Excel-based tracking with a centralized digital system for all investment contracts signed with investors after the bidding process.

#### Contract Data Structure

**Core Contract Fields:**
- **Contract ID**: Auto-generated unique identifier (backend sequence, non-editable)
- **Land Code**: 3-letter region code + numerical sequence (validated format, e.g., "RYD-001")
- **Asset**: Link to Asset Bank (Asset ID, Asset Name)
- **Investor**: Link to Investor database (Investor ID, Investor Name)
- **Contract Status**: Draft, Active, Expiring, Expired, Archived, Cancelled, Incomplete

**Multilingual Fields (Arabic + English):**
- Asset Name (Arabic)
- Asset Name (English)
- Investor Name (Arabic)
- Investor Name (English)

**Financial Information:**
- Annual Rental Amount (Base)
- VAT Rate: 0% / 5% / 15% (dropdown selection)
- Total Annual Amount (incl. VAT) - Auto-calculated
- Contract Duration (years)
- Total Contract Amount - Auto-calculated: (Annual Base × Duration) + VAT
- Currency: SAR (Saudi Riyal)

**Key Dates:**
- Signing Date
- Contract Start Date
- Contract End Date
- Created Date (auto)
- Last Modified Date (auto)

**Documents:**
- Signed Contract PDF (mandatory upload)
- File size limit: 10MB
- Accepted formats: PDF only
- Stored with version control

**Additional Metadata (~20-30 fields total):**
- Location details
- Property usage type
- Special conditions/notes
- Legal terms reference
- Approval authority
- Created by (user)
- Modified by (user)

#### Contract States & Lifecycle

**State Definitions:**
1. **Draft**: Contract being prepared, incomplete
   - Missing required fields OR
   - Missing PDF upload OR
   - Missing installment plan
   - Not visible in main contract list
   - Appears in "Drafts" panel

2. **Incomplete**: Created via bulk upload, needs completion
   - Has metadata but missing PDF
   - Missing installment plan
   - Requires manual completion

3. **Active**: Fully configured contract in effect
   - All required fields present
   - PDF uploaded
   - Installment plan defined
   - Current date within contract period
   - Main working state

4. **Expiring**: Active contract approaching end date
   - Within 90 days of contract end date
   - Requires attention for renewal/extension
   - Highlighted in dashboard

5. **Expired**: Contract past end date
   - End date < current date
   - Can be archived manually
   - No longer active but retained for records

6. **Archived**: Completed contracts moved to archive
   - Expired or completed contracts
   - Read-only status
   - Maintained for audit/historical purposes
   - Can be unarchived if needed

7. **Cancelled**: Contract terminated before completion
   - Requires mandatory cancellation reason
   - Asset status may change (manual process)
   - Retained for audit trail
   - Cannot be reactivated

**State Transitions:**
- Draft → Active (when all requirements met)
- Incomplete → Active (when PDF + installment plan added)
- Active → Expiring (automatically when within 90 days of end)
- Active → Cancelled (manual action with reason)
- Expiring → Expired (automatically when end date passed)
- Expired → Archived (manual action)
- Active → Archived (manual action for early completion)

**Automatic State Changes:**
- System checks daily for:
  - Active contracts approaching end date → Expiring
  - Expiring contracts past end date → Expired

### 2. Installment & Payment Management

Each contract has an installment plan defining when payments are due and tracking payment status.

#### Installment Plan Types

**Option 1: Equal Installments**
- System divides Total Contract Amount equally
- User specifies:
  - Number of installments (e.g., annual, semi-annual, quarterly)
  - Payment frequency
- System generates:
  - Equal amounts per installment
  - Due dates based on start date + frequency
  - Automatic scheduling

**Option 2: Custom Installments**
- User manually defines each installment:
  - Amount (must total = Total Contract Amount)
  - Due date
  - Description/note
- System validates:
  - Sum of installments = Total Contract Amount
  - No duplicate due dates
  - Dates within contract period

**Switching Between Plan Types:**
- User can switch from Equal → Custom
- User can switch from Custom → Equal
- Switching regenerates the plan
- Warning shown if payment statuses already marked
- Audit log records the change

#### Installment Status Tracking

**Status Options:**
1. **Pending**: Payment not yet due or received
   - Default state for future installments
   - No action required yet

2. **Overdue**: Payment past due date, not received
   - Automatically flagged when: due date < current date AND status = Pending
   - Visual highlight (red badge)
   - Dashboard alert
   - Used for reporting

3. **Partial**: Some payment received, balance outstanding
   - Manually set by TBC User
   - Requires partial amount entry
   - Receipt upload optional
   - Tracks remaining balance

4. **Paid**: Payment fully received
   - Manually set by TBC User
   - **Mandatory**: Receipt upload (PDF/JPG/PNG)
   - Receipt file size limit: 5MB
   - Cannot mark as Paid without receipt
   - Records payment date

**Installment Fields:**
- Installment Number (sequence: 1, 2, 3...)
- Amount Due
- Due Date
- Payment Status (Pending/Overdue/Partial/Paid)
- Partial Amount Paid (if partial)
- Remaining Balance (if partial)
- Payment Date (when marked paid)
- Receipt File (mandatory for Paid status)
- Notes/Comments
- Last Updated By
- Last Updated Date

**Business Rules:**
- Cannot mark as Paid without receipt upload
- Overdue flag is automatic (system-generated)
- Partial payments require amount specification
- Sum of all installments must equal Total Contract Amount
- Cannot delete installments once contract is Active
- Can edit installment amounts in Custom mode only
- Past year installments are read-only

#### Installment View by Year

**Year Filtering:**
- Default view: Current year installments
- Filter dropdown: Select year (all contract years available)
- Past years: Read-only display
- Current year: Editable (can update status, upload receipts)
- Future years: Visible but minimal interaction

**Multi-Year Contracts:**
- 5-year contract example:
  - 2025: 12 installments
  - 2026: 12 installments
  - 2027: 12 installments
  - etc.
- Year tabs or dropdown to switch views
- Summary per year: Total due, Paid, Overdue
- Cross-year reporting available

### 3. Contract CRUD Operations

#### UC-001: Add a New Contract

**Pre-conditions:**
- Asset exists in Asset Bank
- Asset status = "Available" or "Investable"
- Asset has no other active contract (one active contract per asset rule)
- Investor exists in system (from bidding results)
- User has permission to create contracts

**Flow:**
1. User navigates to Contracts → "+ Add a new contract"
2. Select Asset from Asset Bank (dropdown/search)
3. Select Investor from Investor list (dropdown/search)
4. Enter required metadata:
   - Land Code (validated format: XXX-###)
   - Contract duration (years)
   - Annual rental amount (base)
   - Start date & End date
   - Asset Name (Arabic & English)
   - Investor Name (Arabic & English)
5. Select VAT rate: 0% / 5% / 15%
6. System auto-calculates:
   - Total Annual Amount (incl. VAT)
   - Total Contract Amount = (Annual Base × Duration) + VAT
7. Define Installment Plan:
   - Choose Equal or Custom
   - Configure installments
   - System validates totals match
8. Upload signed contract PDF (mandatory)
9. Click "Save" or "Save as Draft"

**Validations:**
- Contract ID uniqueness (auto-generated, system ensures)
- Asset has no other active contract
- All required fields completed (for Active state)
- PDF uploaded (for Active state)
- Installment plan totals match contract amount
- Land Code format: 3 letters + dash + numbers
- Dates logical (end date > start date)
- Duration matches calculated date range

**Outcomes:**
- If all valid → Contract status = Active
- If missing PDF or installment plan → Save as Draft
- If validation errors → Show inline error messages, block save
- Success → Redirect to Contract Details page
- Audit log entry created
- Asset status updated (if needed)

**Error Handling:**
- Duplicate Contract ID → Block with error (shouldn't happen as auto-generated)
- Asset already has active contract → Block with error message
- Missing required fields → Inline validation, prevent save
- Invalid VAT selection → Show error
- PDF upload fails → Show error, allow retry, preserve draft
- Network error → Preserve form data as draft

#### UC-002: Manage Installment Plan

**Access:**
- From Contract Details page
- Tab: "Installments"
- Visible for Active contracts
- Edit permissions required

**Equal Installments Flow:**
1. Select "Equal Installments"
2. Specify number of installments (e.g., 12 for monthly, 4 for quarterly)
3. System calculates:
   - Amount per installment = Total Contract Amount ÷ Number of installments
   - Due dates = Start date + (interval × installment number)
4. Preview generated plan
5. Save

**Custom Installments Flow:**
1. Select "Custom Installments"
2. Add installment rows manually:
   - Click "+ Add Installment"
   - Enter amount
   - Select due date
   - Add description (optional)
3. System validates:
   - Sum = Total Contract Amount
   - No duplicate dates
   - All dates within contract period
4. Save

**Update Installment Status:**
1. View installment table (filtered by year)
2. Click on installment row
3. Update status:
   - Mark as Partial: Enter amount paid, optionally upload receipt
   - Mark as Paid: **Mandatory receipt upload**
4. Enter payment date (if paid/partial)
5. Add notes (optional)
6. Save
7. System updates:
   - Installment status
   - Payment date
   - Receipt file reference
   - Audit log

**Switch Plan Type:**
1. Click "Switch to Custom" or "Switch to Equal"
2. System shows warning if statuses already marked
3. User confirms
4. Old plan archived (audit trail)
5. New plan generated
6. Existing payment statuses cleared
7. User reconfigures plan

**Validation Rules:**
- Cannot mark Paid without receipt
- Partial amount cannot exceed installment amount
- Cannot modify past year installments (read-only)
- Sum of custom installments must equal contract total
- Receipt file types: PDF, JPG, PNG only
- Receipt size: Max 5MB

#### UC-003: Bulk Contract Upload

**Purpose:** Rapidly create multiple contract records from Excel template

**Flow:**
1. User clicks "Upload contracts (Excel)" from Contracts page
2. User downloads system-provided Excel template
3. Template includes columns for metadata only:
   - Contract ID (optional, system can generate)
   - Asset Code (must exist in Asset Bank)
   - Investor ID (must exist)
   - Land Code
   - Annual Amount
   - Duration (years)
   - Start Date
   - End Date
   - VAT Rate (0/5/15)
   - Asset Name Arabic
   - Asset Name English
   - Investor Name Arabic
   - Investor Name English
   - (Other required fields)
4. User fills template rows
5. User uploads completed file
6. System validates:
   - File structure (correct columns)
   - Each row individually:
     - Contract ID unique (if provided)
     - Asset exists and available
     - Investor exists
     - Required fields present
     - Data types correct
     - Dates valid
7. For valid rows:
   - Create contract with status = "Incomplete"
   - Store metadata
   - No PDF yet, no installment plan yet
8. For invalid rows:
   - Reject row
   - Log error reason
   - Add to error report
9. User sees summary:
   - X contracts created successfully
   - Y rows rejected
   - Download error report (Excel with row numbers + error messages)
10. Created contracts appear in Contracts list with "Incomplete" status
11. User later opens each Incomplete contract to:
    - Upload PDF
    - Define installment plan
    - Activate contract

**Template Specifications:**
- File format: .xlsx
- Max file size: 5MB
- Max rows: 1000 per upload
- Error report format: Excel with columns [Row Number, Error Message]

**Validations (per row):**
- Contract ID unique (if blank, system generates)
- Asset Code exists in Asset Bank
- Asset has no active contract
- Investor ID exists
- Land Code format valid
- Dates in correct format (YYYY-MM-DD)
- VAT rate is 0, 5, or 15
- Duration is positive integer
- Annual amount is positive number
- Required fields not blank

**Error Handling:**
- File wrong format → Reject entire file
- Missing columns → Reject entire file
- Some rows valid, some invalid → Create valid ones, report invalid ones
- All rows invalid → No contracts created, full error report
- Network error → Allow retry, no partial saves

#### UC-004: View Contracts (Contracts List)

**Layout Components:**
1. **Page Header:**
   - Title: "Contracts" with result count (e.g., "Contracts (127)")
   - Action buttons (if permissions):
     - "+ Add a new contract"
     - "Upload contracts (Excel)"
     - "Export" (PDF)

2. **Search Bar:**
   - Placeholder: "Search for contracts"
   - Search fields: Contract ID, Asset name/code, Investor name
   - Trigger: Enter key or Search button
   - Real-time or on-demand search

3. **Quick Status Tabs:**
   - Visual tabs with counts:
     - All (total count)
     - Active (count)
     - Incomplete (count)
     - Expiring (count)
     - Cancelled (count)
     - Archived (count)
   - Clicking tab applies status filter
   - Updates list + all tab counts

4. **Filters Panel:**
   - Button: "Filters" (opens dropdown/panel)
   - Filter options:
     - Investor (multi-select)
     - Asset (multi-select)
     - Date Range: Signing Date (from/to)
     - Date Range: End Date (from/to)
     - Contract Status (multi-select)
     - Expiry Window (e.g., "Within 90 days")
   - Apply Filters button
   - Clear Filters button

5. **Contracts Table:**
   - Columns:
     - Checkbox (for bulk selection)
     - Contract ID (link to details)
     - Payment Status (badge: Overdue/Pending/Partial/Paid)
     - Due Date (next installment)
     - Asset Code
     - Investor Name
     - Contract Status (badge: Active/Expiring/Cancelled/etc.)
     - Signing Date
     - End Date
     - Created By
     - Actions (kebab menu: View/Edit/Archive/Cancel)
   - Sortable columns: Contract ID, Due date, Signing date, End date, Investor name
   - Click column header to sort ASC/DESC

6. **Pagination:**
   - Items per page: 10 / 20 / 50 (dropdown)
   - Page navigation: First, Previous, Next, Last
   - Display: "Page X of Y"
   - Total results count

7. **Drafts Panel:**
   - Collapsed component showing draft count
   - Click to expand and view draft contracts
   - Drafts can be resumed/edited
   - Drafts not counted in main results

8. **Empty States:**
   - No contracts exist: "No contracts found. Add your first contract."
   - No results from filters: "No contracts match your filters. Clear filters to see all."
   - No drafts: "No drafts available"

**Badge Styling:**
- **Payment Status:**
  - Overdue: Red badge
  - Pending: Yellow badge
  - Partial: Orange badge
  - Paid: Green badge
- **Contract Status:**
  - Active: Green badge
  - Expiring: Orange badge
  - Expired: Gray badge
  - Cancelled: Red badge
  - Archived: Light gray badge
  - Incomplete: Blue badge
  - Draft: Dotted border badge

#### UC-005: Update or Correct Contract

**Editable Fields (Active Contracts):**
- Metadata fields (most fields)
- Asset Name (multilingual)
- Investor Name (multilingual)
- Financial amounts (with recalculation)
- VAT rate (triggers recalculation)
- Dates (with validation)
- Notes/comments
- Documents (can upload new version)

**Non-Editable Fields:**
- Contract ID (system-generated)
- Created by / Created date
- Audit history

**Restrictions:**
- Cannot edit Archived or Cancelled contracts
- Cannot change asset if installments paid
- Cannot change investor if payments received
- Cannot change contract amount if installments tracked

**Edit Flow:**
1. Open Contract Details
2. Click "Edit" button
3. Modify fields
4. System validates changes
5. If financial fields changed:
   - System recalculates totals
   - Shows impact on installments
   - User confirms changes
6. Save
7. System:
   - Updates contract record
   - Creates audit log entry
   - Shows version history
   - Recalculates installments if needed

**Version Control:**
- Each edit creates new version
- Previous versions retained
- Audit trail shows who/when/what changed
- Can view historical versions

#### UC-006: Archive / Cancel Contract

**Archive Contract:**
- **Purpose:** Move expired or completed contracts to archive
- **Pre-conditions:**
  - Contract status = Expired OR
  - Contract fully paid (all installments Paid)
- **Flow:**
  1. Open Contract Details
  2. Click "Archive Contract"
  3. System prompts: "Are you sure?"
  4. User confirms
  5. System:
     - Changes status to Archived
     - Moves to archived list
     - Records in audit log
     - Asset status can be updated
  6. Archived contracts:
     - Visible in Archived tab
     - Read-only
     - Can be unarchived if needed
     - Retained permanently for compliance

**Cancel Contract:**
- **Purpose:** Terminate contract before completion
- **Pre-conditions:**
  - Contract status = Active or Expiring
  - User has cancellation permission
- **Flow:**
  1. Open Contract Details
  2. Click "Cancel Contract"
  3. System shows cancellation form:
     - **Mandatory**: Cancellation Reason (dropdown)
       - Investor default
       - Asset issues
       - Mutual agreement
       - Legal/regulatory
       - Force majeure
       - Other (specify)
     - **Mandatory**: Detailed Justification (min 100 characters)
     - **Optional**: Attach supporting documents
  4. User fills form
  5. User confirms cancellation
  6. System:
     - Validates mandatory fields
     - Changes contract status to Cancelled
     - Records cancellation details
     - Creates audit log
     - Notifies relevant parties (optional)
     - Asset status handling:
       - If "Asset issues" → TBC User can manually set Asset to "Blocked"
       - Otherwise → Asset returns to "Available" (manual process)
  7. Cancelled contracts:
     - Visible in Cancelled tab
     - Read-only
     - Cannot be reactivated
     - Audit trail preserved

**Asset Status Impact:**
- Archive: Asset can be registered again (manual)
- Cancel (Asset issues): TBC can block asset
- Cancel (Other reasons): Asset returns to available pool

**Business Rules:**
- Cannot archive Active contracts
- Cannot cancel Archived contracts
- Cannot cancel Expired contracts (must archive)
- Cancellation reason is mandatory
- Cancelled contracts visible for audit/compliance
- Archived contracts can be unarchived by Admin

#### UC-007: Searching, Filtering, Sorting

**Search Functionality:**
- Single search bar
- Placeholder: "Search for contracts"
- Search fields:
  - Contract ID (exact or partial match)
  - Asset name (Arabic or English)
  - Asset code
  - Investor name (Arabic or English)
- Search trigger: Enter key or Search button
- Clear search: X button in search field
- Real-time suggestions (optional enhancement)

**Quick Status Tabs:**
- Pre-defined filters with live counts
- Tabs: All, Active, Incomplete, Expiring, Cancelled, Archived
- Single click applies filter
- Updates result count and list
- Visual indicator for active tab
- Tab counts update with other filters

**Advanced Filters:**
- **Investor Filter:**
  - Multi-select dropdown
  - Search within investor list
  - "Select All" option
  - Shows selected count (e.g., "Investors (3)")
- **Asset Filter:**
  - Multi-select dropdown
  - Search within asset list
  - Shows asset code + name
- **Date Ranges:**
  - Signing Date: From/To date pickers
  - End Date: From/To date pickers
  - Preset options: Last 30 days, Last 90 days, This year, Custom
- **Contract Status:** (if not using tabs)
  - Multi-select: Draft, Active, Expiring, Expired, Archived, Cancelled, Incomplete
- **Expiry Window:**
  - Within 30 days
  - Within 60 days
  - Within 90 days
  - Custom date
- **Payment Status:**
  - Has overdue payments
  - All paid
  - Has pending payments
  - Has partial payments

**Filter Application:**
- Filters button opens panel
- Select multiple filters
- Click "Apply Filters"
- Results update
- Active filters shown as chips (can remove individually)
- "Clear All Filters" button
- Filter state preserved in URL (for sharing)

**Sorting:**
- Sortable columns:
  - Contract ID (alphanumeric)
  - Due date (next installment date)
  - Signing date
  - End date
  - Investor name (alphabetical)
- Click column header to sort
- Arrow indicator shows sort direction
- Toggle ASC ↔ DESC
- Default sort: Contract ID ASC
- Sort state persists with pagination

**Combined Behavior:**
- Search + Filters + Tabs all work together
- Result count updates dynamically
- Tab counts reflect current search/filters
- Clear search doesn't clear filters
- Clear filters doesn't clear search
- "Clear All" button resets everything

#### UC-008: Export Contracts

**Export Format:** PDF only (with watermark)

**Flow:**
1. User applies filters/search (optional)
2. User clicks "Export" button
3. System generates PDF with:
   - Current filtered results
   - All visible columns
   - Watermark on each page:
     - "Exported by [User Name]"
     - Date and time
     - "Madares Business - Confidential"
     - Source: Madares Contract Management
4. PDF ready for download
5. System records export in audit log:
   - User who exported
   - Timestamp
   - Filters applied
   - Number of records exported

**PDF Content:**
- Cover page with:
  - Title: "Contract Export Report"
  - Export date/time
  - Exported by
  - Filter criteria applied
  - Total records
- Table of contracts with columns:
  - Contract ID
  - Asset Code
  - Investor Name
  - Signing Date
  - End Date
  - Status
  - Payment Status
  - Total Amount
- Page numbers
- Watermark on every page

**Watermark Specifications:**
- Position: Diagonal across page (semi-transparent)
- Content: "Exported by [Name] on [Date/Time] - Madares Business"
- Font size: Large, semi-transparent
- Color: Light gray (not obtrusive)
- Cannot be removed

**Export Limits:**
- Max 5000 records per export
- If exceeded, show message:
  - "Too many records. Please apply filters to reduce results."
  - Suggest using filters
- File size warning if >10MB

**Error Handling:**
- Export service fails → Show error, offer retry
- Network error → Allow retry
- Too many records → Show limit message

**Security:**
- Exports logged in audit trail
- Watermark prevents misuse
- User must have export permission
- Exports are not stored server-side (generated on-demand)

#### UC-009: Configure Dynamic Dashboard

**Dashboard Widgets (Configurable):**
1. **Contracts Overview:**
   - Total Active Contracts
   - Total Contract Value (SAR)
   - Contracts Expiring (within 90 days)
   - Incomplete Contracts
   - Cancelled Contracts

2. **Payment Status:**
   - Installments Due Today
   - Overdue Installments (count + total amount)
   - Paid This Month
   - Pending Installments

3. **Recent Activity:**
   - Recently Added Contracts (last 7 days)
   - Recently Updated Contracts
   - Recent Payments Received
   - Recent Cancellations

4. **Charts & Visualizations:**
   - Contracts by Status (pie chart)
   - Payment Status Distribution (bar chart)
   - Contract Value by Investor (bar chart)
   - Contracts Timeline (line chart by month)
   - Expiring Contracts (calendar view)
   - Revenue Trend (monthly installments received)

5. **Alerts & Notifications:**
   - Overdue Payments Count
   - Contracts Expiring This Month
   - Incomplete Drafts Pending Action
   - System Alerts

**Dashboard Configuration:**
- User can:
  - Add/remove widgets
  - Rearrange widget positions (drag-and-drop)
  - Resize widgets
  - Set refresh intervals
  - Filter widget data (date ranges, etc.)
  - Save dashboard layout
  - Reset to default
- Configurations saved per user
- Role-based default dashboards

**Widget Interactions:**
- Click on widget data to drill down
  - E.g., Click "Overdue: 15" → View list of overdue contracts
- Widgets link to relevant list views
- Real-time or periodic refresh
- Last updated timestamp shown

**Mobile Dashboard:**
- Simplified view
- Most critical widgets only
- Stacked layout
- Swipeable cards

### 4. User Roles & Permissions

#### TBC User
**Permissions:**
- Create contracts
- Edit contracts (own or assigned)
- Upload PDFs and receipts
- Manage installment plans
- Update installment statuses
- Archive contracts
- Cancel contracts (with justification)
- View all contracts
- Export contracts
- Bulk upload contracts
- Configure personal dashboard
- View reports

**Restrictions:**
- Cannot delete contracts permanently
- Cannot edit other users' drafts (unless assigned)
- Cannot modify system-generated Contract IDs
- Cannot edit archived contracts
- Cannot view detailed audit logs (only own actions)

#### Platform Admin
**Permissions:**
- Full system access
- View all contracts (including drafts)
- View all audit logs
- Manage users and permissions
- Configure system settings
- Define validation rules
- Manage Excel template
- Override certain restrictions (with logging)
- Generate all reports
- Export all data
- System maintenance

**Special Powers:**
- Can edit archived contracts (with justification)
- Can unarchive contracts
- Can view all user activity
- Can generate compliance reports
- Can configure dashboard defaults

#### Read-Only User (Future)
**Permissions:**
- View contracts (filtered view)
- View installment status
- Download contract PDFs
- View reports (limited)
- Export (limited)

**Restrictions:**
- Cannot create or edit
- Cannot upload documents
- Cannot change statuses
- Cannot archive or cancel

### 5. Business Rules & Validations

#### Contract Creation Rules:
1. Contract ID must be unique (system-generated ensures this)
2. One active contract per asset at any time
3. Asset must exist in Asset Bank
4. Investor must exist in system
5. Land Code format: 3 letters + dash + numbers (XXX-###)
6. Contract duration must be positive integer
7. Start date < End date
8. End date must be (Start date + Duration years) within tolerance
9. Annual amount must be positive
10. VAT rate must be 0%, 5%, or 15%
11. Total contract amount auto-calculated
12. Signed PDF mandatory for Active status
13. Installment plan mandatory for Active status
14. Multilingual fields (Arabic + English) required

#### Installment Plan Rules:
1. Equal plan: System generates equal amounts + dates
2. Custom plan: User defines amounts + dates
3. Sum of all installments must equal Total Contract Amount
4. Installments must have unique due dates
5. All due dates must be within contract period
6. Cannot have more than 365 installments (daily max)
7. Can switch between Equal ↔ Custom (with warning)
8. Switching plan clears existing statuses

#### Payment Status Rules:
1. Cannot mark Paid without receipt upload
2. Receipt file types: PDF, JPG, PNG only
3. Receipt max size: 5MB
4. Partial payments require amount specification
5. Partial amount cannot exceed installment amount
6. Overdue flag auto-set when due date < today AND status = Pending
7. Cannot edit past year installments (read-only)
8. Payment date must be <= today
9. Payment date must be >= installment due date (warning if earlier)

#### Archive/Cancel Rules:
1. Can only archive Expired or fully paid contracts
2. Can only cancel Active or Expiring contracts
3. Cancellation requires mandatory reason + justification
4. Archived contracts read-only
5. Cancelled contracts read-only
6. Archived contracts can be unarchived (Admin only)
7. Cancelled contracts cannot be reactivated
8. Asset status handling defined per cancellation reason

#### Asset Relationship Rules:
1. One active contract per asset (strict)
2. Asset must be "Available" or "Investable" for new contract
3. When contract Active → Asset status updates (optional)
4. When contract Cancelled → Asset status depends on reason
5. When contract Archived → Asset available for new contract
6. Cannot change asset if installments paid

#### Validation Messages:
- "Contract ID already exists" (shouldn't occur)
- "Asset already has an active contract"
- "Invalid Land Code format (expected XXX-###)"
- "End date must be after start date"
- "VAT rate must be 0%, 5%, or 15%"
- "Installment plan totals do not match contract amount"
- "PDF upload is required to activate contract"
- "Receipt is required to mark installment as Paid"
- "Partial amount cannot exceed installment amount"
- "Cannot edit past year installments"
- "Cancellation reason is mandatory"

### 6. UI/UX Specifications

#### Contracts List Page

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Contracts (127)                       [+ Add] [Upload] [Export] │
├─────────────────────────────────────────────────────────────┤
│ [Search: "Search for contracts"________________] [Filters ▼] │
├─────────────────────────────────────────────────────────────┤
│ [All (127)] [Active (85)] [Incomplete (12)] [Expiring (15)] │
│ [Cancelled (8)] [Archived (7)]                               │
├─────────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────────┐   │
│ │ Drafts (5) ▼                                          │   │
│ └───────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│ Table:                                                       │
│ [☐] Contract ID | Payment | Due Date | Asset | Investor ... │
│ [☐] CNT-2025-001 | Overdue | 15/01/25 | RYD-001 | ABC ...   │
│ [☐] CNT-2025-002 | Paid    | 20/01/25 | JED-045 | XYZ ...   │
│ ...                                                          │
├─────────────────────────────────────────────────────────────┤
│ [10 per page ▼]  [< Prev] Page 1 of 13 [Next >]            │
└─────────────────────────────────────────────────────────────┘
```

**Key UI Elements:**
- Header with total count
- Action buttons (role-based visibility)
- Search bar (full-width)
- Filters button (opens side panel or modal)
- Quick status tabs with counts
- Drafts collapsible panel
- Data table with checkboxes
- Sortable column headers
- Badge indicators for status
- Kebab menu for actions
- Pagination controls

**Color Coding:**
- Overdue: Red (#DC2626)
- Expiring: Orange (#F59E0B)
- Active: Green (#10B981)
- Paid: Green (#10B981)
- Pending: Yellow (#FCD34D)
- Cancelled: Red (#DC2626)
- Archived: Gray (#6B7280)
- Incomplete: Blue (#3B82F6)

#### Contract Details Page

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ ← Back to Contracts                                 [Edit] [⋮] │
├─────────────────────────────────────────────────────────────┤
│ Contract: CNT-2025-001                      Status: Active   │
│ Asset: RYD-001 - King Fahd District                         │
│ Investor: ABC Investment Company                            │
├─────────────────────────────────────────────────────────────┤
│ [Overview] [Installments] [Documents] [History]             │
├─────────────────────────────────────────────────────────────┤
│ Overview Tab:                                               │
│ ┌─────────────────────┬─────────────────────┐              │
│ │ Contract Details    │ Financial Summary   │              │
│ │ - Land Code         │ - Annual Amount     │              │
│ │ - Duration          │ - VAT Rate          │              │
│ │ - Start Date        │ - Total Amount      │              │
│ │ - End Date          │ - Next Payment Due  │              │
│ └─────────────────────┴─────────────────────┘              │
│ ┌─────────────────────────────────────────────┐            │
│ │ Asset Information                            │            │
│ │ - Asset Name (AR/EN)                        │            │
│ │ - Location                                  │            │
│ │ - Area                                      │            │
│ └─────────────────────────────────────────────┘            │
│ ┌─────────────────────────────────────────────┐            │
│ │ Investor Information                         │            │
│ │ - Investor Name (AR/EN)                     │            │
│ │ - Contact Details                           │            │
│ └─────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

**Installments Tab:**
```
┌─────────────────────────────────────────────────────────────┐
│ Installments                          [Year: 2025 ▼] [Switch Plan] │
├─────────────────────────────────────────────────────────────┤
│ Plan Type: Equal Installments (12 monthly)                  │
│ Total: 120,000 SAR | Paid: 60,000 SAR | Pending: 60,000 SAR │
├─────────────────────────────────────────────────────────────┤
│ Table:                                                       │
│ # | Amount | Due Date | Status | Payment Date | Receipt | Actions │
│ 1 | 10,000 | 15/01/25 | Paid   | 14/01/25    | [📄 View] | [Edit] │
│ 2 | 10,000 | 15/02/25 | Overdue| -           | -        | [Pay]  │
│ ...                                                          │
└─────────────────────────────────────────────────────────────┘
```

**Documents Tab:**
```
┌─────────────────────────────────────────────────────────────┐
│ Documents                                   [+ Upload Document] │
├─────────────────────────────────────────────────────────────┤
│ Signed Contract                                              │
│ ├─ contract_signed.pdf (2.3 MB) - Uploaded 15/01/2025       │
│ │  [View] [Download]                                         │
│ Payment Receipts                                            │
│ ├─ receipt_001.pdf (456 KB) - Installment #1                │
│ ├─ receipt_002.jpg (234 KB) - Installment #2                │
│ │  [View] [Download]                                         │
└─────────────────────────────────────────────────────────────┘
```

**History/Audit Tab:**
```
┌─────────────────────────────────────────────────────────────┐
│ History                                                      │
├─────────────────────────────────────────────────────────────┤
│ Timeline:                                                    │
│ ● 15/01/2025 10:30 - Contract created by Ahmed Al-Salem     │
│ ● 16/01/2025 14:20 - PDF uploaded by Ahmed Al-Salem         │
│ ● 16/01/2025 14:25 - Installment plan defined (12 monthly)  │
│ ● 16/01/2025 14:30 - Contract activated                     │
│ ● 14/02/2025 09:15 - Installment #1 marked as Paid by Sara  │
│ ...                                                          │
└─────────────────────────────────────────────────────────────┘
```

#### Add/Edit Contract Form

**Multi-Step Form:**

**Step 1: Basic Information**
- Asset Selection (searchable dropdown)
- Investor Selection (searchable dropdown)
- Land Code (text input with validation)
- Contract Duration (number input, years)
- Start Date (date picker)
- End Date (date picker, auto-calculated)

**Step 2: Financial Details**
- Annual Rental Amount (currency input)
- VAT Rate (radio buttons: 0% / 5% / 15%)
- Total Annual Amount (read-only, calculated)
- Total Contract Amount (read-only, calculated)

**Step 3: Multilingual Information**
- Asset Name (Arabic) - text input
- Asset Name (English) - text input
- Investor Name (Arabic) - text input
- Investor Name (English) - text input

**Step 4: Documents**
- Upload Signed Contract PDF (drag-drop or file picker)
- File preview
- File validation messages

**Step 5: Installment Plan**
- Plan Type Selection: [Equal] [Custom]
- If Equal:
  - Number of Installments (input)
  - Frequency (dropdown: Monthly, Quarterly, Semi-Annual, Annual)
  - Preview table of generated installments
- If Custom:
  - [+ Add Installment] button
  - Table rows: Amount, Due Date, Description
  - Total validation (must equal contract amount)

**Step 6: Review & Confirm**
- Summary of all entered data
- Edit buttons for each section (go back to step)
- Terms & Conditions checkbox
- [Save as Draft] [Activate Contract] buttons

**Form Behavior:**
- Inline validation on blur
- Error messages below fields
- Progress indicator (Step X of 6)
- Can save as draft at any step
- Auto-save draft every 60 seconds
- Warning if trying to leave with unsaved changes

#### Dashboard Page

**Layout (Grid-based):**
```
┌─────────────────────────────────────────────────────────────┐
│ Dashboard                              [Configure] [Refresh] │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│ │ Active   │ │ Expiring │ │ Overdue  │ │ Total    │        │
│ │   85     │ │    15    │ │    12    │ │ 45.2M SAR│        │
│ │ Contracts│ │ (90 days)│ │ Payments │ │ Value    │        │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────┬─────────────────────┐              │
│ │ Payment Status      │ Contracts by Status │              │
│ │ [Bar Chart]         │ [Pie Chart]         │              │
│ │                     │                     │              │
│ └─────────────────────┴─────────────────────┘              │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────┬─────────────────────┐              │
│ │ Recent Activity     │ Alerts              │              │
│ │ - CNT-2025-045      │ ⚠ 12 Overdue       │              │
│ │   Created today     │ ⚠ 15 Expiring      │              │
│ │ - CNT-2025-044      │ ℹ  5 Incomplete    │              │
│ │   Payment received  │                     │              │
│ └─────────────────────┴─────────────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

**Widget Types:**
- KPI Cards (numeric with icon)
- Charts (bar, pie, line)
- Lists (recent activity)
- Alerts (with counts and icons)
- Calendars (expiring contracts)
- Tables (top contracts, etc.)

**Responsive Behavior:**
- Desktop: Grid layout (4 columns)
- Tablet: 2 columns
- Mobile: 1 column, stacked

### 7. Database Schema

**Contracts Table:**
```sql
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id VARCHAR(50) UNIQUE NOT NULL, -- Auto-generated: CNT-YYYY-###
  land_code VARCHAR(20) NOT NULL, -- Format: XXX-###
  
  -- Asset & Investor
  asset_id UUID REFERENCES assets(id) NOT NULL,
  investor_id UUID REFERENCES investors(id) NOT NULL,
  
  -- Multilingual Fields
  asset_name_ar VARCHAR(255) NOT NULL,
  asset_name_en VARCHAR(255) NOT NULL,
  investor_name_ar VARCHAR(255) NOT NULL,
  investor_name_en VARCHAR(255) NOT NULL,
  
  -- Financial
  annual_rental_amount DECIMAL(15, 2) NOT NULL, -- Base amount
  vat_rate DECIMAL(5, 2) NOT NULL, -- 0.00, 5.00, or 15.00
  total_annual_amount DECIMAL(15, 2) NOT NULL, -- Calculated: base + VAT
  contract_duration INTEGER NOT NULL, -- Years
  total_contract_amount DECIMAL(15, 2) NOT NULL, -- Calculated total
  currency VARCHAR(3) DEFAULT 'SAR',
  
  -- Dates
  signing_date DATE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'Draft',
  -- Draft, Incomplete, Active, Expiring, Expired, Archived, Cancelled
  
  -- Installment Plan
  installment_plan_type VARCHAR(20), -- Equal, Custom
  installment_count INTEGER,
  installment_frequency VARCHAR(20), -- Monthly, Quarterly, etc.
  
  -- Documents
  signed_pdf_url TEXT, -- S3 URL
  signed_pdf_uploaded_at TIMESTAMP,
  
  -- Cancellation
  cancelled_at TIMESTAMP,
  cancelled_by UUID REFERENCES users(id),
  cancellation_reason VARCHAR(100),
  cancellation_justification TEXT,
  cancellation_documents JSONB, -- Array of file URLs
  
  -- Metadata
  created_by UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW(),
  archived_at TIMESTAMP,
  archived_by UUID REFERENCES users(id),
  
  -- Additional fields (20-30 total)
  notes TEXT,
  special_conditions TEXT,
  legal_terms_reference TEXT,
  approval_authority VARCHAR(100),
  
  -- Constraints
  CONSTRAINT check_vat_rate CHECK (vat_rate IN (0.00, 5.00, 15.00)),
  CONSTRAINT check_dates CHECK (end_date > start_date),
  CONSTRAINT check_positive_amounts CHECK (
    annual_rental_amount > 0 AND 
    total_contract_amount > 0
  ),
  CONSTRAINT check_duration CHECK (contract_duration > 0),
  CONSTRAINT unique_active_asset UNIQUE (asset_id) 
    WHERE status IN ('Active', 'Expiring')
);

CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_asset ON contracts(asset_id);
CREATE INDEX idx_contracts_investor ON contracts(investor_id);
CREATE INDEX idx_contracts_end_date ON contracts(end_date);
CREATE INDEX idx_contracts_land_code ON contracts(land_code);
```

**Installments Table:**
```sql
CREATE TABLE installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE NOT NULL,
  
  installment_number INTEGER NOT NULL, -- 1, 2, 3...
  amount_due DECIMAL(15, 2) NOT NULL,
  due_date DATE NOT NULL,
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'Pending',
  -- Pending, Overdue, Partial, Paid
  
  -- Payment tracking
  payment_date DATE,
  partial_amount_paid DECIMAL(15, 2),
  remaining_balance DECIMAL(15, 2),
  
  -- Receipt
  receipt_file_url TEXT,
  receipt_file_name VARCHAR(255),
  receipt_uploaded_at TIMESTAMP,
  receipt_uploaded_by UUID REFERENCES users(id),
  
  -- Notes
  notes TEXT,
  description VARCHAR(255),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES users(id),
  
  -- Constraints
  CONSTRAINT check_positive_amount CHECK (amount_due > 0),
  CONSTRAINT check_partial_amount CHECK (
    partial_amount_paid IS NULL OR 
    (partial_amount_paid > 0 AND partial_amount_paid <= amount_due)
  ),
  CONSTRAINT unique_contract_installment UNIQUE (contract_id, installment_number),
  CONSTRAINT unique_contract_due_date UNIQUE (contract_id, due_date)
);

CREATE INDEX idx_installments_contract ON installments(contract_id);
CREATE INDEX idx_installments_due_date ON installments(due_date);
CREATE INDEX idx_installments_status ON installments(status);
CREATE INDEX idx_installments_overdue ON installments(due_date, status) 
  WHERE status = 'Pending';
```

**Investors Table:**
```sql
CREATE TABLE investors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id VARCHAR(50) UNIQUE NOT NULL,
  
  name_ar VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  
  company_registration VARCHAR(100),
  tax_id VARCHAR(50),
  
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Saudi Arabia',
  
  status VARCHAR(20) DEFAULT 'Active', -- Active, Inactive, Blacklisted
  
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_investors_status ON investors(status);
CREATE INDEX idx_investors_name ON investors(name_en, name_ar);
```

**Contract Versions Table (Audit Trail):**
```sql
CREATE TABLE contract_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE NOT NULL,
  
  version_number INTEGER NOT NULL,
  
  -- Snapshot of contract data at this version
  contract_data JSONB NOT NULL, -- Full contract record
  
  -- Change metadata
  changed_by UUID REFERENCES users(id) NOT NULL,
  changed_at TIMESTAMP DEFAULT NOW(),
  change_description TEXT,
  changes_made JSONB, -- Diff of what changed
  
  CONSTRAINT unique_contract_version UNIQUE (contract_id, version_number)
);

CREATE INDEX idx_contract_versions_contract ON contract_versions(contract_id);
CREATE INDEX idx_contract_versions_date ON contract_versions(changed_at);
```

**Audit Logs Table:**
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who
  user_id UUID REFERENCES users(id),
  user_email VARCHAR(255),
  user_role VARCHAR(100),
  
  -- What
  action VARCHAR(100) NOT NULL,
  -- contract_created, contract_updated, installment_paid, contract_archived, etc.
  
  entity_type VARCHAR(50) NOT NULL, -- Contract, Installment, etc.
  entity_id UUID,
  
  -- Details
  details JSONB, -- Action-specific details
  changes JSONB, -- Before/after for updates
  
  -- When/Where
  created_at TIMESTAMP DEFAULT NOW(),
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  -- Result
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_date ON audit_logs(created_at);
```

**Bulk Upload Logs Table:**
```sql
CREATE TABLE bulk_upload_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  uploaded_by UUID REFERENCES users(id) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER,
  
  total_rows INTEGER NOT NULL,
  successful_rows INTEGER NOT NULL,
  failed_rows INTEGER NOT NULL,
  
  error_report_url TEXT, -- S3 URL to error Excel file
  
  status VARCHAR(20) NOT NULL, -- Processing, Completed, Failed
  
  processing_started_at TIMESTAMP,
  processing_completed_at TIMESTAMP,
  processing_duration_seconds INTEGER
);

CREATE INDEX idx_bulk_uploads_user ON bulk_upload_logs(uploaded_by);
CREATE INDEX idx_bulk_uploads_date ON bulk_upload_logs(uploaded_at);
```

### 8. API Endpoints

**Contracts:**
- `GET /api/contracts` - List contracts (with filters, search, pagination)
- `POST /api/contracts` - Create new contract
- `GET /api/contracts/:id` - Get contract details
- `PUT /api/contracts/:id` - Update contract
- `DELETE /api/contracts/:id` - Soft delete (set to cancelled)
- `POST /api/contracts/:id/activate` - Activate from draft
- `POST /api/contracts/:id/archive` - Archive contract
- `POST /api/contracts/:id/cancel` - Cancel contract
- `POST /api/contracts/:id/unarchive` - Unarchive (admin only)
- `GET /api/contracts/:id/versions` - Get version history
- `GET /api/contracts/:id/audit-trail` - Get full audit log

**Installments:**
- `GET /api/contracts/:contractId/installments` - List installments (with year filter)
- `POST /api/contracts/:contractId/installments` - Create installment plan
- `PUT /api/contracts/:contractId/installments/plan` - Update plan type
- `GET /api/installments/:id` - Get installment details
- `PUT /api/installments/:id/status` - Update payment status
- `POST /api/installments/:id/receipt` - Upload receipt
- `GET /api/installments/:id/receipt` - Download receipt
- `DELETE /api/installments/:id` - Delete installment (custom plan only)

**Bulk Operations:**
- `GET /api/contracts/bulk-upload/template` - Download Excel template
- `POST /api/contracts/bulk-upload` - Upload Excel file
- `GET /api/contracts/bulk-upload/:uploadId/status` - Check upload status
- `GET /api/contracts/bulk-upload/:uploadId/errors` - Download error report

**Export:**
- `POST /api/contracts/export` - Export contracts to PDF (with filters)
- `GET /api/contracts/export/:exportId` - Download generated export

**Dashboard:**
- `GET /api/dashboard/widgets` - Get dashboard widget data
- `GET /api/dashboard/config` - Get user dashboard configuration
- `PUT /api/dashboard/config` - Update dashboard configuration
- `GET /api/dashboard/stats` - Get overview statistics

**Search & Filters:**
- `GET /api/contracts/search` - Full-text search
- `GET /api/contracts/filters/options` - Get available filter options
- `GET /api/contracts/quick-stats` - Get tab counts for quick filters

**Investors:**
- `GET /api/investors` - List investors
- `POST /api/investors` - Create investor
- `GET /api/investors/:id` - Get investor details
- `PUT /api/investors/:id` - Update investor

**Reference Data:**
- `GET /api/reference/vat-rates` - Get VAT rate options
- `GET /api/reference/contract-statuses` - Get status options
- `GET /api/reference/installment-frequencies` - Get frequency options
- `GET /api/reference/cancellation-reasons` - Get cancellation reason options

**Reports:**
- `GET /api/reports/contracts-summary` - Contract summary report
- `GET /api/reports/payment-status` - Payment status report
- `GET /api/reports/expiring-contracts` - Expiring contracts report
- `GET /api/reports/overdue-payments` - Overdue payments report
- `GET /api/reports/revenue-trend` - Revenue trend report

**Audit:**
- `GET /api/audit/logs` - Get audit logs (with filters)
- `GET /api/audit/user/:userId` - User-specific audit logs
- `GET /api/audit/contract/:contractId` - Contract-specific audit logs

### 9. Integration Points

**Asset Bank Integration:**
- Link contracts to assets via Asset ID
- Check asset availability before creating contract
- Update asset status when contract activated/cancelled
- Validate one active contract per asset rule

**User Management Integration:**
- Shared authentication system
- Role-based permissions
- User information for created_by, updated_by fields

**File Storage (AWS S3):**
- Contract PDFs
- Receipt files
- Export files
- Bulk upload templates
- Error reports
- Versioned storage

**Email Service (Optional Future):**
- Contract activation notification
- Payment due reminders
- Overdue payment alerts
- Contract expiring notifications
- Bulk upload completion notification

**Reporting Engine:**
- Dashboard widget data
- Scheduled reports
- Export generation
- Analytics

### 10. Testing Strategy

**Unit Tests:**
- Contract creation logic
- Installment calculation (equal/custom)
- Payment status logic
- VAT calculation
- Date validation
- Status transition rules

**Integration Tests:**
- API endpoint testing
- Database operations
- File upload/download
- Bulk upload process
- Export generation
- Search and filtering

**E2E Tests:**
- Complete contract creation flow
- Installment payment workflow
- Bulk upload process
- Contract archiving/cancellation
- Dashboard interaction

**Performance Tests:**
- List view with 10,000+ contracts
- Bulk upload with 1000 rows
- Export generation for large datasets
- Search performance
- Dashboard loading time

### 11. Security Requirements

**Authentication & Authorization:**
- JWT-based authentication
- Role-based access control
- Permission checks on all operations
- Session management

**Data Protection:**
- Encrypt sensitive fields (financial data)
- Secure file storage (signed URLs)
- Audit logging for all actions
- Soft delete (no permanent deletion)

**File Upload Security:**
- File type validation (PDF, JPG, PNG only)
- File size limits (10MB contracts, 5MB receipts)
- Virus scanning (ClamAV)
- Secure storage (S3 private buckets)
- Watermarking on exports

**API Security:**
- Rate limiting (100 req/min per user)
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF token validation

### 12. Success Metrics

**Efficiency:**
- Contract creation time: < 5 minutes
- Bulk upload processing: < 2 minutes for 1000 rows
- Export generation: < 30 seconds
- Search response time: < 1 second

**Data Quality:**
- Zero duplicate Contract IDs
- 100% asset validation accuracy
- Installment total validation: 100% accuracy

**User Adoption:**
- Contracts digitized: Target 100% within 3 months
- Active users: All TBC users
- Bulk upload usage: 30%+ of new contracts

**System Performance:**
- API response time: < 500ms
- Page load time: < 2 seconds
- System uptime: > 99.5%
- Error rate: < 0.1%

## Getting Started with Replit

**Setup Steps:**

1. **Create Replit Project:**
   - Template: Node.js or Full Stack

2. **Install Dependencies:**
```bash
# Backend
npm install express pg cors jsonwebtoken bcrypt dotenv
npm install multer aws-sdk
npm install exceljs pdfkit puppeteer
npm install winston

# Frontend
cd client
npm install react react-dom typescript
npm install @mui/material @emotion/react @emotion/styled
npm install axios react-router-dom redux @reduxjs/toolkit
npm install recharts date-fns
```

3. **Database Setup:**
   - Add PostgreSQL addon
   - Run schema migrations
   - Seed initial data (VAT rates, statuses, etc.)

4. **Environment Variables:**
```
DATABASE_URL=<from replit>
JWT_SECRET=<generate>
AWS_ACCESS_KEY=<for S3>
AWS_SECRET_KEY=<for S3>
AWS_S3_BUCKET=<bucket name>
NODE_ENV=development
```

5. **Run Application:**
```bash
npm run dev
```

## Questions to Clarify

1. **Asset Integration:** Exact API for Asset Bank integration?
2. **Investor Management:** Existing investor database or create new?
3. **Notifications:** Email service preferred (SendGrid, AWS SES)?
4. **Reports:** Specific KPIs for executive dashboard?
5. **Bulk Upload:** Max file size and row limits?
6. **Archiving:** Auto-archive expired contracts or manual only?
7. **Multi-Currency:** Support beyond SAR?
8. **Payment Gateway:** Future integration planned?
9. **Mobile App:** Dedicated mobile app or responsive web only?
10. **Backup:** Daily automated backups sufficient?

---

**Version:** 4.0  
**Last Updated:** Based on BRD dated 28.08.2025 (updated 3.10)  
**Status:** Ready for development - Contract Management & Archiving

**Next Steps:**
1. Review and approve specifications
2. Design database schema
3. Create wireframes/mockups
4. Set up development environment
5. Begin sprint planning
