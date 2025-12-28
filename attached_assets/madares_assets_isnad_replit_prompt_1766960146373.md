# Madares Business Platform - Assets Bank & ISNAD Workflow Automation

## Project Overview
Build a comprehensive digital system to replace manual Excel/Word-based asset management and ISNAD approval workflows for Ministry of Education (MOE) lands and buildings. The system automates the multi-step approval process for determining if properties can be used for investment.

## Tech Stack Requirements
- **Frontend**: React.js with TypeScript
- **Backend**: Node.js with Express
- **Database**: PostgreSQL (for relational data + asset records)
- **File Storage**: AWS S3 or similar (for documents/attachments)
- **Workflow Engine**: Custom or BPM.js for approval routing
- **Notifications**: Email + In-app notifications
- **UI Framework**: Material-UI or Ant Design
- **State Management**: Redux or Context API
- **Real-time Updates**: WebSocket or Server-Sent Events

## Core Features

### 1. Assets Bank - Digital Repository

The Assets Bank is a centralized digital database replacing Excel spreadsheets for tracking all MOE lands and buildings.

#### Asset Data Structure
**Core Fields:**
- Asset ID (unique identifier, auto-generated)
- Asset Name
- Asset Type (Land / Building)
- Location (City, District, Coordinates)
- Area (in square meters)
- Current Status
- Ownership Documents
- Valuation Information
- Restrictions/Conditions
- Historical Usage
- Investment Potential Score
- Financial Dues Status
- Custody Items Status

**Status Values:**
- `Available` - Ready for ISNAD process
- `In Review` - ISNAD form in progress
- `Approved for Investment` - Passed all approvals
- `Rejected` - Not suitable for investment
- `On Hold` - Temporarily unavailable
- `Allocated` - Already assigned to project

#### Asset Management Features
1. **Add New Asset:**
   - Form-based data entry
   - Document upload (ownership papers, plans, photos)
   - Duplicate detection (location, name)
   - Validation against existing records
   - Auto-assignment of unique Asset ID

2. **Edit Asset:**
   - Version control for changes
   - Audit trail of modifications
   - Permission-based editing (only authorized roles)
   - Lock mechanism during ISNAD process

3. **Search & Filter:**
   - Full-text search across all fields
   - Advanced filters:
     - Asset type
     - Location (city, district)
     - Status
     - Area range
     - Date added
     - Investment potential
   - Saved search queries
   - Export results to Excel/CSV

4. **Asset Details View:**
   - Complete asset profile
   - Document viewer/downloader
   - Related ISNAD forms history
   - Timeline of status changes
   - Map integration (show location)
   - Financial information
   - Stakeholder notes/comments

5. **Bulk Operations:**
   - Import assets from Excel
   - Bulk status updates
   - Mass document upload
   - Export selected assets

### 2. ISNAD Workflow System

ISNAD (Investment Suitability & Needs Assessment Document) is the multi-step approval process to determine if an asset can be used for investment.

#### Workflow Stages & Roles

**Stage 1: Initiation (Investment & Partnerships Department)**
- **Role**: Investment & Partnerships (I&P)
- **Actions**: Start ISNAD form, fill initial criteria
- **Options**: Submit for Review, Save as Draft

**Stage 2: Department Reviews (Parallel/Sequential)**
1. **School Planning Department**
   - Review if land needed for future school projects
   - Approve / Reject / Return for Modification
   
2. **Asset Management Department**
   - Review asset suitability and conditions
   - Approve / Reject / Return for Modification
   
3. **Shared Services Department**
   - Review financial dues and custody items
   - Limited scope: Only financial/custody review
   - Approve / Reject / Return for Modification

4. **Education Departments (Regional)**
   - Review regional education needs
   - Approve / Reject / Return for Modification

**Stage 3: Investment Agency Approval**
- **Role**: Investment Agency
- **Actions**: 
  - Final technical review
  - Approve / Reject / Return for Modification
- **Significance**: Must pass before CEO package

**Stage 4: Package Creation (TBC User)**
- **Role**: TBC User
- **Actions**:
  - Select approved assets
  - Create ISNAD Package
  - Submit to CEO

**Stage 5: Executive Approvals (Sequential)**
1. **CEO of TBC**
   - Review package
   - Approve / Reject (no return option)
   
2. **Associate Minister of MOE**
   - Final approval authority
   - Approve / Reject (no return option)

#### ISNAD Form Structure

**Section 1: Asset Information**
- Asset ID (auto-populated from Asset Bank)
- Asset name, type, location
- Current status and restrictions
- Reference to asset details

**Section 2: Investment Criteria**
- Investment purpose/goals
- Expected revenue potential
- Project timeline
- Required modifications/improvements
- Compliance requirements
- Risk assessment

**Section 3: Technical Assessment**
- Structural condition (for buildings)
- Utilities availability
- Access and infrastructure
- Environmental considerations
- Legal/zoning compliance

**Section 4: Financial Analysis**
- Current valuation
- Outstanding financial dues
- Maintenance costs
- Expected investment returns
- Break-even analysis

**Section 5: Stakeholder Input**
- Comments from each department
- Conditions/requirements
- Risk factors identified
- Recommendations

**Section 6: Approvals Tracker**
- Approval history
- Current stage
- Pending approvers
- Timeline tracking
- SLA status

### 3. Workflow Actions & Business Rules

#### Core Actions Available

**1. Submit (from Draft)**
- Moves form to next approval stage
- Triggers notifications to next approver
- Locks previous sections from editing
- Updates status and timestamps

**2. Approve**
- Available to: All department reviewers, Investment Agency, CEO, Minister
- Effect: Moves to next stage in workflow
- Required: Optional comments
- Triggers: Notification to next approver or requestor

**3. Reject**
- Available to: All approvers at any stage
- Effect: Stops workflow, marks form as Rejected
- Required: Mandatory justification
- Options:
  - Reject - Asset unsuitable
  - Reject - Duplicate
  - Reject - Insufficient information
- Effect on Asset: Status remains unchanged in Asset Bank
- Notification: Sent to I&P and all previous approvers

**4. Return for Modification**
- Available to: All department reviewers, Investment Agency
- Effect: Sends back to I&P for corrections
- Required: Mandatory explanation of needed changes
- I&P can:
  - Edit and resubmit
  - Cancel form
- Returned forms restart from I&P submission

**5. Save as Draft**
- Available to: I&P (form creator)
- Effect: Saves work without submitting
- No notifications sent
- Can edit unlimited times before submission

**6. Cancel Form**
- Available to: I&P, Investment Agency, Platform Admin
- Effect: Stops workflow permanently
- Required: Mandatory cancellation reason
- Form status: Cancelled (visible for audit)
- Asset status: Returns to Available
- Cannot be reactivated (must create new form)

**7. Request Additional Information**
- Available to: Any approver
- Effect: Pauses workflow, requests clarification
- I&P receives notification
- I&P provides information via comments
- Approver resumes review

#### Business Rules

**Asset Bank Rules:**
1. Each asset must have unique Asset ID
2. Assets cannot be deleted, only archived
3. Assets in active ISNAD process cannot be edited
4. Duplicate detection based on: Name + Location + Type
5. Rejection in ISNAD does not remove asset from bank
6. Asset status auto-updates based on ISNAD stage
7. Historical data preserved for all status changes

**ISNAD Workflow Rules:**
1. Only I&P can initiate ISNAD forms
2. One active ISNAD form per asset at a time
3. Forms must complete all department reviews before Investment Agency
4. Investment Agency approval required before packaging
5. CEO must approve before Associate Minister review
6. CEO and Minister can only Approve or Reject (no Return option)
7. Returns always go back to I&P (form initiator)
8. Approval sequence is enforced (cannot skip stages)
9. Cancelled forms cannot be resumed (start fresh)
10. Package can contain only "Approved by Investment Agency" assets

**SLA (Service Level Agreement) Rules:**
1. Each stage has defined response time:
   - Department Review: 5 business days
   - Investment Agency: 7 business days
   - CEO Approval: 3 business days
   - Minister Approval: 5 business days
2. SLA timer starts when form enters stage
3. Reminders sent at:
   - 50% of SLA elapsed (warning)
   - 80% of SLA elapsed (urgent)
   - 100% of SLA elapsed (overdue)
4. SLA breaches logged in audit trail
5. Returns reset SLA timer for that stage

**Permission Rules:**
1. Users can only see forms relevant to their role
2. Approvers see only forms in their queue
3. I&P sees all forms they initiated
4. Platform Admin sees all forms (read-only unless admin)
5. Comments visible to all stakeholders
6. Attachments visible based on role permissions

**Notification Rules:**
1. Email + in-app notification for:
   - Form submission (to next approver)
   - Approval (to requestor + next approver)
   - Rejection (to all stakeholders)
   - Return for modification (to I&P)
   - SLA reminders (to approver + their supervisor)
   - Cancellation (to all stakeholders)
2. Daily digest of pending approvals
3. Weekly summary for management

### 4. User Roles & Permissions

#### Investment & Partnerships (I&P)
**Permissions:**
- Create ISNAD forms
- Edit own draft forms
- Submit forms for approval
- View status of all forms they created
- Respond to Returns
- Cancel forms they created
- Add comments/attachments
- View Asset Bank (full access)

#### School Planning Reviewer
**Permissions:**
- View forms assigned for review
- Approve / Reject / Return
- Add comments
- Request additional information
- View Asset Bank (read-only)

#### Asset Management Reviewer
**Permissions:**
- View forms assigned for review
- Approve / Reject / Return
- Add comments
- Edit asset details during review
- View Asset Bank (full access)

#### Shared Services Reviewer
**Permissions:**
- View forms assigned for review
- Review only financial dues + custody sections
- Approve / Reject / Return (limited scope)
- Add comments on financial matters
- View Asset Bank (limited fields)

#### Education Department Reviewer (Regional)
**Permissions:**
- View forms for their region only
- Approve / Reject / Return
- Add comments on regional needs
- View Asset Bank (region-filtered)

#### Investment Agency Approver
**Permissions:**
- View all forms after department reviews
- Approve / Reject / Return
- Final technical assessment authority
- View all comments and history
- Access to complete Asset Bank
- Generate investment reports

#### TBC User (Package Creator)
**Permissions:**
- View approved assets
- Create ISNAD packages
- Select multiple assets for package
- Submit packages to CEO
- View package status
- View Asset Bank (approved assets only)

#### CEO of TBC
**Permissions:**
- View packages submitted
- Approve / Reject packages (only)
- Add executive comments
- View complete asset and form details
- Access executive dashboard

#### Associate Minister of MOE
**Permissions:**
- View packages from CEO
- Approve / Reject packages (only)
- Final approval authority
- Add ministerial comments
- View complete system data
- Access executive dashboard

#### Platform Admin
**Permissions:**
- Full system access
- View all forms and assets
- Manage users and roles
- Cancel any form (with justification)
- Access audit logs
- Generate system reports
- Configure SLA timers
- Manage workflow settings

### 5. Key Use Cases - Detailed Specifications

#### UC-001: Add Asset to Asset Bank

**Actors:** Asset Management, Platform Admin

**Flow:**
1. User navigates to Asset Bank → Add New Asset
2. System displays asset entry form with mandatory fields
3. User enters:
   - Asset name
   - Asset type (dropdown: Land / Building)
   - Location (city, district, GPS coordinates)
   - Area (numeric, square meters)
   - Ownership documents (file upload)
   - Current condition assessment
   - Any restrictions or liens
4. System validates:
   - All mandatory fields completed
   - No duplicate based on name + location + type
   - File uploads are valid formats (PDF, JPG, PNG)
5. User clicks "Save Asset"
6. System:
   - Generates unique Asset ID
   - Sets status = "Available"
   - Stores all data
   - Creates audit log entry
   - Displays success message
7. Asset appears in Asset Bank list

**Validations:**
- Duplicate check: If similar asset found, show warning with option to continue or cancel
- File size limit: 10MB per file, max 10 files
- Required fields highlighted if missing

**Error Handling:**
- If duplicate detected: "Similar asset exists. Asset ID: XXX. Do you want to continue?"
- If missing fields: Inline error messages below each field
- If upload fails: "File upload failed. Please try again."

#### UC-002: Track Status of Asset / ISNAD Form

**Actors:** All users (based on permissions)

**Flow:**
1. User navigates to Dashboard or Asset Bank
2. System displays:
   - My Assets (for I&P)
   - Pending Approvals (for reviewers)
   - All Forms (for Admin)
   - Package Status (for TBC, CEO, Minister)
3. User can filter/search by:
   - Asset ID
   - Asset name
   - Status
   - Date range
   - Assigned department
4. User clicks on an asset/form
5. System displays:
   - Current status
   - Timeline visualization
   - All approval history
   - Comments from each stage
   - SLA status (on-time, warning, overdue)
   - Next action required
   - Attached documents
6. User can:
   - View details
   - Download documents
   - Add comments
   - Take action (if in their queue)

**Status Indicators:**
- Green: Approved
- Yellow: Pending / In Review
- Red: Rejected / Overdue
- Gray: Draft / Cancelled
- Blue: Returned for Modification

#### UC-003: Start ISNAD Form

**Actors:** Investment & Partnerships (I&P)

**Pre-conditions:**
- Asset exists in Asset Bank with status = "Available"
- I&P has permission to create forms
- Asset not already in active ISNAD process

**Flow:**
1. I&P navigates to Asset Bank
2. Searches/filters for target asset
3. Clicks on asset → "Start ISNAD Form"
4. System validates:
   - Asset is Available
   - No active ISNAD form exists for this asset
5. System opens ISNAD form template with:
   - Section 1: Asset info (auto-populated)
   - Section 2: Investment criteria (editable)
   - Section 3: Technical assessment (editable)
   - Section 4: Financial analysis (editable)
6. I&P fills required sections
7. I&P can:
   - **Save as Draft**: Saves without submitting
   - **Submit for Review**: Starts approval workflow
8. If "Submit for Review":
   - System validates all required fields
   - Updates asset status = "In Review"
   - Routes form to first approver (School Planning)
   - Sends notification to School Planning reviewer
   - Starts SLA timer
   - Creates audit log entry
9. If "Save as Draft":
   - Saves current state
   - No notifications
   - Can edit later
   - Asset status remains "Available"

**Required Fields:**
- Investment purpose
- Expected timeline
- Budget estimate
- Risk assessment
- At least one attachment (investment proposal)

**Validation:**
- Cannot submit without all required fields
- Cannot start ISNAD if asset already in review
- Draft can be edited unlimited times

#### UC-004: Department Review (ISNAD Approval Step)

**Actors:** School Planning, Asset Management, Shared Services, Education Dept Reviewers

**Pre-conditions:**
- Form submitted by I&P or previous approver
- Form is in reviewer's queue
- Reviewer has appropriate role/permissions

**Flow:**
1. Reviewer receives notification (email + in-app)
2. Reviewer logs in, sees form in "My Queue"
3. SLA countdown visible (e.g., "3 days remaining")
4. Reviewer opens form
5. System displays:
   - Complete asset information
   - Investment criteria
   - Technical assessment
   - All previous comments
   - Approval history
   - Documents/attachments
6. Reviewer reads and evaluates
7. Reviewer can:
   - Add comments (optional for Approve, mandatory for Reject/Return)
   - Request additional information (pauses workflow)
   - Attach supporting documents
8. Reviewer selects action:

   **Option A: Approve**
   - Adds optional comments
   - Clicks "Approve"
   - System:
     - Records approval with timestamp
     - Stops SLA timer
     - Routes to next approver (if any)
     - Sends notifications
     - Updates workflow status

   **Option B: Reject**
   - Selects rejection reason:
     - Asset needed for government project
     - Location unsuitable
     - Legal/compliance issues
     - Insufficient documentation
     - Other (specify)
   - Adds mandatory justification
   - Clicks "Reject"
   - System:
     - Sets form status = "Rejected"
     - Stops workflow
     - Sends rejection notification to all stakeholders
     - Asset status returns to "Available"
     - Creates audit log

   **Option C: Return for Modification**
   - Lists required modifications/information
   - Adds mandatory explanation
   - Clicks "Return for Modification"
   - System:
     - Returns form to I&P
     - Sets status = "Returned"
     - Stops SLA timer
     - Sends notification to I&P
     - I&P can edit and resubmit

   **Option D: Request Additional Information**
   - Asks specific questions
   - Form stays in their queue (paused)
   - I&P receives notification
   - I&P responds via comments
   - Reviewer resumes review

**SLA Reminders:**
- Day 3 (50%): "You have 2 days remaining to review Form #XXX"
- Day 4 (80%): "⚠️ Urgent: 1 day remaining to review Form #XXX"
- Day 5 (100%): "🔴 OVERDUE: Form #XXX review is past due"
- Supervisor CC'd on overdue notifications

**Business Rules:**
- Cannot approve without reviewing all sections
- Cannot skip mandatory comment fields
- Cannot reassign to different reviewer (workflow-controlled)
- SLA timer pauses during "Request Additional Info"

#### UC-005: Final Approvals (CEO & Associate Minister)

**Actors:** CEO of TBC, Associate Minister of MOE

**Pre-conditions:**
- ISNAD package created by TBC User
- Package contains assets approved by Investment Agency
- Package submitted for executive approval

**Flow - CEO Approval:**
1. TBC User creates package with selected assets
2. System routes package to CEO
3. CEO receives notification
4. CEO logs in, views package in queue
5. CEO opens package, sees:
   - List of all assets in package
   - Summary information for each asset
   - Complete ISNAD forms for each
   - Investment Agency recommendations
   - Combined financial analysis
6. CEO reviews package
7. CEO can ONLY:
   - **Approve**: Moves package to Minister
   - **Reject**: Stops workflow, package rejected
8. CEO adds executive comments (optional for Approve, mandatory for Reject)
9. If Approve:
   - System routes package to Associate Minister
   - Notification sent to Minister
   - Audit log updated
10. If Reject:
    - Package status = "Rejected by CEO"
    - Assets return to "Approved by Investment Agency" status
    - All stakeholders notified
    - Package archived

**Flow - Minister Approval:**
1. After CEO approval, Minister receives package
2. Minister reviews complete package
3. Minister can ONLY:
   - **Approve**: Final approval, assets ready for investment
   - **Reject**: Rejects package
4. Minister adds comments
5. If Approve:
   - All assets in package status = "Approved for Investment"
   - Package status = "Ministerial Approval Complete"
   - Success notifications to all stakeholders
   - Assets now available for investment contracts
6. If Reject:
   - Package status = "Rejected by Minister"
   - Assets return to previous status
   - Rejection notification to all
   - Package archived

**Key Differences from Department Reviews:**
- NO "Return for Modification" option
- Only Approve or Reject
- Approvals are package-level, not individual assets
- Final authority - no further escalation
- Higher SLA visibility and reporting

**SLA for Executive Approvals:**
- CEO: 3 business days
- Minister: 5 business days
- Daily reminders if approaching deadline
- Executive dashboard shows all pending packages

#### UC-006: SLA Reminder Notifications

**Purpose:** Keep workflow moving by alerting approvers and supervisors of approaching or missed deadlines

**Actors:** System (automated), Approvers, Supervisors, Platform Admin

**SLA Definitions by Stage:**
- Department Reviews: 5 business days
- Investment Agency: 7 business days
- TBC Package Creation: No SLA (at TBC discretion)
- CEO Approval: 3 business days
- Minister Approval: 5 business days

**Reminder Schedule:**
- **50% elapsed**: Gentle reminder
  - Email subject: "Reminder: ISNAD Form #XXX pending your review"
  - In-app notification
  - Recipient: Assigned approver only
  
- **80% elapsed**: Urgent reminder
  - Email subject: "⚠️ Urgent: ISNAD Form #XXX review due in 1 day"
  - In-app notification (highlighted)
  - SMS notification (if enabled)
  - Recipient: Assigned approver + CC supervisor
  
- **100% elapsed** (Overdue): Escalation
  - Email subject: "🔴 OVERDUE: ISNAD Form #XXX is past due"
  - In-app notification (critical alert)
  - SMS notification
  - Recipient: Approver + Supervisor + Platform Admin
  - Daily repeat until action taken

**Flow:**
1. System checks all active forms every hour
2. Calculates time elapsed vs. SLA for each form
3. Identifies forms at 50%, 80%, 100% thresholds
4. Sends appropriate notification based on threshold
5. Logs notification in audit trail
6. Updates form with "SLA Status" badge:
   - 🟢 On-time (< 50%)
   - 🟡 Warning (50-80%)
   - 🟠 Urgent (80-100%)
   - 🔴 Overdue (> 100%)

**Notification Content:**
- Form ID and asset name
- Current stage/approver
- Days elapsed / Days remaining
- Link to form (direct access)
- Quick action buttons (Approve/Reject/Review)

**SLA Pause Conditions:**
- Form status = "Request Additional Information"
- Form status = "Returned for Modification"
- Pauses until status changes back to "In Review"

**Supervisor Escalation:**
- If form overdue by 3+ days
- Supervisor receives daily summary
- Supervisor can reassign reviewer (if needed)
- Platform Admin notified of chronic delays

**Dashboard View:**
- All users see SLA status for forms in their queue
- Color-coded urgency indicators
- Sortable by SLA status
- Filter by overdue items

**Reporting:**
- Weekly SLA compliance report
- By department: % on-time approvals
- Average approval time per stage
- Bottleneck identification
- Individual reviewer performance metrics

#### UC-007: Return ISNAD Form for Modification

**Actors:** Department Reviewers, Investment Agency

**Pre-conditions:**
- Form is in reviewer's queue
- Reviewer identified issues requiring clarification/correction
- Form not yet reached CEO/Minister stage

**Flow:**
1. Reviewer opens form for evaluation
2. Identifies issues/gaps:
   - Missing information
   - Incomplete documentation
   - Contradictory data
   - Need for additional assessment
   - Compliance concerns
3. Reviewer clicks "Return for Modification"
4. System presents return form with:
   - **Required Field**: Detailed explanation of needed changes
   - **Optional Field**: Suggested improvements
   - **Checklist**: Specific items to address
5. Reviewer fills explanation (minimum 50 characters)
6. Reviewer adds reference to specific sections needing work
7. Reviewer clicks "Submit Return"
8. System validates mandatory fields completed
9. System:
   - Changes form status = "Returned for Modification"
   - Routes form back to I&P (original submitter)
   - Stops SLA timer for current stage
   - Sends notification to I&P with return details
   - Creates audit log entry
   - Updates timeline with return event

**I&P Response to Return:**
1. I&P receives notification: "Form #XXX returned for modification"
2. I&P opens form, sees:
   - Return reason and details
   - Specific sections flagged
   - Reviewer comments
   - Original form content
3. I&P can:
   - **Edit and Resubmit**: Make changes and submit again
   - **Cancel Form**: Abandon the ISNAD process
   - **Request Clarification**: Ask reviewer for more details
4. If I&P edits and resubmits:
   - Must address all flagged issues
   - Can add response comments explaining changes
   - Submits form
   - System routes to SAME reviewer who returned it
   - New SLA timer starts
5. If I&P cancels:
   - Follows cancellation workflow (UC-008)
   - Form archived as cancelled

**Return Tracking:**
- System tracks number of returns per form
- Flag forms with multiple returns (> 2)
- Highlight patterns for process improvement
- Returns visible in form timeline

**Business Rules:**
- Can return multiple times (no limit)
- Each return restarts SLA for that stage
- Returns always go to I&P (not previous stage)
- CEO and Minister cannot return (only Approve/Reject)
- Return count displayed on form details
- Excessive returns (>3) trigger admin review

**Notification Content:**
- Form ID and asset name
- Reviewer name and department
- Detailed return reason
- List of required changes
- Link to form for editing
- Deadline for resubmission (if any)

#### UC-008: Cancel ISNAD Form

**Actors:** Investment & Partnerships, Investment Agency, Platform Admin

**Pre-conditions:**
- Active ISNAD form exists
- User has cancellation permission
- Form not in Final Approval (CEO/Minister) stage

**Cancellation Reasons:**
- Asset no longer available
- Investment opportunity withdrawn
- External decision (MOE needs land for school)
- Duplicate ISNAD discovered
- Project cancelled
- Strategic priority change
- Other (specify)

**Flow:**
1. Authorized user opens ISNAD form
2. Clicks "Cancel Form" button
3. System displays cancellation confirmation dialog:
   - Warning: "This action cannot be undone"
   - Mandatory: Select cancellation reason (dropdown)
   - Mandatory: Provide detailed justification (text, min 100 chars)
   - Checkbox: "I confirm cancellation of this form"
4. User fills reason and justification
5. User checks confirmation box
6. User clicks "Confirm Cancellation"
7. System validates:
   - Reason selected
   - Justification meets minimum length
   - Confirmation checked
   - User has permission
   - Form not in CEO/Minister approval
8. System:
   - Sets form status = "Cancelled"
   - Stops all SLA timers
   - Updates asset status:
     - If before Investment Agency: "Available"
     - If after Investment Agency: "Available" or as specified
   - Creates cancellation record with:
     - Cancellation date
     - Cancelled by (user)
     - Reason
     - Justification
     - Form stage at cancellation
   - Sends notifications to:
     - All previous approvers
     - Current queue owner
     - Platform Admin
     - I&P (if not the canceller)
   - Adds cancellation to audit log
   - Archives form (remains visible for audit)

**Post-Cancellation:**
- Cancelled forms visible to:
  - Platform Admin (full access)
  - I&P who created it (read-only)
  - Anyone who approved it (read-only)
- Cancelled forms included in reports
- Asset can have new ISNAD form started (fresh process)
- Cancellation statistics tracked

**Restrictions:**
- Cannot cancel if:
  - Form in CEO approval queue
  - Form in Minister approval queue
  - User lacks permission
  - Form already cancelled
  - Form already approved
- These stages require completion via Approve/Reject

**Exception Handling:**
- If cancellation attempted during CEO/Minister stage:
  - Error: "Cannot cancel during executive approval. Form must be approved or rejected."
- If cancellation without proper reason:
  - Error: "Please provide a detailed cancellation reason (minimum 100 characters)"
- If unauthorized user attempts:
  - Error: "Permission Denied: You do not have authority to cancel this form"

**Audit Trail:**
- Cancellation prominently logged
- Visible in form timeline
- Searchable in audit reports
- Includes full context of decision

#### UC-009: Prepare ISNAD Package

**Actors:** TBC User

**Pre-conditions:**
- One or more assets have status = "Approved by Investment Agency"
- TBC User has package creation permission
- Assets not already in another active package

**Flow:**
1. TBC User navigates to "Packages" section
2. Clicks "Create New Package"
3. System displays:
   - List of available assets (Investment Agency approved)
   - Filter/search options
   - Multi-select checkboxes
4. TBC User reviews available assets
5. TBC User selects assets for package (minimum 1, no maximum)
6. System validates:
   - All selected assets are approved by Investment Agency
   - None are already in active package
   - User has permission
7. TBC User clicks "Next: Package Details"
8. System displays package metadata form:
   - **Package ID**: Auto-generated (e.g., PKG-2025-001)
   - **Package Name**: Required, text field
   - **Description**: Optional, text area
   - **Investment Strategy**: Required, dropdown
   - **Justification**: Optional, why these assets grouped
   - **Expected Revenue**: Optional, numeric
   - **Priority Level**: Required, dropdown (High/Medium/Low)
   - **Attachments**: Optional, upload documents
9. TBC User fills metadata
10. TBC User reviews summary:
    - Asset count
    - Total area
    - Combined valuation
    - List of assets with details
11. TBC User clicks "Create Package"
12. System validates all required fields
13. System:
    - Creates package record
    - Links selected assets to package
    - Sets package status = "Pending CEO Approval"
    - Generates package document (PDF summary)
    - Routes package to CEO queue
    - Sends notification to CEO
    - Updates assets status = "In Executive Package"
    - Creates audit log entry
    - Displays success message

**Package Management:**
- TBC User can:
  - View all packages (created, pending, approved, rejected)
  - Edit draft packages (before submission)
  - View package details and status
  - Download package document
  - Track CEO and Minister decisions

**Alternative Flow - Save as Draft:**
- TBC User can save package as draft
- Draft packages not routed to CEO
- Can edit draft:
  - Add/remove assets
  - Update metadata
  - Delete draft
- Submit draft when ready

**Business Rules:**
- Asset can only be in one active package
- Package must have at least one asset
- All assets must be "Approved by Investment Agency"
- CEO approval required before Minister review
- Package approval/rejection is all-or-nothing (not per-asset)
- Rejected packages can be recreated with modifications

**Package Status Flow:**
1. Draft (optional)
2. Pending CEO Approval
3. CEO Approved → Pending Minister Approval
4. Minister Approved → Complete (Success)
5. Rejected by CEO → Archived
6. Rejected by Minister → Archived

**Notifications:**
- Package created → Notify CEO
- CEO approved → Notify Minister
- CEO rejected → Notify TBC User
- Minister approved → Notify all stakeholders (success)
- Minister rejected → Notify all stakeholders

**Package Document (Auto-generated PDF):**
- Cover page with package metadata
- Executive summary
- List of assets with key details
- Individual ISNAD form summaries
- Combined financial analysis
- Investment strategy overview
- Approval tracking sheet
- Attachments section

### 6. Dashboard & Reporting

#### User Dashboard Views

**Investment & Partnerships Dashboard:**
- My Draft Forms (count + list)
- Submitted Forms (status overview)
- Forms Returned to Me (action required)
- Completed Forms (approved/rejected)
- Quick Actions: Start New ISNAD, View Asset Bank
- Statistics:
  - Total forms created
  - Approval rate
  - Average approval time
  - Pending actions

**Reviewer Dashboard (All Department Reviewers):**
- My Queue (forms pending my review)
- SLA Status Overview (on-time, warning, overdue)
- Recently Approved
- Recently Rejected
- Quick Actions: Review Next, View All
- Statistics:
  - Forms reviewed this month
  - Average review time
  - SLA compliance rate
  - Approval/rejection rate

**Investment Agency Dashboard:**
- Forms Pending Review
- Department-Approved Forms
- Forms I Approved
- Rejected Forms
- Statistics:
  - Forms processed
  - Average cycle time
  - Rejection reasons breakdown
  - Approval trend over time

**TBC User Dashboard:**
- Available Assets for Packaging
- My Packages (draft, submitted, approved)
- Pending CEO Approval
- Pending Minister Approval
- Completed Packages
- Statistics:
  - Packages created
  - Success rate
  - Total asset value in packages
  - Revenue projections

**Executive Dashboard (CEO & Minister):**
- Packages Pending My Approval
- Recently Approved Packages
- Portfolio Overview:
  - Total approved assets
  - Total investment value
  - Assets by region/type
- Statistics:
  - Approval velocity
  - Package success rate
  - Investment pipeline value
- Charts & Visualizations

**Platform Admin Dashboard:**
- System Overview:
  - Total assets
  - Active ISNAD forms
  - Pending approvals by stage
  - SLA compliance overall
- Recent Activity
- System Alerts:
  - Overdue forms
  - Multiple returns
  - Cancelled forms
  - Error logs
- User Activity:
  - Active users
  - Login statistics
  - Permission issues
- Quick Actions: View Audit Log, Generate Reports

#### Reporting Features

**Asset Bank Reports:**
1. **Asset Inventory Report**
   - All assets by status
   - Filterable by location, type, status
   - Exportable to Excel

2. **Asset Utilization Report**
   - Available vs. In Use assets
   - Investment potential scores
   - Idle assets analysis

3. **Asset Valuation Report**
   - Total portfolio value
   - By region, type
   - Financial dues outstanding

**ISNAD Workflow Reports:**
1. **Approval Pipeline Report**
   - Forms by stage
   - Average time per stage
   - Bottleneck identification
   - SLA compliance by stage

2. **Approval History Report**
   - All decisions by date range
   - Filterable by approver, status
   - Decision reasons analysis

3. **Performance Metrics Report**
   - By reviewer: approval time, SLA compliance
   - By department: throughput, rejections
   - Overall workflow efficiency

4. **Rejection Analysis Report**
   - Rejection reasons breakdown
   - Rejection rate by department
   - Common rejection patterns
   - Assets with multiple rejections

5. **Return for Modification Report**
   - Forms with returns
   - Return reasons
   - Multiple return analysis
   - Time impact of returns

**Package Reports:**
1. **Package Summary Report**
   - All packages by status
   - Success rate
   - Average approval time
   - Revenue projections

2. **Executive Approval Report**
   - CEO decisions
   - Minister decisions
   - Approval trends
   - Strategic insights

**Audit Reports:**
1. **User Activity Report**
   - Login history
   - Actions by user
   - Permission usage
   - Suspicious activity

2. **System Changes Report**
   - Configuration changes
   - Role/permission updates
   - Data modifications
   - System maintenance

**Export Options:**
- All reports exportable to:
  - Excel (XLSX)
  - PDF
  - CSV
- Scheduled reports (daily, weekly, monthly)
- Email delivery option
- Custom report builder

### 7. User Interface Requirements

#### Layout & Navigation

**Main Navigation (Sidebar):**
- 📊 Dashboard
- 🏢 Asset Bank
- 📝 ISNAD Forms
  - My Forms (I&P)
  - My Queue (Reviewers)
  - All Forms (Admin)
- 📦 Packages (TBC, CEO, Minister)
- 📈 Reports
- ⚙️ Settings
- 👤 Profile

**Top Bar:**
- Organization logo
- User name and role
- Notifications icon (with unread count)
- Search (global)
- Logout

#### Asset Bank Interface

**List View:**
- Table with columns:
  - Asset ID (sortable, clickable)
  - Asset Name
  - Type (icon + text)
  - Location
  - Area (m²)
  - Status (badge with color)
  - Actions (View, Start ISNAD, Edit)
- Filters:
  - Status (multi-select)
  - Type
  - Location (city, district)
  - Area range
  - Date added range
- Bulk actions:
  - Export selected
  - Update status (admin only)
- Pagination: 25 per page
- Quick add: Floating "+ Add Asset" button

**Detail View:**
- Header:
  - Asset ID and Name
  - Status badge
  - Action buttons (Start ISNAD, Edit, Archive)
- Tabs:
  - Overview (key details)
  - Documents (list + viewer)
  - ISNAD History (all forms for this asset)
  - Location (map integration)
  - Financial (valuation, dues)
  - Activity Log (audit trail)
- Image gallery (property photos)
- Related assets (nearby properties)

**Add/Edit Form:**
- Multi-step wizard:
  - Step 1: Basic Information
  - Step 2: Location Details
  - Step 3: Documents Upload
  - Step 4: Financial Information
  - Step 5: Review & Confirm
- Inline validation
- Auto-save draft
- Progress indicator
- Back/Next navigation
- Cancel option

#### ISNAD Form Interface

**Form Creation (I&P):**
- Asset selection (search/filter from Asset Bank)
- Form sections (expandable):
  - Asset Information (read-only, pre-filled)
  - Investment Criteria (editable)
  - Technical Assessment (editable)
  - Financial Analysis (editable)
- Rich text editor for detailed fields
- Document upload areas
- Save Draft / Submit buttons
- Help tooltips on complex fields
- Real-time validation

**Review Interface (Approvers):**
- Two-column layout:
  - Left: Form content (read-only)
  - Right: Review panel (actions + comments)
- Sections highlighted for attention
- Previous approver comments visible
- Attachments expandable
- Review checklist
- Action buttons (Approve / Reject / Return / Request Info)
- Comment box (mandatory for certain actions)
- Quick navigation between sections

**My Queue (Reviewers):**
- Kanban board or list view toggle
- Cards showing:
  - Form ID
  - Asset name
  - SLA status (color-coded)
  - Days in queue
  - Quick preview
  - Action button
- Sort by: SLA, Date, Priority
- Filter by: Status, Asset Type, Location
- Bulk actions option

**Timeline View:**
- Visual timeline of form progression
- Each stage represented
- Approver names and decisions
- Comments viewable on hover
- Current stage highlighted
- SLA status per stage
- Clickable stages for details

#### Package Interface (TBC, CEO, Minister)

**Package Creation (TBC):**
- Step 1: Select Assets
  - Grid or list view
  - Multi-select with checkboxes
  - Filter approved assets
  - Preview on hover
  - Summary panel (count, total area)
- Step 2: Package Details
  - Form with metadata fields
  - Rich text for description
  - File upload for attachments
- Step 3: Review & Submit
  - Selected assets summary
  - Package metadata review
  - Edit links to go back
  - Submit to CEO button

**Package Review (CEO, Minister):**
- Package header:
  - Package ID and name
  - Created by, created date
  - Priority level
  - Total assets
- Asset cards (expandable):
  - Key asset details
  - ISNAD summary
  - Investment highlights
- Combined analytics:
  - Total valuation
  - Expected revenue
  - Risk assessment
- Decision panel:
  - Approve / Reject (only)
  - Comment box
  - Attachments
  - Submit decision
- Comparison view (if multiple packages)

#### Notifications Panel

**Notification Types:**
- 🔔 Form submitted for your review
- ✅ Your form was approved
- ❌ Your form was rejected
- 🔄 Form returned for modification
- ⚠️ SLA reminder (50%, 80%)
- 🔴 Form overdue
- 📦 Package created/approved/rejected
- 💬 New comment on your form
- 👤 Assigned as reviewer

**Notification Interface:**
- Dropdown from bell icon
- Unread count badge
- List of notifications (most recent first)
- Mark as read/unread
- Click to navigate to form
- Filter by type
- Clear all read
- Notification settings (preferences)

#### Responsive Design

**Desktop (Primary):**
- Full sidebar navigation
- Multi-column layouts
- Detailed tables
- Hover interactions
- Keyboard shortcuts

**Tablet:**
- Collapsible sidebar
- Adapted layouts (2-column → 1-column)
- Touch-friendly buttons
- Optimized tables

**Mobile (View-only mode):**
- Bottom navigation
- Single column layouts
- Swipe gestures
- Essential actions only
- Limited editing (view + comment only)

### 8. Technical Architecture

#### System Components

**Frontend (React + TypeScript):**
```
src/
├── components/
│   ├── AssetBank/
│   │   ├── AssetList.tsx
│   │   ├── AssetDetails.tsx
│   │   ├── AssetForm.tsx
│   │   └── AssetSearch.tsx
│   ├── ISNAD/
│   │   ├── ISNADForm.tsx
│   │   ├── ISNADReview.tsx
│   │   ├── ISNADQueue.tsx
│   │   └── ISNADTimeline.tsx
│   ├── Package/
│   │   ├── PackageCreator.tsx
│   │   ├── PackageReview.tsx
│   │   └── PackageList.tsx
│   ├── Dashboard/
│   │   ├── UserDashboard.tsx
│   │   ├── ReviewerDashboard.tsx
│   │   └── ExecutiveDashboard.tsx
│   ├── Shared/
│   │   ├── Layout.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Notifications.tsx
│   │   └── StatusBadge.tsx
│   └── Reports/
│       ├── ReportBuilder.tsx
│       └── ChartComponents.tsx
├── services/
│   ├── api.ts
│   ├── auth.ts
│   ├── notifications.ts
│   └── workflow.ts
├── store/
│   ├── slices/
│   │   ├── assetSlice.ts
│   │   ├── isnadSlice.ts
│   │   ├── packageSlice.ts
│   │   └── userSlice.ts
│   └── store.ts
├── hooks/
│   ├── useAssets.ts
│   ├── useWorkflow.ts
│   └── useNotifications.ts
└── utils/
    ├── validation.ts
    ├── formatting.ts
    └── constants.ts
```

**Backend (Node.js + Express):**
```
server/
├── routes/
│   ├── assets.js
│   ├── isnad.js
│   ├── packages.js
│   ├── workflow.js
│   ├── notifications.js
│   └── reports.js
├── controllers/
│   ├── assetController.js
│   ├── isnadController.js
│   ├── workflowController.js
│   └── packageController.js
├── services/
│   ├── workflowEngine.js
│   ├── notificationService.js
│   ├── slaManager.js
│   └── emailService.js
├── middleware/
│   ├── auth.js
│   ├── permissions.js
│   ├── validation.js
│   └── logging.js
├── models/
│   ├── Asset.js
│   ├── ISNADForm.js
│   ├── Package.js
│   ├── Approval.js
│   └── AuditLog.js
└── utils/
    ├── pdfGenerator.js
    ├── excelExporter.js
    └── duplicateDetection.js
```

#### Database Schema

**Assets Table:**
```sql
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id VARCHAR(50) UNIQUE NOT NULL, -- e.g., AST-2025-0001
  asset_name VARCHAR(255) NOT NULL,
  asset_type ENUM('Land', 'Building') NOT NULL,
  
  -- Location
  city VARCHAR(100),
  district VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  area_sqm DECIMAL(12, 2),
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'Available',
  -- Available, In Review, Approved for Investment, Rejected, 
  -- On Hold, In Executive Package, Allocated
  
  -- Financial
  valuation DECIMAL(15, 2),
  financial_dues DECIMAL(15, 2),
  custody_items TEXT,
  
  -- Additional
  ownership_documents JSONB, -- array of file references
  restrictions TEXT,
  investment_potential_score INTEGER, -- 1-10
  
  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  archived_at TIMESTAMP,
  
  CONSTRAINT unique_asset_name_location UNIQUE (asset_name, city, district, asset_type)
);

CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_location ON assets(city, district);
CREATE INDEX idx_assets_type ON assets(asset_type);
```

**ISNAD Forms Table:**
```sql
CREATE TABLE isnad_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id VARCHAR(50) UNIQUE NOT NULL, -- e.g., ISNAD-2025-0001
  asset_id UUID REFERENCES assets(id) NOT NULL,
  
  -- Status
  status VARCHAR(50) NOT NULL,
  -- Draft, Submitted, In Department Review, Investment Agency Review,
  -- In Package, Approved, Rejected, Returned, Cancelled
  
  current_stage VARCHAR(100),
  -- School Planning, Asset Management, Shared Services, 
  -- Education Dept, Investment Agency, CEO, Minister
  
  current_assignee UUID REFERENCES users(id),
  
  -- Form Content (JSONB for flexibility)
  investment_criteria JSONB,
  technical_assessment JSONB,
  financial_analysis JSONB,
  
  -- Tracking
  submitted_at TIMESTAMP,
  completed_at TIMESTAMP,
  return_count INTEGER DEFAULT 0,
  
  -- SLA
  sla_deadline TIMESTAMP,
  sla_status VARCHAR(20), -- on-time, warning, urgent, overdue
  
  -- Metadata
  created_by UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  cancelled_at TIMESTAMP,
  cancelled_by UUID REFERENCES users(id),
  cancellation_reason TEXT
);

CREATE INDEX idx_isnad_status ON isnad_forms(status);
CREATE INDEX idx_isnad_assignee ON isnad_forms(current_assignee);
CREATE INDEX idx_isnad_asset ON isnad_forms(asset_id);
CREATE INDEX idx_isnad_stage ON isnad_forms(current_stage);
```

**Approvals Table:**
```sql
CREATE TABLE approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID REFERENCES isnad_forms(id) NOT NULL,
  
  stage VARCHAR(100) NOT NULL,
  approver_id UUID REFERENCES users(id) NOT NULL,
  approver_role VARCHAR(100),
  
  action VARCHAR(50) NOT NULL,
  -- Approve, Reject, Return, Request Info
  
  comments TEXT,
  
  -- For Reject/Return
  reason VARCHAR(100),
  detailed_justification TEXT,
  
  -- Attachments
  attachments JSONB,
  
  -- Timing
  assigned_at TIMESTAMP DEFAULT NOW(),
  action_taken_at TIMESTAMP,
  duration_hours DECIMAL(10, 2),
  sla_compliant BOOLEAN,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_approvals_form ON approvals(form_id);
CREATE INDEX idx_approvals_approver ON approvals(approver_id);
CREATE INDEX idx_approvals_stage ON approvals(stage);
```

**Packages Table:**
```sql
CREATE TABLE packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id VARCHAR(50) UNIQUE NOT NULL, -- e.g., PKG-2025-001
  
  package_name VARCHAR(255) NOT NULL,
  description TEXT,
  investment_strategy VARCHAR(100),
  priority_level VARCHAR(20), -- High, Medium, Low
  
  status VARCHAR(50) NOT NULL,
  -- Draft, Pending CEO, CEO Approved, Pending Minister, 
  -- Minister Approved, Rejected
  
  -- Financial
  expected_revenue DECIMAL(15, 2),
  total_valuation DECIMAL(15, 2),
  
  -- Approvals
  ceo_approved_at TIMESTAMP,
  ceo_comments TEXT,
  minister_approved_at TIMESTAMP,
  minister_comments TEXT,
  
  -- Metadata
  created_by UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  
  -- Generated Document
  package_document_url TEXT
);

CREATE INDEX idx_packages_status ON packages(status);
CREATE INDEX idx_packages_created_by ON packages(created_by);
```

**Package Assets (Junction Table):**
```sql
CREATE TABLE package_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID REFERENCES packages(id) NOT NULL,
  asset_id UUID REFERENCES assets(id) NOT NULL,
  form_id UUID REFERENCES isnad_forms(id),
  
  added_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(package_id, asset_id)
);

CREATE INDEX idx_package_assets_package ON package_assets(package_id);
CREATE INDEX idx_package_assets_asset ON package_assets(asset_id);
```

**Notifications Table:**
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID REFERENCES users(id) NOT NULL,
  
  type VARCHAR(50) NOT NULL,
  -- form_submitted, approval_needed, form_approved, form_rejected,
  -- form_returned, sla_warning, sla_overdue, package_created, etc.
  
  title VARCHAR(255) NOT NULL,
  message TEXT,
  
  -- Related entities
  form_id UUID REFERENCES isnad_forms(id),
  package_id UUID REFERENCES packages(id),
  asset_id UUID REFERENCES assets(id),
  
  -- Link for navigation
  action_url TEXT,
  
  -- Status
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Email tracking
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);
CREATE INDEX idx_notifications_type ON notifications(type);
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
  -- asset_created, form_submitted, form_approved, form_rejected,
  -- package_created, user_logged_in, permission_changed, etc.
  
  entity_type VARCHAR(50),
  -- Asset, ISNADForm, Package, User, etc.
  
  entity_id UUID,
  
  -- Details
  changes JSONB, -- before/after for updates
  metadata JSONB, -- additional context
  
  -- When
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Where
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  -- Result
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
```

**SLA Configuration Table:**
```sql
CREATE TABLE sla_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  stage VARCHAR(100) UNIQUE NOT NULL,
  -- School Planning, Asset Management, etc.
  
  sla_hours INTEGER NOT NULL,
  -- Business hours for this stage
  
  reminder_50_percent BOOLEAN DEFAULT TRUE,
  reminder_80_percent BOOLEAN DEFAULT TRUE,
  
  escalate_on_breach BOOLEAN DEFAULT TRUE,
  escalation_recipients TEXT[], -- email addresses
  
  active BOOLEAN DEFAULT TRUE,
  
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### API Endpoints

**Assets:**
- `GET /api/assets` - List all assets (with filters)
- `POST /api/assets` - Create new asset
- `GET /api/assets/:id` - Get asset details
- `PUT /api/assets/:id` - Update asset
- `DELETE /api/assets/:id` - Archive asset
- `POST /api/assets/import` - Bulk import from Excel
- `GET /api/assets/:id/history` - Get ISNAD history for asset
- `POST /api/assets/duplicate-check` - Check for duplicates

**ISNAD Forms:**
- `GET /api/isnad/forms` - List forms (filtered by role/permissions)
- `POST /api/isnad/forms` - Create new ISNAD form
- `GET /api/isnad/forms/:id` - Get form details
- `PUT /api/isnad/forms/:id` - Update form (draft only)
- `DELETE /api/isnad/forms/:id` - Cancel form
- `POST /api/isnad/forms/:id/submit` - Submit form for approval
- `POST /api/isnad/forms/:id/approve` - Approve form
- `POST /api/isnad/forms/:id/reject` - Reject form
- `POST /api/isnad/forms/:id/return` - Return for modification
- `POST /api/isnad/forms/:id/comment` - Add comment
- `GET /api/isnad/forms/:id/timeline` - Get approval timeline
- `GET /api/isnad/my-queue` - Get forms in user's queue

**Workflow:**
- `GET /api/workflow/stages` - Get all workflow stages
- `GET /api/workflow/next-approver/:formId` - Get next approver
- `POST /api/workflow/route` - Route form to next stage
- `GET /api/workflow/history/:formId` - Get workflow history

**Packages:**
- `GET /api/packages` - List all packages
- `POST /api/packages` - Create new package
- `GET /api/packages/:id` - Get package details
- `PUT /api/packages/:id` - Update package (draft only)
- `DELETE /api/packages/:id` - Delete draft package
- `POST /api/packages/:id/submit` - Submit to CEO
- `POST /api/packages/:id/approve` - CEO/Minister approval
- `POST /api/packages/:id/reject` - CEO/Minister rejection
- `GET /api/packages/:id/document` - Download package PDF

**Notifications:**
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
- `GET /api/notifications/unread-count` - Get unread count
- `POST /api/notifications/preferences` - Update notification preferences

**Reports:**
- `GET /api/reports/asset-inventory` - Asset inventory report
- `GET /api/reports/approval-pipeline` - Pipeline report
- `GET /api/reports/performance` - Performance metrics
- `GET /api/reports/sla-compliance` - SLA compliance report
- `GET /api/reports/rejections` - Rejection analysis
- `POST /api/reports/custom` - Generate custom report
- `GET /api/reports/export/:reportId` - Export report (Excel/PDF)

**Audit:**
- `GET /api/audit/logs` - Get audit logs (with filters)
- `GET /api/audit/user/:userId` - User-specific logs
- `GET /api/audit/entity/:type/:id` - Entity-specific logs
- `GET /api/audit/export` - Export audit logs

**Reference Data:**
- `GET /api/reference/cities` - List of cities
- `GET /api/reference/districts/:city` - Districts by city
- `GET /api/reference/asset-types` - Asset types
- `GET /api/reference/rejection-reasons` - Rejection reasons
- `GET /api/reference/sla-config` - SLA configuration

### 9. Security & Permissions

**Authentication:**
- SSO integration (same as User Management system)
- JWT tokens for API authentication
- Session management
- Password policies (if local auth fallback)

**Authorization - Role Permissions:**

| Action | I&P | School Planning | Asset Mgmt | Shared Services | Education Dept | Invest Agency | TBC User | CEO | Minister | Admin |
|--------|-----|-----------------|------------|-----------------|----------------|---------------|----------|-----|----------|-------|
| Create ISNAD | ✓ | - | - | - | - | - | - | - | - | ✓ |
| View Own Forms | ✓ | - | - | - | - | - | - | - | - | ✓ |
| View Queue | - | ✓ | ✓ | ✓ | ✓ | ✓ | - | - | - | ✓ |
| Approve | - | ✓ | ✓ | ✓ | ✓ | ✓ | - | ✓ | ✓ | - |
| Reject | - | ✓ | ✓ | ✓ | ✓ | ✓ | - | ✓ | ✓ | - |
| Return | - | ✓ | ✓ | ✓ | ✓ | ✓ | - | - | - | - |
| Cancel Form | ✓ | - | - | - | - | ✓ | - | - | - | ✓ |
| Add Asset | - | - | ✓ | - | - | - | - | - | - | ✓ |
| Edit Asset | - | - | ✓ | - | - | - | - | - | - | ✓ |
| Create Package | - | - | - | - | - | - | ✓ | - | - | - |
| Approve Package | - | - | - | - | - | - | - | ✓ | ✓ | - |
| View All Forms | - | - | - | - | - | - | - | - | - | ✓ |
| View Reports | Partial | Partial | Partial | Partial | Partial | ✓ | Partial | ✓ | ✓ | ✓ |
| Audit Logs | - | - | - | - | - | - | - | - | - | ✓ |

**Data Access Control:**
- Row-level security based on role
- Department reviewers see only relevant forms
- Regional filtering for Education Dept
- Shared Services sees limited financial fields
- Executives see aggregated data
- Admin sees everything

**API Security:**
- Rate limiting (100 requests/minute per user)
- CORS policy (whitelist domains)
- Input validation and sanitization
- SQL injection prevention (parameterized queries)
- XSS protection (content security policy)
- CSRF tokens for state-changing operations

**File Upload Security:**
- File type validation (PDF, JPG, PNG, DOCX only)
- File size limits (10MB per file)
- Virus scanning (ClamAV or similar)
- Secure storage (S3 with private buckets)
- Signed URLs for temporary access
- Watermarking for sensitive documents

### 10. Integration Points

**Email Service (SendGrid / AWS SES):**
- Notification emails
- SLA reminders
- Weekly digest
- System alerts

**File Storage (AWS S3 / Azure Blob):**
- Asset documents
- ISNAD attachments
- Package PDFs
- Report exports

**Map Service (Google Maps / Mapbox):**
- Asset location display
- Geocoding addresses
- Distance calculations

**PDF Generation (Puppeteer / PDFKit):**
- Package documents
- Report exports
- ISNAD form PDFs
- Audit trail exports

**Excel Processing (ExcelJS):**
- Bulk asset import
- Report exports
- Data templates

**Workflow Engine:**
- Custom or BPM.js
- Stage routing logic
- SLA calculations
- Escalation handling

**User Management System:**
- Shared authentication
- User role synchronization
- Permission validation
- Audit log integration

### 11. Testing Strategy

**Unit Tests:**
- API endpoints (200+ tests)
- Business logic (workflow rules)
- Validation functions
- Utility functions

**Integration Tests:**
- Workflow progression
- Approval scenarios
- Notification delivery
- Report generation
- File uploads

**E2E Tests:**
- Complete ISNAD workflow (I&P → Minister)
- Asset creation and form initiation
- Package creation and approval
- SLA reminder triggering
- User login and navigation

**Performance Tests:**
- API response times (<500ms)
- Database query optimization
- Concurrent user handling (100+ users)
- File upload speed
- Report generation time

**Security Tests:**
- Authentication bypass attempts
- Authorization checks
- SQL injection tests
- XSS vulnerability scans
- File upload exploits

### 12. Deployment & DevOps

**Environment Setup:**
- Development (local)
- Staging (pre-production)
- Production (live)

**CI/CD Pipeline:**
- GitHub Actions / GitLab CI
- Automated testing on PR
- Build and deploy on merge
- Database migrations
- Rollback procedures

**Monitoring:**
- Application logs (Winston / Pino)
- Error tracking (Sentry)
- Performance monitoring (New Relic / DataDog)
- Uptime monitoring (Pingdom)
- User analytics (Google Analytics)

**Backup Strategy:**
- Database: Daily automated backups
- Files: Continuous replication (S3)
- Retention: 30 days rolling
- Disaster recovery plan

**Scaling:**
- Horizontal scaling (multiple app servers)
- Database read replicas
- CDN for static assets
- Caching layer (Redis)

### 13. Success Metrics

**Efficiency Metrics:**
- Average ISNAD completion time: Target < 30 days
- SLA compliance rate: Target > 90%
- Forms per month: Track throughput
- Package approval rate: Target > 75%

**Quality Metrics:**
- First-pass approval rate: Target > 60%
- Return rate: Target < 20%
- Rejection rate by stage: Identify bottlenecks
- Data accuracy: Zero duplicate assets

**User Adoption:**
- Active users per week
- Login frequency
- Feature usage (which features used most)
- User satisfaction (surveys)

**System Performance:**
- API response time: < 500ms
- Page load time: < 2 seconds
- System uptime: > 99.5%
- Error rate: < 0.1%

## Getting Started with Replit

**Initial Setup:**

1. **Create Replit Project:**
   - Template: Node.js
   - Or use: "Full Stack Web" template

2. **Install Dependencies:**
```bash
# Backend
npm install express pg cors jsonwebtoken bcrypt dotenv
npm install multer aws-sdk nodemailer
npm install winston helmet express-rate-limit

# Dev dependencies
npm install --save-dev nodemon jest supertest

# Frontend (if separate folder)
cd client
npm install react react-dom typescript
npm install @mui/material @emotion/react @emotion/styled
npm install axios react-router-dom redux @reduxjs/toolkit
npm install recharts date-fns
```

3. **Database Setup:**
   - Add PostgreSQL addon in Replit
   - Run schema migrations
   - Seed initial data (roles, SLA config)

4. **Environment Variables:**
```
DATABASE_URL=<from replit>
JWT_SECRET=<generate strong secret>
AWS_ACCESS_KEY=<for file storage>
AWS_SECRET_KEY=<for file storage>
AWS_S3_BUCKET=<bucket name>
SENDGRID_API_KEY=<for emails>
NODE_ENV=development
```

5. **Run Application:**
```bash
# Backend
npm run dev

# Frontend (separate terminal)
cd client && npm start
```

6. **Access Application:**
   - Backend API: Replit URL
   - Frontend: Replit preview or custom domain

**Development Workflow:**

1. Start with backend:
   - Database schema
   - API endpoints (assets, ISNAD, workflow)
   - Authentication middleware
   - Workflow engine

2. Build frontend:
   - Layout and navigation
   - Asset Bank interface
   - ISNAD form components
   - Dashboard views
   - Package management

3. Integration:
   - Connect frontend to API
   - Test workflows end-to-end
   - Add notifications
   - Implement SLA monitoring

4. Testing & QA:
   - Write tests
   - Fix bugs
   - Performance optimization
   - Security audit

5. Documentation:
   - API docs (Swagger)
   - User guide
   - Admin manual
   - Developer guide

## Questions to Clarify

1. **Workflow Routing:**
   - Are department reviews parallel or sequential?
   - Can stages be skipped for certain asset types?

2. **SLA Enforcement:**
   - What happens after repeated SLA breaches?
   - Can supervisors override/reassign?

3. **Package Approval:**
   - Can CEO/Minister partially approve packages (some assets yes, some no)?
   - Or is it all-or-nothing?

4. **Shared Services Scope:**
   - Exact fields they can review/edit
   - Can they approve if financial dues outstanding?

5. **Asset Editing:**
   - Can Asset Management edit while ISNAD in progress?
   - Version control for asset data?

6. **Cancellation:**
   - Should cancelled forms be fully hidden or visible with restrictions?
   - Can investors see cancellation reasons?

7. **Integration:**
   - Need to integrate with existing MOE systems?
   - Data migration from current Excel files?

8. **Reporting:**
   - Specific KPIs required for executive dashboard?
   - Frequency of scheduled reports?

9. **Notifications:**
   - SMS notifications in addition to email?
   - In-app only for certain user types?

10. **File Storage:**
    - On-premise or cloud storage preferred?
    - Document retention policy?

---

**Version:** 2.0  
**Last Updated:** Based on BRD dated 28.08.2025 (updated 11.09)  
**Status:** Ready for development - Assets Bank & ISNAD Workflow Automation

**Next Steps:**
1. Review and approve specifications
2. Design database schema
3. Create wireframes/mockups
4. Set up development environment
5. Begin sprint planning
