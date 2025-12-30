# COMPREHENSIVE SYSTEM IMPLEMENTATION PROMPT v2.0
## Madares Business: Lands for Investor - Asset Bank & ISNAD Workflow Automation
### Based on: Initial BRD + Detailed Flow Diagrams

---

## CRITICAL UPDATES FROM VISUAL FLOW ANALYSIS

This enhanced prompt integrates insights from detailed workflow diagrams that provide screen-by-screen user journeys, role-specific views, and state transitions.

---

## EXECUTIVE SUMMARY

Build a complete digital platform for Saudi Arabia's Ministry of Education (MOE) to manage property investment workflows. The system replaces manual paper-based processes with an automated, traceable platform consisting of:

1. **Asset Bank Module**: Digital property repository with pre-approval workflow
2. **ISNAD Workflow Module**: Multi-department approval process for investment clearance
3. **Package Management Module**: Executive-level approval for final investment authorization
4. **Contract Management Module**: Post-approval contract tracking (Phase 2)

**Key Insight from Flows**: The system manages 3 distinct asset lifecycle stages with different approval requirements at each stage.

---

## ASSET LIFECYCLE - THREE STAGES

### Stage 1: PRE-ASSET → ASSET (Asset Bank Entry)
**Purpose**: Initial validation that property can be added to the Asset Bank  
**Process Name**: "Add Asset to Asset Bank" (Process 001)  
**Owner**: School Planning Department (Contributor role)  
**Reviewers**: 
- Safety, Security & Facilities Department
- Investment & Partnerships Department
- MOE Central Oversight
- Final Approver role

**Pre-Asset Statuses**:
- `Pending Approval` → `In Review` → `Approved` → `Available`
- `Rejected` (with mandatory justification)

**Outcome**: Asset becomes "Available" in Asset Bank and eligible for ISNAD workflow

### Stage 2: ASSET → PRE-INVESTABLE ASSET (ISNAD Process)
**Purpose**: Full clearance for investment permission  
**Process Name**: "ISNAD Process" (Process 002)  
**Owner**: Investment & Partnerships Department (ISNAD Creator + Form Owner)  
**Reviewers** (multi-department parallel approval):
- School Planning Department
- Safety, Security & Facilities Department
- Investment & Partnerships Department (different role)
- **16 Regional Education Departments** (CRITICAL: Not 7 departments as in BRD, but 16!)
- Investment Agency (MOE Central Oversight)

**Asset Statuses During ISNAD**:
- `Pending Verification`
- `Verification Due`
- `Changes Requested`
- `Verified and Filled`
- `Rejected`

**Outcome**: Asset becomes "Pre-Investable Asset" and handed to TBC

### Stage 3: PRE-INVESTABLE ASSET → INVESTABLE ASSET (Final Approvals)
**Purpose**: Executive sign-off for investment offering  
**Process Name**: "Final Approvals" (Process 003)  
**Owner**: TBC (Package Preparer)  
**Approvers**: 
- CEO of TBC
- Associate Minister of MOE

**Package Statuses**:
- `Pending CEO of TBC Approval`
- `Pending Associate Minister of MOE Approval`
- `Approved`
- `Rejected`

**Outcome**: Asset becomes "Investable Asset" ready for bidding

### Stage 4: INVESTABLE ASSET → CONTRACTED ASSET (Outside Platform - Phase 2)
**Process Name**: "Bidding" (Process 004 - offline initially)  
**Process Name**: "Contract Management" (Process 005)  
**Owner**: TBC (Bidding Entity, Contract Manager)

---

## CRITICAL CORRECTION: 16 REGIONAL EDUCATION DEPARTMENTS

**FROM PDF ANNOTATION**: 
> "16 education departments in KSA. We will need to add Education Departments (16) to Madares Business. Each department with its own structure."

**Implementation Impact**:
- The BRD mentions 7 departments, but the actual requirement is **16 Regional Education Departments**
- Each of the 16 departments must review ISNAD forms for properties in their region
- Each department has its own organizational structure and hierarchy
- System must support regional assignment logic (asset location → appropriate regional department)
- Dashboard views must handle 16+ parallel approvals efficiently

**Department List** (16 Regional Education Departments in KSA):
1. Riyadh Education Department
2. Makkah Education Department
3. Madinah Education Department
4. Eastern Province Education Department
5. Qassim Education Department
6. Ha'il Education Department
7. Jazan Education Department
8. Asir Education Department
9. Tabuk Education Department
10. Najran Education Department
11. Al-Baha Education Department
12. Northern Borders Education Department
13. Al-Jouf Education Department
14. Al-Qurayyat Education Department (if separate)
15. Additional regional structures as per MOE organization
16. Additional regional structures as per MOE organization

*Note: Exact department names should be confirmed with MOE organizational chart*

---

## DETAILED SCREEN-BY-SCREEN WORKFLOWS

### PROCESS 001: ADD ASSET TO ASSET BANK

#### Actor: School Planning Department (Contributor Role)

**Screen 1: Asset Bank View (List)**
- **Entry Point**: Landing page for Contributor
- **View Type**: Table/Grid of existing assets
- **Actions Available**:
  - "Add Asset" CTA button
  - Search/filter existing assets
  - View asset details (read-only)
- **Status Indicators**: Show asset statuses with color coding

**Screen 2: Form "Adding Land to Asset Bank" - Introduction**
- **Purpose**: Explain what information is needed
- **Content**:
  - Form purpose explanation
  - Required documents list
  - Expected timeline
  - "Start Form" CTA

**Screen 3: Form "Adding Land to Asset Bank" - Data Entry**
- **View Access**: Contributor role (Create, edit, save as draft, submit)
- **Required Fields**:
  - Asset name
  - Asset type (land/building)
  - Asset location (coordinates, address, region)
  - Size (square meters)
  - Educational department (dropdown - select from 16 regions)
  - Land code (unique identifier)
  - Optional: Photos/documents upload
- **Actions**:
  - "Save as Draft" CTA (Draft status)
  - "Submit to Asset Bank" CTA (moves to Pending Approval)
  - "Cancel" (discard)
- **Validations**:
  - Mandatory field checks
  - Duplicate detection (checks existing land codes)
  - File size limits for uploads

**Screen 4: Form Preview & Creation Log**
- **Content**:
  - Read-only preview of submitted data
  - Creation log showing who submitted when
  - Status indicator: "Pending Approval"

**Screen 5: Thank You / Confirmation Page**
- **Content**:
  - Confirmation message
  - Asset ID assigned
  - Next steps explanation
  - Link to track status

#### Actor: Safety, Security & Facilities Dept (Reviewer Role)

**Screen 1: Asset Bank View (Reviewer)**
- **Entry Point**: Shows assets pending their review
- **View Type**: Queue/inbox style
- **Filters**: 
  - By status (Pending Approval, In Review)
  - By date submitted
  - By region
- **Actions**: "Review Asset" CTA per asset

**Screen 2: Form "Adding Land to Asset Bank" - Review View**
- **Content**:
  - All submitted data (read-only)
  - Supporting documents preview
  - Safety & facilities assessment fields (to fill)
- **Actions**:
  - "Approve" with optional comments
  - "Reject" with mandatory reason field
  - "Request Changes" with explanation
- **Validation**: 
  - Cannot approve/reject without completing assessment
  - Mandatory justification for rejection

**Screen 3: Form Approval/Rejection Log**
- **Content**:
  - Decision recorded
  - Timestamp
  - Reviewer name
  - Comments/justification
- **System Action**: Routes to next reviewer or back to contributor

#### Actor: Investment & Partnerships Dept (Reviewer Role)

**Similar review flow as Safety & Facilities, but with investment perspective assessment**

#### Actor: MOE Central Oversight (Reviewer Role)

**Similar review flow with strategic oversight assessment**

#### Actor: Final Approver Role

**Screen 1: Asset Bank View (Final Approver)**
- **Entry Point**: Shows assets that passed all previous reviews
- **View Type**: Final approval queue
- **Filters**: By region, by date, by asset type

**Screen 2: Form Review (Final Approver)**
- **Content**:
  - Complete asset data
  - All previous reviewer comments
  - Approval history log
- **Actions**:
  - "Approve" (asset becomes "Available")
  - "Reject" with mandatory reason
- **Outcome**: 
  - If approved → Asset Status: `Approved` → becomes `Available` for ISNAD
  - If rejected → Asset Status: `Rejected` (end of process)

#### Alternative Scenarios for Asset Bank:

**Bulk Upload Process**:
- "Bulk Upload" CTA available to Contributors
- Upload CSV/Excel file with multiple assets
- System validates each row
- Shows validation errors per row
- Allows correction and resubmit
- Each asset follows standard approval flow

**Draft Management**:
- Contributors can save incomplete forms as drafts
- Drafts visible only to creator
- Draft status: `Draft`
- Can edit, complete, and submit later
- System may auto-save drafts periodically

**Exception Handling**:
- **Asset already exists**: System shows warning with existing asset details, blocks submission
- **Missing mandatory fields**: System highlights missing fields, blocks submission
- **File upload failure**: Error message, allow retry without losing other data
- **Approver tries to proceed without justification**: System blocks action, prompts for required input
- **User lacks permission**: "Access Denied" message

---

### PROCESS 002: ISNAD WORKFLOW

#### Actor: Investment & Partnerships (ISNAD Creator + Form Owner)

**Screen 1: Asset Bank View (I&P Form Owner Role)**
- **Entry Point**: View of "Available" assets
- **View Type**: Grid/cards of investable properties
- **Filters**: 
  - By region
  - By asset type
  - By size
  - Custom search
- **Actions**: "Start ISNAD Form" CTA per asset

**Screen 2: Form "ISNAD" - Introduction**
- **Purpose**: Explain ISNAD process
- **Content**:
  - Process overview
  - Timeline expectations
  - Required approvals list
  - "Begin ISNAD Request" CTA

**Screen 3: Form "ISNAD" - Request Initiation**
- **Pre-populated Data** (from Asset Bank):
  - Asset Information
  - Asset Location
  - Education Department
  - Pictures
  - Land details
- **New Fields to Complete**:
  - **Section 1**: Investment Rationale
    * Why this asset for investment?
    * Strategic alignment
    * Investment model proposed (lease, BOT, etc.)
  - **Section 2**: Supporting Information
    * Market analysis
    * Expected benefits
    * Risk assessment
  - **Supporting Documents**:
    * Investment proposal
    * Financial projections
    * Legal clearances
- **Critical Note from PDF**: 
  > "Request to start ISNAD Initiation but don't fill the elements YET. We are using the asset bank with multiple data points."
  
  **Interpretation**: Form is created in "draft" state first, then progressively filled

**Actions**:
- "Send Request" CTA (submits for review)
- "Save as Draft" CTA
- "Cancel" with confirmation dialog

**Validations**:
- Asset not already in another active ISNAD workflow
- All mandatory sections completed
- User has permission to initiate

**Screen 4: Form Preview & Creation Log**
- **Content**:
  - Complete ISNAD form data
  - Creation timestamp
  - Form ID
  - Current status: `Pending Verification`

**Screen 5: Thank You / Confirmation**
- **Content**:
  - ISNAD request created confirmation
  - Form tracking number
  - Estimated timeline
  - Link to track status

#### Actor: Department Reviewers (16 Regional Education Departments + Others)

**The PDF shows these departments need review screens**:
- School Planning Dept (Approver role)
- Safety, Security & Facilities Dept (Approver role)
- Investment & Partnerships Dept (Approver role - different from form owner)
- Head of Education Dept (Approver role) - **This represents each of 16 regional departments**

**Screen 1: Asset Bank View (Department Approver)**
- **Entry Point**: Shows ISNAD forms pending their review
- **View Type**: Queue of forms assigned to their department
- **Columns**:
  - Form ID
  - Asset name & location
  - Date submitted
  - Days pending
  - SLA countdown
  - Priority indicator
- **Filters**: 
  - By region (critical for Regional Education Departments)
  - By status
  - By SLA risk (green/yellow/red)
- **Actions**: "Review Asset" CTA

**Screen 2: Form "ISNAD" - Review View (Department Specific)**
- **Content**:
  - **Form Preview** (depends on role access):
    * Complete asset information
    * Investment & Partnerships' request details
    * Previous reviewers' comments (if any)
  - **Department Assessment Section**:
    * Department-specific questions/criteria
    * Risk assessment for their domain
    * Conditions or recommendations
  - **Supporting Documents**:
    * View all attachments
    * Option to attach additional documents (deeds, aerial photos, reports)

**Actions** (Critical from PDF):
- **"Approve"** with optional comments
  - Routes to next department in workflow
  - Status updates to show this department approved
- **"Reject"** with **mandatory** reason
  - **Critical**: "Reject with the reason (planning need)"
  - Immediately ends ISNAD workflow
  - Form status → `Rejected`
  - All other pending departments notified (no action needed)
  - Asset returns to `Available` in Asset Bank
- **"Request for MODIFICATION"** (Return to I&P)
  - **Critical**: "only to Investment and Partnerships"
  - Cannot request modification from other departments
  - Mandatory explanation of what needs correction
  - Form status → `Changes Requested`
  - Routes back to I&P (form owner)
  - I&P makes corrections and resubmits
  - Form re-enters at this department for re-review
  - Previous approvals remain valid unless modification affects them

**Special Note on Modification Flow from PDF**:
> "Modification will go straight to the 'user' that is responsible for 'modification' than go to I&P"

**Interpretation**: 
- Some departments may have dedicated modification specialists
- Modification request goes: Department → Modification Specialist (within dept) → I&P
- I&P responds → back through same chain

**Note on Regional Authority from PDF**:
> "Different Authority to Education Department. If there is any kind of modification need it will go to I&P"

**Interpretation**:
- Regional Education Departments have different hierarchical authority
- But modification requests ALWAYS route back to I&P (never directly between departments)

**Screen 3: Form Status Log (Approved/Rejected/Returned)**
- **Content**:
  - Decision recorded with timestamp
  - Reviewer name and department
  - Comments/justification
  - Status indicator showing department's decision
- **System Actions**:
  - Email notifications to relevant parties
  - Update workflow state
  - Trigger next step or halt workflow

#### Business Rules for Department Review:

**All Must Approve Logic**:
- ISNAD can only advance if ALL reviewing departments approve
- Single rejection from ANY department = entire ISNAD rejected
- Departments review in parallel (not sequential)
- Each department sees form once all have been assigned

**SLA Management**:
- Each department has configurable SLA (e.g., 5 business days)
- SLA countdown visible on form review screen
- Automated reminders at 70%, 90%, 100% thresholds
- Overdue forms highlighted in red on queue screen
- Department manager receives escalation notifications

**Return for Modification Logic**:
- When ANY department requests modification:
  - Form status → `Changes Requested`
  - Other departments' approvals preserved
  - I&P receives notification with department's comments
  - I&P edits form and resubmits
  - Form returns to requesting department for re-review
  - Other departments don't need to re-review (unless changes affect their domain)
  - System tracks modification history

#### Actor: Investment Agency (MOE Central Oversight)

**Screen 1: Asset Bank View (Investment Agency)**
- **Entry Point**: Forms that passed all department reviews
- **View Type**: Queue of forms ready for central investment assessment
- **Filters**: By region, by asset type, by investment model

**Screen 2: Form "ISNAD" - Investment Agency Review**
- **Content**:
  - Complete asset and ISNAD data
  - All department approval comments
  - Market viability assessment section
- **Actions**:
  - "Approve" → Asset becomes ready for Package Preparation
  - "Reject" with reason → ISNAD ends, asset returns to Available
  - "Return for Modification" → back to I&P

**Outcome**:
- If approved: Asset status → `Pre-Investable Asset`
- Asset handed to TBC for package preparation
- "End of Journey 'ISNAD', Start of new Journey 'Investment'"

#### Modification Process (When Form Returned to I&P):

**Screen 1: Modification Notification**
- **Trigger**: Email + in-app notification
- **Content**:
  - Which department requested modification
  - What needs to be changed (comments)
  - Link to form

**Screen 2: Form "ISNAD" - Modification View**
- **Content**:
  - Current form data (editable)
  - Highlighted sections that need attention
  - Department's modification request comments
- **Actions**:
  - Edit relevant sections
  - Add clarifications
  - Upload additional documents
  - "Resubmit" → sends back to requesting department

**System Behavior**:
- Tracks version history
- Logs all modification cycles
- Updates status to show form was modified
- Restarts SLA timer for the reviewing department

#### Cancellation Process:

**From PDF: "Cancel from if the asset is no longer valid"**

**Actors Who Can Cancel**:
- Investment & Partnerships (form owner)
- Investment Agency
- Platform Admin

**Screen: Cancel ISNAD Form Dialog**
- **Trigger**: "Cancel Form" button visible on form view
- **Content**:
  - Warning message
  - "Are you sure?" confirmation
  - Mandatory cancellation reason field (text area)
- **Actions**:
  - "Confirm Cancellation"
  - "Go Back"

**System Behavior on Cancellation**:
- Form status → `Cancelled`
- Asset returns to `Available` in Asset Bank (unless also marked for removal)
- All stakeholders notified
- Audit log updated with reason
- Cancelled forms remain visible for audit (Admin and I&P only)

**Exception from PDF**:
> "Delete. No option to modify"

**Interpretation**: Once in final approval stages (CEO/Minister), cancellation is blocked. Only Approve/Reject allowed.

---

### PROCESS 003: FINAL APPROVALS (PACKAGE PREPARATION & EXECUTIVE SIGN-OFF)

#### Actor: TBC (Package Preparer)

**Screen 1: Investable Assets List**
- **Entry Point**: View of assets approved by Investment Agency
- **View Type**: Grid/table of investable assets
- **Columns**:
  - Asset name, location, size
  - Region
  - Investment Agency approval date
  - Package status (if already packaged)
- **Actions**:
  - Select multiple assets (checkboxes)
  - "Preview Assets" 
  - "Create Package" CTA

**Screen 2: Package Creation Form**
- **Critical from PDF**:
  > "TBC step: Continue with 1 or multiple assets. Form: Open Field Text, List Investable Assets."

**Content**:
- **Package Metadata**:
  - Package name/ID
  - Description (open text field)
  - Justification/business case
  - Package type (if applicable)
- **Asset List**:
  - Selected assets displayed
  - Summary information per asset
  - Option to remove assets from package
- **Supporting Documents**:
  - Upload consolidated package documentation

**Actions**:
- "Save as Draft" → Package Status: `Draft`
- "Submit Package" → Routes to CEO
- "Cancel"

**Validations**:
- At least 1 asset must be selected
- Assets cannot be in multiple packages simultaneously
- Mandatory metadata fields completed

**Screen 3: Asset Packages List (Package Preparer View)**
- **Content**:
  - All packages created by TBC
  - Status indicators:
    - `Draft`
    - `Pending CEO of TBC Approval`
    - `Pending Associate Minister of MOE Approval`
    - `Approved`
    - `Rejected`
- **Actions**:
  - Edit drafts
  - View submitted packages
  - Track approval status

**Screen 4: Package Preview & Creation Log**
- **Content**:
  - Complete package details
  - Asset list with summaries
  - Creation log
  - Current status
- **Actions**: "Send to CEO" CTA (if in draft)

#### Actor: CEO of TBC (Approver)

**Screen 1: "Asset Packages" List (CEO View)**
- **Entry Point**: Packages pending CEO approval
- **View Type**: Executive dashboard style
- **Columns**:
  - Package ID and name
  - Number of assets
  - Total estimated value (if available)
  - Date submitted
  - Priority indicator
- **Actions**: "Review Package" CTA

**Screen 2: "Package Review" Form (CEO)**
- **Content from PDF**:
  > "Package Review: What details are reviewed by CEO? Which information to prioritize in asset list? How many assets are typically in one package?"

**Content**:
- **Package Summary**:
  - Package metadata
  - Business case summary
  - Total investment potential
- **Asset Details** (Critical information for CEO):
  - Location and size
  - Strategic importance
  - Investment model
  - Revenue potential
  - Risk assessment
  - Department approval summaries
- **Investment Agency Recommendation**
- **Supporting Documents**:
  - Consolidated package documentation
  - Individual asset files

**Actions from PDF**:
> "Accept ALL, Reject ALL with a reason"
> "No new form, Send it to CEO, Sit on it and do nothing"
> "Delete. No option to modify"

**Actual Actions**:
- **"Approve"**:
  - Routes package to Associate Minister
  - Package Status → `Pending Associate Minister of MOE Approval`
  - System notification to Minister
- **"Reject"** with mandatory reason:
  - Package Status → `Rejected`
  - Returns to TBC (package preparer)
  - TBC can revise and create new package
  - Assets remain as `Pre-Investable` (can be re-packaged)
- **"Save for Later"** (optional):
  - CEO can defer decision
  - Package remains in pending queue
  - No status change

**Critical Note**: NO "Return for Modification" option at this level. Only Approve or Reject.

**Screen 3: Package Status Log (Approved/Rejected)**
- **Content**:
  - CEO's decision
  - Timestamp
  - Justification (if rejected)
  - Next steps indicator

#### Actor: Associate Minister of MOE (Final Ministry-Level Approver)

**Screen 1: "Asset Packages" List (Minister View)**
- **Entry Point**: Packages approved by CEO, pending ministerial approval
- **View Type**: Executive-level dashboard
- **Strategic Focus**: High-level policy alignment, strategic impact

**Screen 2: "Package Review" Form (Minister)**
- **Content** (similar to CEO but with strategic focus):
  - Package summary
  - Strategic alignment with MOE objectives
  - Policy implications
  - Financial impact
  - Regional distribution analysis
  - Complete asset details
  - CEO's approval and comments

**Actions**:
- **"Approve"**:
  - Package Status → `Approved`
  - All assets in package → `Investable Asset`
  - Package handed to TBC for bidding
  - "Package become 'Approved' Returned to TBC for Bidding"
  - System notification to all stakeholders
  - **End of ISNAD Journey, Start of Investment Journey**
- **"Reject"** with mandatory reason:
  - Package Status → `Rejected`
  - Returns to TBC
  - Assets remain `Pre-Investable`
  - Can be re-evaluated or re-packaged

**Critical Note from PDF**:
> "CEO rejects → form ends as Rejected (ISNAD). Associate Minister rejects → form ends as Rejected (ISNAD)."

**System Behavior**:
- Rejection at any executive level returns package to TBC
- Assets don't revert to earlier stages (remain Pre-Investable)
- Package can be reformulated with different justification

**Screen 3: Package Approval Log**
- **Content**:
  - Minister's decision
  - Timestamp
  - Policy-level justification
  - Final approval confirmation

---

## USER ROLES - COMPREHENSIVE RBAC

Based on visual flows, here are all distinct roles with their permissions:

### 1. School Planning Department - Contributor Role
**Responsibilities**:
- Add assets to Asset Bank
- Fill asset registration forms
- Upload supporting documents
**Permissions**:
- Create, Edit, Save as Draft, Submit asset registration forms
- View own submissions
- Cannot approve own submissions
**Views**: 
- Asset Bank (Contributor view)
- Asset registration form (full edit access)

### 2. Safety, Security & Facilities Department - Reviewer Role
**Responsibilities**:
- Review pre-assets for safety and infrastructure compliance
**Permissions**:
- View assigned pre-assets
- Approve/Reject/Request Changes
- Add safety assessment comments
**Views**:
- Asset Bank (Reviewer view - assigned assets only)
- Asset registration form (review view)

### 3. Investment & Partnerships Department - Reviewer Role (Asset Bank)
**Responsibilities**:
- Review pre-assets for investment potential (initial screening)
**Permissions**:
- View assigned pre-assets
- Approve/Reject/Request Changes
- Add investment viability comments
**Views**:
- Asset Bank (Reviewer view)
- Asset registration form (review view)

### 4. MOE Central Oversight - Reviewer Role (Asset Bank)
**Responsibilities**:
- Strategic oversight of asset additions
**Permissions**:
- View assigned pre-assets
- Approve/Reject
- Add strategic comments
**Views**:
- Asset Bank (MOE oversight view)
- Asset registration form (review view)

### 5. Final Approver Role (Asset Bank)
**Responsibilities**:
- Final sign-off on asset bank entries
**Permissions**:
- View assets that passed all reviews
- Final Approve/Reject
**Views**:
- Asset Bank (Final approver view)
- Asset registration form (final review view)

### 6. Investment & Partnerships Department - ISNAD Creator + Form Owner
**Responsibilities**:
- Initiate ISNAD workflows
- Fill ISNAD forms
- Respond to modification requests
- Monitor ISNAD progress
**Permissions**:
- Select available assets
- Create ISNAD forms
- Edit and resubmit modified forms
- Cancel own ISNAD forms
- View status of all own ISNAD forms
**Views**:
- Asset Bank (I&P form owner view - shows Available assets)
- ISNAD form (creator/editor view)
- ISNAD tracking dashboard

### 7. School Planning Department - Approver Role (ISNAD)
**Responsibilities**:
- Review ISNAD forms for educational planning compliance
**Permissions**:
- View assigned ISNAD forms
- Approve/Reject/Return for Modification
- Add planning-specific comments
**Views**:
- Asset Bank (School Planning approver view)
- ISNAD form (review view with planning assessment)

### 8. Safety, Security & Facilities Department - Approver Role (ISNAD)
**Responsibilities**:
- Review ISNAD forms for safety and infrastructure
**Permissions**:
- View assigned ISNAD forms
- Approve/Reject/Return for Modification
- Add safety comments
**Views**:
- Asset Bank (Safety approver view)
- ISNAD form (review view with safety assessment)

### 9. Investment & Partnerships Department - Approver Role (ISNAD)
**Note**: Different from ISNAD Creator role
**Responsibilities**:
- Review ISNAD forms from approval/risk perspective
**Permissions**:
- View assigned ISNAD forms
- Approve/Reject/Return for Modification
- Add approval comments
**Views**:
- Asset Bank (I&P approver view)
- ISNAD form (review view with I&P assessment)

### 10. Head of Education Department - Approver Role (ISNAD)
**CRITICAL**: This role represents each of the **16 Regional Education Departments**
**Responsibilities**:
- Review ISNAD forms for regional education needs
- Ensure property not needed for schools or education facilities
- Assess regional strategic fit
**Permissions**:
- View ISNAD forms for assets in their region only
- Approve/Reject/Return for Modification
- Add regional education assessment
**Views**:
- Asset Bank (Regional Ed Dept view - filtered by region)
- ISNAD form (review view with regional assessment)
**Special Configuration**:
- Each of 16 departments has independent approval queue
- Region-based auto-assignment of forms
- Each department can have multiple approvers with hierarchy

### 11. Investment Agency - MOE Central Oversight (ISNAD)
**Responsibilities**:
- Central investment viability assessment
- Market analysis
- Final pre-executive approval
**Permissions**:
- View ISNAD forms that passed all department reviews
- Approve/Reject/Return for Modification
- Add market viability assessment
- Can cancel ISNAD forms
**Views**:
- Asset Bank (Investment Agency view)
- ISNAD form (investment agency review view)
- Market analysis dashboard

### 12. TBC - Final Approver (ISNAD to Package Transition)
**Responsibilities**:
- Receive approved assets from Investment Agency
- Prepare investment packages
**Permissions**:
- View investable assets list
- Create packages
- Track package status
**Views**:
- Investable Assets list
- Package creation form
- Package management dashboard

### 13. TBC - Package Preparer
**Responsibilities**:
- Create and manage investment packages
- Compile documentation
- Submit to CEO
**Permissions**:
- Select investable assets
- Create packages
- Save drafts
- Submit to CEO
- Edit packages before submission
**Views**:
- Investable Assets list (TBC Package Preparer view)
- Package creation/edit form
- Package list (own packages)

### 14. CEO of TBC - Approver
**Responsibilities**:
- Executive approval of investment packages
**Permissions**:
- View packages pending approval
- Approve or Reject packages (no modification)
- Add executive comments
**Views**:
- Asset Packages list (CEO view)
- Package review form (executive view)

### 15. Associate Minister of MOE - Final Ministry-Level Approver
**Responsibilities**:
- Ministerial sign-off on investment packages
- Strategic policy alignment
**Permissions**:
- View packages approved by CEO
- Final Approve or Reject (no modification)
- Add ministerial justification
**Views**:
- Asset Packages list (Minister view)
- Package review form (ministerial view)
- Strategic dashboard

### 16. TBC - Bidding Entity (Phase 2)
**Responsibilities**:
- Manage bidding process for approved assets
**Permissions**:
- View approved investable assets
- Initiate bidding
- Manage bidder interactions
**Views**:
- Approved assets list
- Bidding management interface

### 17. TBC - Contract Manager (Phase 2)
**Responsibilities**:
- Contract entry and management post-bidding
**Permissions**:
- Enter contract metadata (20-30 fields)
- Upload contract documents
- Link contracts to assets and investors
- Track contract lifecycle
**Views**:
- Contract management dashboard
- Contract entry form
- Linked asset/investor details

### 18. Platform Admin - Admin Role
**Responsibilities**:
- System configuration
- User management
- Audit oversight
- Technical troubleshooting
**Permissions**:
- Full system access
- View all assets, forms, packages
- User CRUD operations
- System settings configuration
- Cancel any ISNAD form (with justification)
- Access all audit logs
- Cannot approve on behalf of others
**Views**:
- Asset Bank (full view)
- Investable Assets list (full view)
- All forms and packages (read-only)
- System admin dashboard
- User management interface
- Audit log viewer

**From PDF**: "System monitoring, audit, but no approval rights"

### 19. Investor - External Role (Phase 2)
**Responsibilities**:
- View available properties
- Track contract status
**Permissions**:
- View-only access to approved investable assets
- View own contracts
- Download property documentation
**Views**:
- Public investment portal
- Own contracts list

**From PDF**: "View-only access to their own contracts"

### 20. Platform Admin - Full Oversight (Additional Note)
**From PDF**: "Platform Admin - full view of all contracts (for audit/oversight)"
**Additional Permissions**:
- View all contracts (read-only)
- Export contract data for reporting
- Access contract audit trails

---

## STATUS MANAGEMENT - COMPREHENSIVE STATE DEFINITIONS

### Pre-Asset Statuses (Asset Bank Entry Stage)
1. **Draft**: Asset registration form saved but not submitted
2. **Pending Approval**: Submitted, awaiting first reviewer
3. **In Review**: At least one reviewer has accessed the form
4. **Approved**: All reviewers approved, final approver signed off
5. **Available**: Asset active in Asset Bank, ready for ISNAD
6. **Rejected**: Rejected during Asset Bank entry (end state)

### Asset Statuses (ISNAD Stage)
1. **Available**: Ready to start ISNAD workflow
2. **Pending Verification**: ISNAD form created, awaiting department reviews
3. **Verification Due**: Approaching SLA deadline
4. **In Review**: Departments actively reviewing
5. **Changes Requested**: Returned to I&P for modifications
6. **Verified and Filled**: All departments approved, at Investment Agency
7. **Pre-Investable**: Investment Agency approved, ready for packaging
8. **Rejected**: ISNAD rejected (end state for this attempt)

### Package Statuses
1. **Draft**: Package created but not submitted
2. **Pending CEO of TBC Approval**: Submitted to CEO
3. **Pending Associate Minister of MOE Approval**: CEO approved, at Minister
4. **Approved**: Minister approved, ready for bidding
5. **Rejected**: Rejected by CEO or Minister

### Final Asset Status (Post-Package Approval)
1. **Investable Asset**: Approved for investment, ready for bidding
2. **In Bidding**: Bidding process active (Phase 2)
3. **Contracted**: Contract signed with investor (Phase 2)

---

## DASHBOARD REQUIREMENTS BY ROLE

### Contributor Dashboard (School Planning)
**Widgets**:
- My Submitted Assets (count by status)
- Assets Pending Review (count)
- Recent Approvals/Rejections
- Draft Assets (resume editing)
**Actions**:
- Quick "Add New Asset" button
- Bulk upload entry

### Reviewer Dashboard (All Reviewing Departments)
**Widgets**:
- My Review Queue (count, grouped by SLA risk)
- Overdue Reviews (red alert)
- Recently Completed Reviews
- Department Performance Stats (avg review time)
**Filters**:
- By region (for Regional Ed Departments)
- By SLA status
- By date submitted

### ISNAD Creator Dashboard (I&P)
**Widgets**:
- Active ISNAD Forms (count by stage)
- Forms Requiring My Action (modifications requested)
- Forms at Each Department (progress visualization)
- SLA Compliance Stats
**Visualizations**:
- Pipeline chart showing forms at each stage
- Regional distribution of ISNAD forms

### Department Approver Dashboard (ISNAD)
**Widgets**:
- My ISNAD Review Queue (count by priority)
- Overdue Forms (SLA breached)
- Recently Reviewed Forms
- Forms Returned for Modification (tracking)
**For Regional Ed Departments**:
- Regional filter (show only their region's forms)
- Regional statistics

### Investment Agency Dashboard
**Widgets**:
- Forms Awaiting Investment Assessment
- Approved Forms (Pre-Investable Assets count)
- Rejection Rate Analysis
- Market Viability Trends
**Analytics**:
- Asset type distribution
- Regional investment potential heat map

### TBC Package Preparer Dashboard
**Widgets**:
- Available Investable Assets (count)
- My Packages (by status)
- Packages Pending CEO
- Packages Pending Minister
- Draft Packages
**Actions**:
- Quick "Create Package" button

### Executive Dashboards (CEO & Minister)
**Widgets**:
- Packages Awaiting My Approval (count)
- Recently Approved Packages
- Total Investment Pipeline Value
- Regional Distribution of Packages
**KPIs**:
- Avg time from ISNAD start to approval
- Approval rate by region
- Strategic impact indicators

### Admin Dashboard
**Widgets**:
- System Health Indicators
- User Activity Stats
- Forms by Status (all processes)
- SLA Compliance by Department
- Recent System Actions
**Analytics**:
- Bottleneck analysis (which departments cause delays)
- User adoption metrics
- Error logs and system alerts

---

## NOTIFICATION RULES

### Asset Bank Process Notifications

**Event: Asset Submitted**
- **To**: All reviewers (Safety & Facilities, I&P, MOE Oversight, Final Approver)
- **Channel**: Email + In-app
- **Urgency**: Normal
- **Content**: "New asset submitted for review: [Asset Name]"

**Event: Asset Approved by Reviewer**
- **To**: Next reviewer in sequence
- **Channel**: Email + In-app
- **Urgency**: Normal

**Event: Asset Approved (Final)**
- **To**: Contributor (School Planning)
- **Channel**: Email + In-app
- **Urgency**: Normal
- **Content**: "Your asset [Asset Name] is now Available in Asset Bank"

**Event: Asset Rejected**
- **To**: Contributor
- **Channel**: Email + In-app
- **Urgency**: High
- **Content**: Includes rejection reason and reviewer comments

**Event: Changes Requested**
- **To**: Contributor
- **Channel**: Email + In-app
- **Urgency**: High
- **Content**: Includes what needs correction

**Event: SLA Reminder (70% elapsed)**
- **To**: Assigned reviewer
- **Channel**: Email + In-app
- **Urgency**: Medium

**Event: SLA Breach (100%)**
- **To**: Assigned reviewer + their manager
- **Channel**: Email + In-app + SMS (optional)
- **Urgency**: Critical

### ISNAD Process Notifications

**Event: ISNAD Form Created**
- **To**: All department reviewers (parallel assignment)
- **Channel**: Email + In-app
- **Urgency**: Normal
- **Content**: "New ISNAD form for [Asset Name] requires your review"

**Event: Department Approved**
- **To**: Form owner (I&P), remaining reviewers (FYI)
- **Channel**: In-app (real-time progress update)
- **Urgency**: Low

**Event: Department Rejected**
- **To**: Form owner (I&P), all other reviewers
- **Channel**: Email + In-app
- **Urgency**: High
- **Content**: "ISNAD form rejected by [Department]. Reason: [Reason]"
- **Note**: Other reviewers notified that no further action needed

**Event: Return for Modification**
- **To**: Form owner (I&P)
- **Channel**: Email + In-app
- **Urgency**: High
- **Content**: "[Department] has requested modifications: [Comments]"

**Event: Form Resubmitted After Modification**
- **To**: Requesting department
- **Channel**: Email + In-app
- **Urgency**: Normal
- **Content**: "ISNAD form [ID] has been resubmitted for your review"

**Event: All Departments Approved**
- **To**: Investment Agency, Form owner (I&P)
- **Channel**: Email + In-app
- **Urgency**: Normal
- **Content**: "ISNAD form [ID] passed all department reviews, ready for Investment Agency assessment"

**Event: Investment Agency Approved**
- **To**: Form owner (I&P), TBC Package Preparer
- **Channel**: Email + In-app
- **Urgency**: Normal
- **Content**: "Asset [Name] is now Pre-Investable and ready for packaging"

**Event: ISNAD Form Cancelled**
- **To**: All stakeholders (departments, I&P, Investment Agency)
- **Channel**: Email + In-app
- **Urgency**: Medium
- **Content**: "ISNAD form [ID] has been cancelled. Reason: [Reason]"

**Event: SLA Reminders & Escalations** (per department)
- **70% Elapsed**: Email + In-app to reviewer
- **90% Elapsed**: Email + In-app to reviewer + FYI to manager
- **100% (Breach)**: Email + In-app + SMS to reviewer + manager
- **Recurring**: Every 48 hours after initial breach

### Package Process Notifications

**Event: Package Created**
- **To**: CEO of TBC
- **Channel**: Email + In-app
- **Urgency**: Normal
- **Content**: "New investment package [Name] submitted for your approval"

**Event: CEO Approved**
- **To**: Associate Minister, Package Preparer (TBC), Form owners (I&P)
- **Channel**: Email + In-app
- **Urgency**: Normal
- **Content**: "Package [Name] approved by CEO, pending Ministerial review"

**Event: CEO Rejected**
- **To**: Package Preparer (TBC)
- **Channel**: Email + In-app
- **Urgency**: High
- **Content**: "Package [Name] rejected by CEO. Reason: [Reason]"

**Event: Minister Approved**
- **To**: Package Preparer (TBC), CEO, All Form owners (I&P), Investment Agency
- **Channel**: Email + In-app
- **Urgency**: High
- **Content**: "Package [Name] has received final ministerial approval and is now ready for bidding"

**Event: Minister Rejected**
- **To**: Package Preparer (TBC), CEO
- **Channel**: Email + In-app
- **Urgency**: High
- **Content**: "Package [Name] rejected at ministerial level. Reason: [Reason]"

### Weekly Digest Notifications

**To**: All active users (configurable per user)
**Schedule**: Every Monday 8:00 AM
**Content**:
- Summary of forms/packages requiring their action
- Upcoming SLA deadlines
- Recent completions in their domain
- System announcements

---

## CRITICAL BUSINESS RULES (FROM PDF INSIGHTS)

### 1. Regional Assignment Logic
- Asset location determines which Regional Education Department reviews the ISNAD
- System must automatically assign the correct regional department based on asset location
- Each regional department only sees forms for assets in their region

### 2. Modification Routing
- **ALL modification requests MUST route to Investment & Partnerships (form owner)**
- Departments CANNOT request modifications from each other directly
- Modification specialist (if exists within department) acts as intermediary
- After modification, form returns to the requesting department for re-review

### 3. Rejection Finality
- **Single rejection from ANY department = ISNAD workflow ends immediately**
- No override possible
- Asset returns to "Available" status in Asset Bank
- Can initiate a new ISNAD later if circumstances change

### 4. Executive No-Modification Rule
- CEO and Minister have only TWO options: Approve or Reject
- **NO "Return for Modification" at executive level**
- From PDF: "Delete. No option to modify"
- Rejection returns package to TBC for reformulation (new package)

### 5. Asset Locking During Workflow
- Asset in active ISNAD workflow CANNOT be included in another ISNAD
- Asset in a package CANNOT be included in another package simultaneously
- System enforces uniqueness at each stage

### 6. Version Control & Asset Data Propagation
- From PDF: "Asset DP - version before ISNAD created (internal view - default)"
- "Asset DP - version upgraded to investable asset (asset ready for bidding)"
- System maintains different asset data snapshots at each stage
- ISNAD form captures point-in-time asset data
- Changes to asset in Asset Bank don't affect in-flight ISNAD forms

### 7. Visibility Rules
- From PDF: "They will see the status or NOT - based on admin permission"
- "Visible externally if selected by I&P user"
- Assets have internal visibility (default) and optional external visibility
- External visibility controlled by I&P department
- Investors (external) see only externally visible, approved investable assets

### 8. Draft Management & Cancellation
- From PDF: "Actions: Edit, Submit, Delete"
- Drafts can be deleted at any time
- Submitted forms can only be cancelled (not deleted) to preserve audit trail
- Cancelled forms remain visible for audit purposes

### 9. Approval Preservation During Modification
- When form returned for modification, previous department approvals remain valid
- Exception: If modification affects another department's domain, they may need to re-review
- System should flag which departments need re-review based on modification scope

### 10. Failed Asset Registration Handling
- From PDF: "Czy przechowujemy failed asset registration form?" (Do we keep failed asset registration forms?)
- **Decision Required**: Should rejected asset bank submissions be retained?
- **Recommendation**: Yes, keep rejected submissions for audit (visible to Admin only)
- **Question**: "Czy może być ten Pre-asset dodawany 2 raz?" (Can pre-asset be added twice/versioning?)
- **Recommendation**: Allow same property to be resubmitted with corrections (version control)

---

## OPEN DESIGN QUESTIONS (FROM PDF ANNOTATIONS)

The PDF contains several open questions that need stakeholder decisions:

### Asset Bank Questions

**Q1**: "Jaki ma to wpływ na status Pre-Assetu?" (What impact does this have on Pre-Asset status?)
- **Context**: When asset is rejected at different stages
- **Decision Needed**: Define status changes and whether rejected assets can be resubmitted

**Q2**: "Czy przechowujemy failed asset registration form?" (Do we store failed registration forms?)
- **Recommendation**: Yes, for audit and learning
- **Decision Needed**: Confirm retention policy

**Q3**: "Czy może być ten Pre-asset dodawany 2 raz? (wersjonowanie)" (Can pre-asset be added twice? Versioning?)
- **Recommendation**: Yes, with version tracking
- **Decision Needed**: Confirm versioning strategy

**Q4**: "Offline database? Skąd biorą się dane na pre-assety?" (Offline database? Where does pre-asset data come from?)
- **Decision Needed**: Is there a legacy system or offline source feeding asset data?
- **Recommendation**: Provide bulk import capability from legacy Excel/databases

### ISNAD Questions

**Q5**: "Czy ta logika tyczy się tak samo procesu 'Add Asset to Asset Bank'?" (Does this logic apply to Asset Bank process too?)
- **Context**: Regarding logs, roles, and visibility at different stages
- **Decision Needed**: Confirm if role/log structure is consistent across both processes

**Q6**: "Czy widzi też pozostałe statusy?" (Does user see other statuses too?)
- **Context**: Status visibility for different roles
- **Decision Needed**: Define granular status visibility per role

### Package Questions

**Q7**: "Jakie szczegóły są poddawane review przez CEO?" (What details are reviewed by CEO?)
- **Context**: What information to prioritize in CEO package view
- **Decision Needed**: CEO dashboard priorities confirmed

**Q8**: "Ile orientacyjnie Assetów jest w jednym Package?" (Approximately how many assets in one package?)
- **Decision Needed**: Typical package size for UI optimization
- **Recommendation**: Design for 1-20 assets per package, support up to 50

**Q9**: "Package Preview - Dane" (Package Preview - Data)
- **Decision Needed**: Specific data fields for package preview
- **Recommendation**: Asset summaries, financial projections, strategic fit indicators

**Q10**: "Ownerem Package jest I&P nie TBC?" (Is package owner I&P not TBC?)
- **Clarification Needed**: PDF shows TBC as package preparer, but question suggests I&P
- **Recommendation**: Confirm with stakeholders, likely TBC based on flows

**Q11**: "ISNAD ma już status Rejected ale dla Assetów, które nie przeszły do lvl Available Asset → tutaj mamy Available Asset rejected from being Investable Asset"
- **Context**: Status semantics for rejection at different stages
- **Decision Needed**: Clear distinction between:
  - Rejected during Asset Bank entry (not Available)
  - Rejected during ISNAD (was Available, failed to become Pre-Investable)
  - Rejected during Package (was Pre-Investable, failed to become Investable)

### Dashboard & UX Questions

**Q12**: "Notes: Zaprojketować widoki z max uprawienianimi i od tego ciąć"
- **Translation**: "Design views with maximum permissions and cut from there"
- **Decision**: Design principle - start with full access views, then restrict per role

**Q13**: "Zdefiniować nazwy dla poszczególnych etapów życia assetów"
- **Translation**: "Define names for individual stages of asset life"
- **Decision Needed**: Finalize terminology for all statuses (done in this document)

**Q14**: "Dashboardy dla poszczególnych userów i etapów assetu (kwetsia statusów powielajacych się)"
- **Translation**: "Dashboards for users and asset stages (question of duplicate statuses)"
- **Decision Needed**: Simplify status nomenclature to avoid confusion

**Q15**: "Konsekwencje rejectu i cancel dla każdego etapu assetu"
- **Translation**: "Consequences of reject and cancel for each asset stage"
- **Decision Needed**: Documented above, confirm with stakeholders

---

## TECHNICAL IMPLEMENTATION NOTES

### Database Schema Enhancements

**Regional Departments Table** (NEW):
```
regional_departments:
- department_id (UUID)
- department_name (text, e.g., "Riyadh Education Department")
- region_code (text, e.g., "RYD")
- geographic_boundaries (geometry/polygon)
- department_head_user_id (UUID FK)
- hierarchy_structure (JSON)
- contact_info (JSON)
- active (boolean)
```

**Asset Enhancement**:
```
assets:
- ...existing fields...
- region_id (UUID FK to regional_departments)
- external_visibility (boolean, default false)
- controlled_by_user_id (UUID, I&P user who controls visibility)
- asset_data_version (integer)
- locked_in_workflow (boolean)
- locked_by_form_id (UUID, nullable)
```

**ISNAD Form Enhancement**:
```
isnad_forms:
- ...existing fields...
- assigned_regional_dept_id (UUID FK to regional_departments)
- modification_count (integer)
- modification_history (JSON array)
- last_modified_by_dept_id (UUID)
- asset_data_snapshot (JSON, point-in-time asset data)
```

**Package Enhancement**:
```
packages:
- ...existing fields...
- created_by_dept (text, "TBC" or "I&P" - clarify)
- asset_count (integer)
- total_estimated_value (decimal, nullable)
- strategic_priority (enum: high/medium/low)
```

### Workflow Engine Configuration

**Department Assignment Logic**:
```python
def assign_reviewers(isnad_form):
    reviewers = []
    
    # Get asset region
    asset_region = isnad_form.asset.region_id
    
    # Fixed departments (always review)
    reviewers.extend([
        "school_planning_dept",
        "safety_facilities_dept",
        "investment_partnerships_dept_approver"
    ])
    
    # Regional department (based on asset location)
    regional_dept = get_regional_department_by_region(asset_region)
    reviewers.append(regional_dept.id)
    
    # Investment Agency (final department review)
    reviewers.append("investment_agency")
    
    return reviewers
```

**Modification Routing Logic**:
```python
def route_modification_request(form, requesting_dept, comments):
    # ALWAYS route to I&P form owner
    form.status = "changes_requested"
    form.requesting_dept = requesting_dept
    form.modification_comments = comments
    
    # Preserve all approvals except requesting dept
    form.preserve_approvals_except(requesting_dept)
    
    # Notify I&P form owner
    notify_form_owner(form, requesting_dept, comments)
    
    # Log modification request
    create_audit_log(form, "modification_requested", requesting_dept)
```

**Rejection Cascade**:
```python
def handle_rejection(form, rejecting_dept, reason):
    # Immediate workflow halt
    form.status = "rejected"
    form.rejected_by = rejecting_dept
    form.rejection_reason = reason
    form.rejected_at = now()
    
    # Update asset status
    form.asset.status = "available"
    form.asset.locked_in_workflow = False
    
    # Notify all stakeholders
    notify_all_departments(form, "form_rejected", rejecting_dept, reason)
    notify_form_owner(form, "rejection")
    
    # Cancel pending tasks
    cancel_pending_reviews(form)
    
    # Audit log
    create_audit_log(form, "rejected", rejecting_dept, reason)
```

### UI/UX Implementation Priorities

**Regional Department UX**:
- Auto-filter: Regional departments only see forms for their region
- Map integration: Show asset location on embedded map during review
- Regional dashboard: Stats specific to their region

**Modification Workflow UX**:
- Highlight changed sections in yellow when form resubmitted
- Show modification request comments prominently
- Version comparison view (before/after modification)

**Executive Dashboard UX** (CEO/Minister):
- High-level KPI cards
- Package summary cards (not detailed asset lists)
- Strategic indicators prioritized
- Drill-down only when needed

**SLA Visual Indicators**:
- Green: < 50% SLA elapsed
- Yellow: 50-80% SLA elapsed
- Orange: 80-100% SLA elapsed
- Red: SLA breached
- Flash/pulse animation for overdue items

### Performance Optimizations

**Regional Filtering**:
- Database indexes on `region_id` for assets and forms
- Materialized views for per-region statistics
- Cache regional department assignments

**Form Assignment**:
- Queue-based architecture for parallel department assignments
- Async notification system
- Real-time WebSocket updates for dashboard status changes

**Package Review**:
- Lazy loading for asset details in packages (summary view first, details on expand)
- PDF generation on-demand for package documentation
- Caching of asset snapshots

---

## SUCCESS METRICS (UPDATED)

### Process Efficiency
- **Avg Asset Bank approval time**: Target < 5 days (down from weeks)
- **Avg ISNAD processing time**: Target < 30 days (down from 90+ days)
- **Package approval time**: Target < 10 days (down from months)
- **SLA compliance rate**: Target > 90% across all 16+ departments

### Department Performance
- **Per-department SLA compliance**: Track each of 16 regional departments
- **Modification request rate**: Target < 15% of forms returned
- **First-pass approval rate**: Target > 70% (no modifications needed)

### System Adoption
- **Active user rate**: Target > 85% weekly login rate
- **Forms completed digitally**: Target 100% (no offline submissions)
- **Regional department adoption**: Target 100% of 16 departments onboarded

### Business Outcomes
- **Properties in Asset Bank**: Target 1,000+ properties within 6 months
- **ISNAD forms processed**: Target 3x increase in throughput
- **Investment packages approved**: Track quarterly trend
- **Time from property identification to investor offering**: Target < 90 days end-to-end

---

## PHASED IMPLEMENTATION ROADMAP (UPDATED)

### Phase 1: Asset Bank Foundation (Months 1-3)
- Asset Bank module (all screens)
- Pre-Asset to Asset workflow
- Basic user management (Contributor, Reviewers, Final Approver)
- Email notifications
- Simple dashboards

### Phase 2: ISNAD Workflow Core (Months 4-6)
- ISNAD form creation and initiation
- Department review workflows (all departments including 16 regional)
- Regional assignment logic
- Modification routing
- Rejection handling
- SLA tracking and basic notifications

### Phase 3: ISNAD Advanced + Packages (Months 7-9)
- Investment Agency review
- Package preparation module
- CEO and Minister approval workflows
- Enhanced SLA management (escalations, reminders)
- Advanced dashboards and analytics
- Cancellation workflows

### Phase 4: Optimization & Phase 2 Prep (Months 10-12)
- Performance optimization
- Advanced reporting
- Bulk operations
- User experience enhancements
- Bidding module preparation (design)
- Contract management module preparation (design)

### Phase 5: Investment Journey (Months 13-18)
- Bidding module
- Contract management module
- Investor portal (external)
- Integration with external systems
- Advanced analytics and AI insights

---

## APPENDIX: SCREEN INVENTORY CHECKLIST

This section provides a complete checklist of all screens to be designed and developed.

### Asset Bank Screens (Process 001)

**Contributor Role (School Planning)**:
1. [ ] Asset Bank - List View (Contributor)
2. [ ] Asset Registration Form - Introduction
3. [ ] Asset Registration Form - Data Entry (Create/Edit)
4. [ ] Asset Registration Form - Preview & Confirmation
5. [ ] Asset Registration - Thank You Page
6. [ ] My Submitted Assets - Dashboard
7. [ ] Draft Assets - Management View

**Reviewer Roles (Safety, I&P, MOE Oversight)**:
8. [ ] Asset Bank - List View (Reviewer Queue)
9. [ ] Asset Registration Form - Review View (Department-Specific)
10. [ ] Asset Review - Decision Form (Approve/Reject/Request Changes)
11. [ ] Asset Review - Confirmation Page
12. [ ] Reviewer Dashboard

**Final Approver Role**:
13. [ ] Asset Bank - List View (Final Approval Queue)
14. [ ] Asset Registration Form - Final Review View
15. [ ] Final Approval - Decision Form
16. [ ] Final Approval - Confirmation Page

### ISNAD Screens (Process 002)

**I&P Form Owner Role**:
17. [ ] Asset Bank - Available Assets List (I&P View)
18. [ ] ISNAD Form - Introduction
19. [ ] ISNAD Form - Initiation/Data Entry
20. [ ] ISNAD Form - Preview & Submission
21. [ ] ISNAD Form - Confirmation Page
22. [ ] ISNAD Form - Modification View (when returned)
23. [ ] My ISNAD Forms - Tracking Dashboard
24. [ ] ISNAD Form - Cancellation Dialog

**Department Approver Roles (16 Regional + Others)**:
25. [ ] Asset Bank - List View (Department Approver - Regional Filter)
26. [ ] ISNAD Form - Review View (Department-Specific Assessment)
27. [ ] ISNAD Review - Decision Form (Approve/Reject/Return for Modification)
28. [ ] ISNAD Review - Confirmation Page
29. [ ] Department Approver Dashboard
30. [ ] Modification Request - Form Dialog

**Investment Agency Role**:
31. [ ] Asset Bank - List View (Investment Agency Queue)
32. [ ] ISNAD Form - Investment Agency Review View
33. [ ] Investment Agency Review - Decision Form
34. [ ] Investment Agency Review - Confirmation Page
35. [ ] Investment Agency Dashboard

### Package Screens (Process 003)

**TBC Package Preparer Role**:
36. [ ] Investable Assets - List View
37. [ ] Asset Selection - Multi-Select Interface
38. [ ] Package Creation - Form
39. [ ] Package Preview
40. [ ] Package Creation - Confirmation
41. [ ] My Packages - Dashboard
42. [ ] Package Edit - View (for drafts)

**CEO of TBC Role**:
43. [ ] Package List - CEO View
44. [ ] Package Review - CEO View (Summary + Details)
45. [ ] Package Decision - Form (Approve/Reject)
46. [ ] Package Decision - Confirmation
47. [ ] CEO Dashboard

**Associate Minister Role**:
48. [ ] Package List - Minister View
49. [ ] Package Review - Minister View (Strategic Focus)
50. [ ] Package Decision - Form (Final Approval)
51. [ ] Package Decision - Confirmation
52. [ ] Minister Dashboard

### Admin Screens

**Platform Admin Role**:
53. [ ] Asset Bank - Full View (Admin)
54. [ ] Investable Assets - Full View (Admin)
55. [ ] All Forms - List View (Read-Only)
56. [ ] User Management - CRUD Interface
57. [ ] System Configuration - Settings
58. [ ] Audit Log - Viewer & Search
59. [ ] System Admin Dashboard
60. [ ] Cancel Form - Admin Dialog (any form)

### Shared/Common Screens
61. [ ] Login/Authentication
62. [ ] User Profile
63. [ ] Notification Center
64. [ ] Help/Documentation
65. [ ] Search (Global)
66. [ ] Reports - Generation Interface
67. [ ] Export - Data Download Interface

**Total Screen Count**: ~67 unique screens/views (excluding modal dialogs and popups)

---

## FINAL DEVELOPMENT BRIEF

**You are building a comprehensive property investment approval platform for Saudi Arabia's Ministry of Education with these critical requirements:**

### MUST-HAVE FEATURES (MVP):

1. **Asset Bank Module** with pre-approval workflow (4 reviewer roles)
2. **ISNAD Workflow Module** with support for **16 Regional Education Departments** + 5 other reviewing departments
3. **Package Management Module** with CEO and Ministerial approval
4. **Regional Assignment Logic** that auto-routes ISNAD forms to correct regional department based on asset location
5. **Modification Routing** that ALWAYS routes modification requests to I&P (form owner), never directly between departments
6. **Immediate Rejection Cascade** - single department rejection halts entire ISNAD workflow
7. **Executive No-Modification Rule** - CEO and Minister can only Approve or Reject (no "Return for Modification")
8. **SLA Management** with multi-level escalations across all 16+ reviewing departments
9. **Comprehensive Audit Logging** for all actions
10. **Role-Based Dashboards** for 15+ distinct roles
11. **Notification System** (email + in-app) for all workflow events
12. **Asset Lifecycle Management** across 3 distinct stages (Pre-Asset → Asset → Pre-Investable Asset → Investable Asset)

### KEY DIFFERENTIATORS:

- **16 Regional Education Departments**, not 7 as initially documented
- **Three-stage asset lifecycle** with different approval requirements at each stage
- **Modification requests always route to form owner** (I&P), never department-to-department
- **Regional auto-assignment** based on asset geographic location
- **Version control** for asset data at each stage
- **Visibility control** (internal vs external for investors)
- **Executive simplicity** (CEO/Minister: only Approve or Reject)

### TECHNICAL PRIORITIES:

1. Scalable workflow engine handling 16+ parallel department approvals
2. Regional filtering and assignment automation
3. Real-time dashboard updates via WebSockets
4. Comprehensive audit trail (immutable logs)
5. Queue-based notification system
6. Geographic/map integration for asset visualization
7. Version control for asset data snapshots

### SUCCESS DEFINITION:

- Process ISNAD forms in < 30 days (down from 90+ days manual)
- Achieve > 90% SLA compliance across all 16+ departments
- Handle 1,000+ assets in Asset Bank within 6 months
- Support 100+ concurrent users
- Zero data loss, complete audit trail

**This is a mission-critical system replacing paper-based processes for a national education ministry's billion-dollar investment program.**

---

*End of Enhanced Implementation Prompt v2.0*
