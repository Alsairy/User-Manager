# Madares Business Platform - Investors Portal & CRM (Phase 2)

## Project Overview
Build a comprehensive dual-facing system: an **Investor Portal** (external interface for investors to view assets, submit interests, manage profile) and an **Investor CRM** (internal tool for MOE/TBC staff to manage investor relationships, track requests, and analyze opportunities).

## Tech Stack Requirements
- **Frontend**: React.js with TypeScript
- **Backend**: Node.js with Express
- **Database**: PostgreSQL (for investor data, CRM records)
- **Authentication**: SSO Integration (Madares Platform SSO, Nafath/Yaqeen)
- **File Storage**: AWS S3 or similar (for attachments, documents)
- **Maps Integration**: Google Maps API (for asset location display)
- **UI Framework**: Material-UI or Ant Design
- **State Management**: Redux or Context API
- **Real-time Updates**: WebSocket (optional for CRM notifications)

## System Architecture

### Two Primary Interfaces:

**1. Investor Portal (External-Facing)**
- Public-facing web application for investors
- Access via SSO authentication
- View exposed assets, submit interests, manage profile
- Read-only access to own contracts
- No access to internal MOE/TBC data

**2. Investor CRM (Internal-Facing)**
- Internal dashboard for MOE/TBC staff
- Manage investor records and relationships
- Track interests, Istifada requests, contracts
- Analytics and reporting dashboards
- Full CRUD on investor data (permission-based)

## Core Features

### 1. Investor Authentication & Registration

#### SSO Integration (Madares Platform)

**Authentication Methods:**
- **Existing Users**: Log in directly with Madares Platform credentials
- **Saudi Nationals**: Nafath authentication
- **Residents/External**: Madares SSO with Yaqeen verification
- **New Users**: Registration flow creates Madares SSO account

**Authentication Flow:**
1. User clicks "Investor Login" on landing page
2. Redirects to Madares SSO login page
3. User authenticates (Nafath/Yaqeen/credentials)
4. SSO returns authentication token
5. System validates token and retrieves user identity
6. System checks/creates investor CRM record
7. User redirected to Investor Portal dashboard

**Registration Flow (New Investors):**
1. User clicks "Register as Investor"
2. Redirects to Madares SSO registration
3. User enters:
   - **Individuals**: National ID, Name, Email, Phone, Password
   - **Companies**: CR Number, Company Name, Contact Person, Email, Phone, Password
4. SSO validates and creates account
5. System receives registration callback
6. System creates investor CRM record:
   - Links SSO User ID to Investor ID
   - Sets default status: Active
   - Stores identity data
   - Creates audit log entry
7. User automatically logged in to Investor Portal

**Investor-to-CRM Mapping:**
- System maintains link between SSO User ID and Investor CRM record
- Matching priority: User ID → NID/CR → Email
- Auto-sync identity data from SSO
- Handle duplicate detection (same NID/CR/Email)

#### User Data Structure

**SSO Identity Fields (Retrieved from SSO):**
- Madares User ID (unique)
- Full Name
- National ID / CR Number (for individuals/companies)
- Email Address
- Phone Number
- Account Type (Individual / Company)
- Verification Status

**Investor CRM Fields (System-Managed):**
- Investor ID (unique, auto-generated)
- SSO User ID (link to authentication)
- Investor Type (Individual / Company)
- Company Name (if applicable)
- Contact Person (if company)
- Organization Details (optional)
- Investor Status (Active / Inactive / Blocked)
- Registration Date
- Last Login Date
- Total Interests Submitted
- Total Contracts
- CRM Notes (internal only)
- Created By / Modified By

### 2. Investor Portal Features

#### UC-I03: View Exposed Assets

**Purpose:** Display all assets marked as "Visible to Investors" in Asset Bank

**Asset Exposure Control:**
- Only assets with `visible_to_investors = TRUE` shown
- TBC/I&P controls visibility via Asset Bank toggle
- Hidden assets never accessible (even via URL manipulation)
- Visibility changes reflect immediately

**Asset List View:**
- **Layout:** Card grid or list view toggle
- **Asset Card Contents:**
  - Asset image/photo (if available)
  - Asset name
  - Location (city, district)
  - Area (square meters)
  - Property type (Land / Building)
  - Classification
  - "View Details" button
  - Favorite icon (heart)
  
**Filtering & Search:**
- **Filters:**
  - City (multi-select dropdown)
  - District (dependent on city selection)
  - Property Type (Land / Building)
  - Area Range (min/max sliders)
  - Classification (dropdown)
- **Search:**
  - Full-text search: Asset name, location
  - Search as you type
  - Clear filters button
- **Sorting:**
  - Newest first (default)
  - Name (A-Z)
  - Area (smallest/largest)
  - Location (alphabetical)

**Empty State:**
- "No assets available at the moment"
- "Check back later for investment opportunities"
- No filters applied: Show message + illustration

**Pagination:**
- 12/24/48 assets per page
- Infinite scroll option (optional)
- "Load More" button

#### UC-I04: View Asset Details

**Purpose:** Show complete information about a specific exposed asset

**Asset Detail Page Layout:**

**Section 1: Header**
- Asset name (large, prominent)
- Location breadcrumb (City > District > Area)
- Favorite button (heart icon, filled if favorited)
- Share button (optional)
- Back to assets list button

**Section 2: Image Gallery**
- Main image (large, prominently displayed)
- Thumbnail gallery (if multiple images)
- Lightbox view (click to enlarge)
- Image count indicator (e.g., "1 of 5")

**Section 3: Map Preview**
- Embedded Google Map showing asset location
- Marker on exact location
- "Open in Google Maps" link (full screen)
- Zoom controls
- Satellite/street view toggle

**Section 4: Property Information**
- **Basic Details:**
  - Property Type (Land / Building)
  - Classification (Residential/Commercial/etc.)
  - Total Area (sq meters)
  - Asset Code (reference number)
  - City / District
  
- **Features & Amenities:**
  - List of key features (e.g., utilities, access roads, zoning)
  - Icons for visual representation
  
- **Description:**
  - Detailed narrative about the asset
  - Investment potential highlights
  - Special conditions or notes
  - Formatted rich text

**Section 5: Actions**
- **Primary Actions:**
  - "Submit Investment Interest" button (prominent, primary color)
  - "Contact Us" button (secondary)
  - "Favorite" button (toggle state)
  
**Business Rules:**
- Only authenticated investors can access detail pages
- Asset must have `visible_to_investors = TRUE`
- If asset visibility toggled OFF after page load → Show "Asset no longer available"
- All asset fields are read-only for investors
- Investors cannot see internal asset data (financial, ISNAD status, etc.)

#### UC-I05: Favorite / Like Assets

**Purpose:** Allow investors to bookmark assets for easy reference

**Functionality:**
- **Favorite Action:**
  - Click heart icon on asset card or detail page
  - Icon fills with color (animated)
  - System creates favorite record: `(InvestorID, AssetID, Timestamp)`
  - Confirmation toast: "Asset added to favorites"
  
- **Unfavorite Action:**
  - Click filled heart icon
  - Icon empties (animated)
  - System removes favorite record
  - Confirmation toast: "Asset removed from favorites"

**My Favorites Page:**
- Navigate from main menu: "My Favorites"
- Display all favorited assets in grid/list
- Same card format as main asset list
- Empty state: "You haven't favorited any assets yet"
- Can unfavorite directly from this page
- Filter/sort same as main asset list

**Business Rules:**
- One favorite record per investor per asset (unique constraint)
- Favorites persist across sessions
- Favorites visible only to the investor who created them
- Internal CRM can view favorite counts and trends
- If asset becomes hidden → favorite remains but asset not accessible

**CRM Analytics (Internal):**
- Most favorited assets (top 10)
- Favorite trends over time
- Favorites by investor segment
- Assets with high favorites but no interests

#### UC-I06: Submit Investment Interest

**Purpose:** Formal submission expressing interest in a specific asset

**Interest Form:**
- **Triggered from:**
  - "Submit Interest" button on asset detail page
  - "Contact Us" redirects to interest form with asset pre-selected
  
**Form Fields:**
- **Auto-filled (from SSO):**
  - Investor Name (read-only)
  - Email (read-only)
  - Phone Number (editable)
  
- **Asset Information (pre-filled, read-only):**
  - Asset Name
  - Asset ID
  - Location
  
- **Interest Details (investor fills):**
  - Investment Purpose (dropdown):
    - Commercial Development
    - Residential Project
    - Mixed Use
    - Educational Facility
    - Healthcare Facility
    - Retail Center
    - Industrial/Warehouse
    - Other (specify)
  - Proposed Use Description (text area, 500 char min)
  - Investment Amount Range (dropdown):
    - < 1M SAR
    - 1M - 5M SAR
    - 5M - 10M SAR
    - 10M - 50M SAR
    - 50M - 100M SAR
    - > 100M SAR
  - Expected Timeline (dropdown):
    - Immediate (0-3 months)
    - Short-term (3-6 months)
    - Mid-term (6-12 months)
    - Long-term (1-2 years)
    - 2+ years
  - Additional Comments (text area, optional)
  - Attachments (optional):
    - Upload business plan, credentials, etc.
    - Accepted formats: PDF, JPG, PNG, DOCX
    - Max 5 files, 10MB each

**Form Validation:**
- All required fields must be completed
- Proposed use description minimum 500 characters
- File size and type validation
- Email format validation (if editable)

**Submission Flow:**
1. Investor fills form and clicks "Submit Interest"
2. System validates all fields
3. System checks investor status (not Blocked)
4. System checks asset visibility (still exposed)
5. System creates Interest CRM record:
   - Interest ID (auto-generated)
   - Investor ID
   - Asset ID
   - Form data (all fields)
   - Attachments (file references)
   - Timestamp
   - Status: "New"
6. System sends confirmation:
   - Success message: "Your interest has been submitted successfully"
   - Reference number displayed
   - Confirmation email (optional)
7. Investor redirected to "My Interests" page

**Duplicate Handling (Optional):**
- System can optionally check for duplicate interests
- If investor already submitted interest for same asset:
  - Show warning: "You already submitted interest for this asset"
  - Options: "View existing" or "Submit anyway"

**Post-Submission:**
- Interest appears in "My Interests" list
- Status tracking (if visibility enabled - TBD)
- CRM record created for MOE/TBC review

#### UC-I07: Submit Istifada Program Request

**Purpose:** Submit requests related to MOE's Istifada (utilization) program

**Istifada Request Page:**
- Dedicated page in Investor Portal
- Accessible from main menu: "Istifada Program"
- Explanation text about the program (what it is, eligibility)

**Request Form:**
- **Auto-filled (from SSO):**
  - Investor Name (read-only)
  - National ID / CR Number (read-only)
  - Email (read-only)
  - Phone Number (editable)
  - Company Name (if applicable, read-only)

- **Program Information:**
  - Program Type (dropdown - TBD based on MOE criteria):
    - Educational Services
    - Community Programs
    - Sports Activities
    - Cultural Events
    - Other
  - Program Title (text input, required)
  - Program Description (rich text, 1000 char min)
  - Target Beneficiaries (text area)
  - Expected Duration (start date, end date)
  - Budget Estimate (dropdown ranges or text input)
  
- **Asset Association (Optional):**
  - "Link to specific asset?" checkbox
  - If yes: Searchable dropdown of exposed assets
  - If selected: Asset ID stored with request
  
- **Required Documents:**
  - Program Proposal (PDF upload, required)
  - Financial Plan (PDF/Excel upload, required)
  - Organization Credentials (PDF upload)
  - Additional Supporting Documents (optional, multiple files)
  - File limits: PDF, JPG, PNG, DOCX, XLSX
  - Max 10 files, 10MB each

**Form Validation:**
- All required fields completed
- Minimum character counts enforced
- File types and sizes validated
- Dates logical (end date > start date)

**Submission Flow:**
1. Investor fills Istifada form
2. Uploads required documents
3. Clicks "Submit Request"
4. System validates all inputs and files
5. System creates Istifada Request record:
   - Request ID (auto-generated)
   - Investor ID
   - Asset ID (if linked)
   - Form data
   - Document references
   - Timestamp
   - Status: "New"
6. System shows confirmation:
   - Success message + request reference number
   - "Your request has been submitted for review"
7. Confirmation email sent (optional)
8. Investor redirected to "My Requests" page

**Status Tracking (TBD - awaiting MOE approval):**
- If approved: Investors can see request status
  - New → Under Review → Approved / Rejected
- If not approved: One-directional submission (no status visibility)

#### UC-I08: View My Interests (TBD Visibility)

**Purpose:** Allow investors to view history of interests submitted

**My Interests Page:**
- Navigate from menu: "My Interests"
- Display table/list of all interests investor submitted

**Table Columns:**
- Reference Number (Interest ID)
- Asset Name (linked to asset details if still exposed)
- Location (city, district)
- Submission Date
- Investment Purpose
- **Status (TBD - if visibility approved):**
  - New (blue badge)
  - Under Review (yellow badge)
  - Completed (green badge)
  - Rejected (red badge)
- Actions (View Details, Cancel - if allowed)

**Interest Details View:**
- Click on interest to see full submission
- All form data displayed
- Attachments downloadable
- Status history (if tracking enabled)
- Internal notes (if shared with investor - TBD)

**Filtering & Search:**
- Filter by status (if visible)
- Filter by date range
- Search by asset name or reference number
- Sort by submission date (newest/oldest)

**Empty State:**
- "You haven't submitted any interests yet"
- Button: "Explore Available Assets"

**Business Rules:**
- Investors see only their own interests
- Cannot edit submitted interests
- May be able to cancel pending interests (TBD)
- Interests remain visible even if asset becomes hidden

#### UC-I09: View My Istifada Requests (TBD Visibility)

**Purpose:** Track submitted Istifada program requests

**My Requests Page:**
- Navigate from menu: "My Istifada Requests"
- Similar layout to My Interests

**Table Columns:**
- Request Reference Number
- Program Title
- Asset (if linked)
- Submission Date
- Program Type
- **Status (TBD):**
  - New
  - Under Review
  - Additional Info Required
  - Approved
  - Rejected
- Actions (View Details)

**Request Details View:**
- Full request information
- All uploaded documents (downloadable)
- Status timeline (if tracking enabled)
- Communication thread (if MOE requests additional info)

**Empty State:**
- "You haven't submitted any Istifada requests"
- Button: "Submit New Request"

#### UC-I10: View My Contracts

**Purpose:** Allow investors to view and download their signed contracts

**My Contracts Page:**
- Navigate from menu: "My Contracts"
- Display all contracts linked to investor

**Contract List:**
- **Table Columns:**
  - Contract ID
  - Asset Name
  - Asset Location
  - Contract Start Date
  - Contract End Date
  - Contract Status (Active / Expired / Cancelled)
  - Actions (View Details, Download PDF)

**Contract Details View:**
- Click contract to see:
  - Full contract metadata
  - Asset details
  - Financial information (if shared)
  - Key dates
  - Contract terms summary
  - Download PDF button (prominent)

**PDF Download:**
- "Download Contract PDF" button
- System validates:
  - Investor owns this contract
  - Investor authenticated
  - PDF file exists
- Serves signed contract PDF
- Audit log records download

**Empty State:**
- "You don't have any contracts yet"
- "Contracts will appear here once finalized"

**Business Rules:**
- Investors see only contracts where they are the investor
- Contracts are read-only (no editing)
- All active contracts must have signed PDF
- Downloads are audited
- Cannot access other investors' contracts (strict security)

#### UC-I11: View/Edit Investor Profile (TBD Editing Rules)

**Purpose:** Allow investors to view and potentially edit their profile

**My Profile Page:**
- Navigate from menu: "My Profile" or profile icon

**Profile Sections:**

**1. Personal Information**
- Full Name (from SSO, read-only)
- National ID / CR Number (from SSO, read-only)
- Email (from SSO, may be editable in SSO)
- Phone Number (editable in CRM)
- Date of Birth (optional, editable)
- Nationality (optional, editable)

**2. Organization Information (if company)**
- Company Name (from SSO, read-only)
- CR Number (from SSO, read-only)
- Contact Person (editable)
- Job Title (editable)
- Company Address (editable)
- Company Type (editable)
- Number of Employees (optional, editable)

**3. Account Settings**
- Email Notifications (toggle on/off)
- SMS Notifications (toggle on/off)
- Language Preference (Arabic / English)
- Timezone

**4. Activity Summary (Read-only)**
- Member Since (registration date)
- Total Interests Submitted
- Total Contracts
- Total Favorites
- Last Login Date

**Editing Flow (if enabled):**
1. Click "Edit Profile" button
2. Editable fields become active
3. Make changes
4. Click "Save Changes"
5. System validates inputs
6. Updates CRM record
7. Shows success message
8. Audit log records changes

**Editing Rules (TBD by MOE):**
- Option 1: Full read-only (all changes via SSO)
- Option 2: Limited editing (phone, address, preferences only)
- Option 3: Full editing with approval workflow
- Identity fields (name, ID) always read-only

**Password Change:**
- "Change Password" button
- Redirects to Madares SSO password change
- Returns to profile after successful change

### 3. Investor CRM (Internal)

#### CRM Overview

**Purpose:** Central hub for MOE/TBC staff to manage all investor relationships

**CRM Dashboard (Home Page):**

**Key Metrics (KPI Cards):**
- Total Investors (count)
- Active Investors (status = Active)
- New Investors This Month
- Total Active Contracts
- Pending Interests (status = New/Under Review)
- Pending Istifada Requests
- Total Contract Value (sum of all contracts)
- High-Interest Assets (most favorited)

**Charts & Visualizations:**
- Investors by Type (Individual vs Company) - Pie chart
- Interests by Month - Line chart
- Top 10 Most Interested Assets - Bar chart
- Interests by Investment Purpose - Donut chart
- Investor Registration Trend - Line chart
- Geographic Distribution (Investors by City) - Map

**Recent Activity Feed:**
- New investor registrations (last 10)
- Recent interest submissions
- Recent Istifada requests
- Contract signings
- Timestamp for each activity
- Link to detail view

**Quick Actions:**
- Add New Investor (manual creation)
- View All Interests
- View All Requests
- Generate Report
- Export Data

#### UC-C01: View All Investors (CRM List)

**Investors List Page:**

**Table View:**
- **Columns:**
  - Investor ID
  - Name (click to open detail)
  - Type (Individual / Company)
  - Email
  - Phone
  - Registration Date
  - Status (Active / Inactive / Blocked)
  - Total Interests
  - Total Contracts
  - Last Login
  - Actions (View / Edit / Block)

**Filtering:**
- Status (Active / Inactive / Blocked)
- Type (Individual / Company)
- Registration Date Range
- Has Contracts (Yes / No)
- Has Interests (Yes / No)
- Search (name, email, ID)

**Sorting:**
- Name (A-Z, Z-A)
- Registration Date (newest/oldest)
- Last Login (recent/oldest)
- Total Interests (high/low)
- Total Contracts (high/low)

**Bulk Actions:**
- Select multiple investors
- Change status (Active/Inactive)
- Export selected
- Send notification (future)

**Pagination:**
- 25/50/100 per page
- Page navigation
- Total count display

#### UC-C02: View Investor Details (CRM)

**Investor Detail Page:**

**Layout: Tabbed Interface**

**Tab 1: Overview**
- **Identity Information:**
  - Full Name
  - National ID / CR Number
  - Email, Phone
  - Type (Individual / Company)
  - Company details (if applicable)
  
- **Account Status:**
  - Current Status (badge)
  - Registration Date
  - Last Login Date
  - Last Activity
  
- **Statistics:**
  - Total Interests Submitted
  - Interests Approved
  - Interests Rejected
  - Total Contracts
  - Active Contracts
  - Total Contract Value
  - Total Favorites
  
- **CRM Notes:**
  - Internal notes field (rich text editor)
  - Notes history (who added, when)
  - Not visible to investor

**Tab 2: Interests**
- List all investment interests submitted
- Same columns as interests list
- Filter by status, date, asset
- Click to view full interest details
- Ability to update status
- Add internal notes to interest

**Tab 3: Istifada Requests**
- List all Istifada requests
- Same columns as requests list
- View full request details
- Update request status
- Download attachments
- Add internal notes

**Tab 4: Contracts**
- List all contracts linked to investor
- Contract details: ID, Asset, Dates, Amount, Status
- Link to Contract Management module
- View/download contract PDF
- Quick stats: Total value, Active count

**Tab 5: Favorites**
- List all assets favorited by investor
- Asset details: Name, Location, Date favorited
- Analyze favorite patterns
- "Assets of Interest" insights

**Tab 6: Activity Log**
- Complete audit trail of investor actions
- Logins, submissions, downloads, profile changes
- Timestamp, action type, details
- Filterable by date range and action type

**Tab 7: Communications (Future)**
- Email history
- SMS history
- Notification log
- Compose new message

**Actions (Top Bar):**
- Edit Investor Details
- Change Status (Active/Inactive/Blocked)
- Send Notification
- Generate Investor Report
- Export Data
- Delete Investor (soft delete, admin only)

#### UC-C03: Manage Investor Status

**Status Types:**
1. **Active**: Normal access to Investor Portal
2. **Inactive**: Cannot log in, but data preserved (temporary suspension)
3. **Blocked**: Permanent ban, cannot log in or submit

**Change Status Flow:**
1. Open investor detail page
2. Click "Change Status" button
3. Select new status (dropdown)
4. Enter reason (mandatory for Inactive/Blocked)
5. Confirm action
6. System:
   - Updates investor status
   - Records in audit log
   - If Blocked/Inactive: Terminates active sessions
   - If Blocked: Prevents future logins
7. Success message shown

**Business Rules:**
- Blocked investors cannot log in
- Inactive investors may or may not log in (TBD)
- Status changes require justification
- Only authorized CRM users can change status
- All status changes audited

#### UC-C04: View & Manage Investment Interests (CRM)

**Interests Management Page:**

**Table View:**
- **Columns:**
  - Interest ID
  - Investor Name (link to investor detail)
  - Asset Name (link to asset detail)
  - Location
  - Investment Purpose
  - Proposed Amount Range
  - Submission Date
  - Status (New / Under Review / Approved / Rejected)
  - Assigned To (TBD - assignment workflow)
  - Actions (View / Update Status / Assign)

**Filtering:**
- Status (all/new/review/approved/rejected)
- Date Range
- Asset
- Investor
- Investment Purpose
- Amount Range

**Status Management:**
- **Available Statuses:**
  - New (default on submission)
  - Under Review (assigned for evaluation)
  - Additional Info Required
  - Approved (opportunity viable)
  - Rejected (not suitable)
  - Completed (contract signed)
  
- **Update Status Flow:**
  1. Select interest(s)
  2. Click "Update Status"
  3. Choose new status
  4. Add notes (mandatory for certain transitions)
  5. Save
  6. System updates status
  7. If visibility enabled: Investor sees new status
  8. Audit log records change

**Interest Detail View:**
- Full submission details
- All investor-provided information
- Attachments (download/view)
- Asset information snapshot
- Internal notes section (not visible to investor)
- Status history timeline
- Assignment history (if workflow enabled)
- Related communications

**Internal Actions:**
- Add Internal Note
- Attach Document
- Assign to Team Member (TBD)
- Update Status
- Flag for Priority
- Contact Investor (email/phone)
- Convert to Contract (links to Contract Management)

#### UC-C05: View & Manage Istifada Requests (CRM)

**Requests Management Page:**

**Similar structure to Interests Management:**
- Table with all Istifada requests
- Columns: Request ID, Investor, Program Title, Type, Date, Status
- Filtering by status, date, investor, type
- Sorting capabilities

**Request Detail View:**
- Complete program information
- All uploaded documents
- Asset linkage (if any)
- Internal evaluation notes
- Status management
- Assignment workflow (TBD)

**Status Options:**
- New
- Under Review
- Additional Info Required
- Approved
- Rejected
- On Hold

**CRM Actions:**
- Evaluate Request
- Request Additional Information (sends to investor)
- Approve/Reject
- Add Notes
- Attach Evaluation Documents
- Link to Contract (if approved and leads to contract)

#### UC-C06: Analytics & Reporting

**Pre-built Reports:**

1. **Investor Overview Report**
   - Total investors by type
   - Registration trends
   - Active vs Inactive breakdown
   - Geographic distribution

2. **Investment Interest Report**
   - Interests by status
   - Interests by asset
   - Interests by purpose
   - Conversion rate (interests → contracts)
   - Average response time

3. **Asset Demand Report**
   - Most viewed assets
   - Most favorited assets
   - Assets with most interests
   - Geographic demand patterns

4. **Contract Pipeline Report**
   - Pending interests
   - Expected contract value
   - Conversion funnel
   - Time to contract

5. **Istifada Program Report**
   - Requests by type
   - Approval rate
   - Program impact analysis

**Report Generation:**
- Select report type
- Choose date range
- Apply filters
- Preview results
- Export to PDF/Excel
- Schedule recurring reports (optional)

**Custom Reports:**
- Report builder interface
- Select metrics and dimensions
- Create custom visualizations
- Save report templates
- Share with team

**Export Options:**
- PDF (formatted report)
- Excel (raw data)
- CSV (for further analysis)

#### UC-C07: Search & Filter (CRM)

**Global Search:**
- Search bar in CRM header
- Search across:
  - Investors (name, email, ID)
  - Interests (asset, investor, reference)
  - Requests (title, investor, reference)
  - Contracts (ID, investor, asset)
- Results grouped by entity type
- Click result to open detail

**Advanced Filters (per module):**
- Multiple filter criteria
- Save filter presets
- Quick filter buttons
- Clear all filters
- Filter results count

### 4. Data Model & Database Schema

#### Investors Table
```sql
CREATE TABLE investors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id VARCHAR(50) UNIQUE NOT NULL, -- INV-YYYY-###
  
  -- SSO Link
  sso_user_id VARCHAR(255) UNIQUE NOT NULL,
  
  -- Identity (from SSO)
  full_name VARCHAR(255) NOT NULL,
  national_id_or_cr VARCHAR(50) UNIQUE, -- NID for individuals, CR for companies
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  
  -- Investor Type
  investor_type VARCHAR(20) NOT NULL, -- Individual, Company
  
  -- Company Info (if applicable)
  company_name VARCHAR(255),
  company_type VARCHAR(100),
  contact_person VARCHAR(255),
  job_title VARCHAR(100),
  company_address TEXT,
  number_of_employees INTEGER,
  
  -- Additional Info
  date_of_birth DATE,
  nationality VARCHAR(100),
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'Active', -- Active, Inactive, Blocked
  status_reason TEXT, -- Why inactive/blocked
  
  -- Preferences
  email_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT TRUE,
  language_preference VARCHAR(10) DEFAULT 'en', -- en, ar
  
  -- Statistics (computed/cached)
  total_interests INTEGER DEFAULT 0,
  total_contracts INTEGER DEFAULT 0,
  total_favorites INTEGER DEFAULT 0,
  
  -- CRM Notes
  internal_notes TEXT, -- Rich text, not visible to investor
  
  -- Timestamps
  registration_date TIMESTAMP DEFAULT NOW(),
  last_login_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  
  CONSTRAINT check_investor_type CHECK (investor_type IN ('Individual', 'Company')),
  CONSTRAINT check_status CHECK (status IN ('Active', 'Inactive', 'Blocked'))
);

CREATE INDEX idx_investors_sso_user ON investors(sso_user_id);
CREATE INDEX idx_investors_email ON investors(email);
CREATE INDEX idx_investors_national_id ON investors(national_id_or_cr);
CREATE INDEX idx_investors_status ON investors(status);
CREATE INDEX idx_investors_type ON investors(investor_type);
CREATE INDEX idx_investors_registration_date ON investors(registration_date);
```

#### Investment Interests Table
```sql
CREATE TABLE investment_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interest_id VARCHAR(50) UNIQUE NOT NULL, -- INT-YYYY-###
  
  -- Links
  investor_id UUID REFERENCES investors(id) NOT NULL,
  asset_id UUID REFERENCES assets(id) NOT NULL,
  
  -- Interest Details
  investment_purpose VARCHAR(100) NOT NULL,
  proposed_use_description TEXT NOT NULL, -- Min 500 chars
  investment_amount_range VARCHAR(50),
  expected_timeline VARCHAR(50),
  additional_comments TEXT,
  
  -- Attachments
  attachments JSONB, -- Array of file references
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'New',
  -- New, Under Review, Additional Info Required, Approved, Rejected, Completed
  status_reason TEXT,
  
  -- Assignment (TBD)
  assigned_to UUID REFERENCES users(id),
  assigned_at TIMESTAMP,
  
  -- Internal CRM
  internal_notes TEXT,
  priority_flag BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  submitted_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

CREATE INDEX idx_interests_investor ON investment_interests(investor_id);
CREATE INDEX idx_interests_asset ON investment_interests(asset_id);
CREATE INDEX idx_interests_status ON investment_interests(status);
CREATE INDEX idx_interests_submitted_date ON investment_interests(submitted_at);
CREATE INDEX idx_interests_assigned ON investment_interests(assigned_to);
```

#### Istifada Requests Table
```sql
CREATE TABLE istifada_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id VARCHAR(50) UNIQUE NOT NULL, -- IST-YYYY-###
  
  -- Links
  investor_id UUID REFERENCES investors(id) NOT NULL,
  asset_id UUID REFERENCES assets(id), -- Optional link to asset
  
  -- Program Details
  program_type VARCHAR(100) NOT NULL,
  program_title VARCHAR(255) NOT NULL,
  program_description TEXT NOT NULL, -- Min 1000 chars
  target_beneficiaries TEXT,
  start_date DATE,
  end_date DATE,
  budget_estimate VARCHAR(50),
  
  -- Documents
  documents JSONB NOT NULL, -- Required: proposal, financial plan, credentials
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'New',
  -- New, Under Review, Additional Info Required, Approved, Rejected, On Hold
  status_reason TEXT,
  
  -- Assignment
  assigned_to UUID REFERENCES users(id),
  assigned_at TIMESTAMP,
  
  -- Internal CRM
  internal_notes TEXT,
  evaluation_score INTEGER, -- 1-10 scale
  
  -- Timestamps
  submitted_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

CREATE INDEX idx_istifada_investor ON istifada_requests(investor_id);
CREATE INDEX idx_istifada_asset ON istifada_requests(asset_id);
CREATE INDEX idx_istifada_status ON istifada_requests(status);
CREATE INDEX idx_istifada_submitted ON istifada_requests(submitted_at);
```

#### Favorites Table
```sql
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  investor_id UUID REFERENCES investors(id) NOT NULL,
  asset_id UUID REFERENCES assets(id) NOT NULL,
  
  favorited_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(investor_id, asset_id)
);

CREATE INDEX idx_favorites_investor ON favorites(investor_id);
CREATE INDEX idx_favorites_asset ON favorites(asset_id);
CREATE INDEX idx_favorites_date ON favorites(favorited_at);
```

#### Investor-Contract Link Table
```sql
CREATE TABLE investor_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  investor_id UUID REFERENCES investors(id) NOT NULL,
  contract_id UUID REFERENCES contracts(id) NOT NULL,
  
  linked_at TIMESTAMP DEFAULT NOW(),
  linked_by UUID REFERENCES users(id),
  
  UNIQUE(investor_id, contract_id)
);

CREATE INDEX idx_investor_contracts_investor ON investor_contracts(investor_id);
CREATE INDEX idx_investor_contracts_contract ON investor_contracts(contract_id);
```

#### Interest Status History Table
```sql
CREATE TABLE interest_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  interest_id UUID REFERENCES investment_interests(id) NOT NULL,
  
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  status_reason TEXT,
  
  changed_by UUID REFERENCES users(id) NOT NULL,
  changed_at TIMESTAMP DEFAULT NOW(),
  
  notes TEXT
);

CREATE INDEX idx_interest_status_history ON interest_status_history(interest_id);
CREATE INDEX idx_interest_status_date ON interest_status_history(changed_at);
```

#### Audit Logs Table (Extended for Investors)
```sql
-- Extend existing audit_logs table with investor-specific actions
-- Actions: investor_registered, investor_login, interest_submitted, 
--          istifada_submitted, asset_favorited, contract_downloaded, 
--          investor_status_changed, interest_status_updated, etc.
```

### 5. API Endpoints

#### Authentication & Registration
- `POST /api/auth/sso/callback` - Handle SSO authentication callback
- `POST /api/auth/sso/register` - Handle SSO registration callback
- `POST /api/auth/logout` - Logout investor
- `GET /api/auth/session` - Validate session

#### Investor Portal APIs
- `GET /api/portal/assets` - List exposed assets (for investors)
- `GET /api/portal/assets/:id` - Get asset details (if exposed)
- `POST /api/portal/favorites` - Add asset to favorites
- `DELETE /api/portal/favorites/:assetId` - Remove from favorites
- `GET /api/portal/favorites` - List my favorites
- `POST /api/portal/interests` - Submit investment interest
- `GET /api/portal/interests` - List my interests
- `GET /api/portal/interests/:id` - Get interest details
- `POST /api/portal/istifada` - Submit Istifada request
- `GET /api/portal/istifada` - List my requests
- `GET /api/portal/istifada/:id` - Get request details
- `GET /api/portal/contracts` - List my contracts
- `GET /api/portal/contracts/:id` - Get contract details
- `GET /api/portal/contracts/:id/pdf` - Download contract PDF
- `GET /api/portal/profile` - Get my profile
- `PUT /api/portal/profile` - Update my profile
- `POST /api/portal/documents/upload` - Upload attachment

#### Investor CRM APIs
- `GET /api/crm/investors` - List all investors (with filters)
- `POST /api/crm/investors` - Create investor manually
- `GET /api/crm/investors/:id` - Get investor details
- `PUT /api/crm/investors/:id` - Update investor
- `PUT /api/crm/investors/:id/status` - Change investor status
- `DELETE /api/crm/investors/:id` - Soft delete investor
- `GET /api/crm/interests` - List all interests (with filters)
- `GET /api/crm/interests/:id` - Get interest details
- `PUT /api/crm/interests/:id/status` - Update interest status
- `POST /api/crm/interests/:id/notes` - Add internal note
- `PUT /api/crm/interests/:id/assign` - Assign to team member
- `GET /api/crm/istifada` - List all Istifada requests
- `GET /api/crm/istifada/:id` - Get request details
- `PUT /api/crm/istifada/:id/status` - Update request status
- `POST /api/crm/istifada/:id/notes` - Add internal note
- `GET /api/crm/dashboard/stats` - Get dashboard KPIs
- `GET /api/crm/dashboard/charts` - Get chart data
- `GET /api/crm/reports/:type` - Generate report
- `POST /api/crm/reports/custom` - Generate custom report
- `GET /api/crm/search` - Global search

#### Analytics APIs
- `GET /api/analytics/assets/popular` - Most favorited/viewed assets
- `GET /api/analytics/interests/trends` - Interest trends over time
- `GET /api/analytics/investors/stats` - Investor statistics
- `GET /api/analytics/conversion` - Interest to contract conversion

### 6. Integration Points

**Asset Bank Integration:**
- Read-only access to assets with `visible_to_investors = TRUE`
- Asset detail data for display in portal
- Visibility toggle controlled in Asset Bank
- Real-time sync of visibility status

**Contract Management Integration:**
- Link contracts to investors via investor_id
- Display contract list in investor portal
- Provide contract PDF download
- Contract metadata for CRM display

**User Management Integration:**
- SSO authentication shared with main platform
- Role-based access (Investor Portal role)
- CRM access for MOE/TBC users
- Permission checks on all operations

**File Storage (AWS S3):**
- Interest attachments
- Istifada request documents
- Contract PDFs
- Investor profile documents (optional)

**Email Service (Optional):**
- Interest submission confirmation
- Istifada request confirmation
- Status change notifications
- Welcome emails for new investors

**Maps Integration (Google Maps):**
- Display asset locations
- Embedded maps in asset details
- Full-screen map view

### 7. Security & Privacy

**Authentication Security:**
- SSO integration with Madares Platform
- JWT token-based sessions
- Token expiration and refresh
- Secure token storage

**Authorization:**
- Role-based access control
- Investors can only access:
  - Exposed assets
  - Own profile
  - Own interests/requests
  - Own contracts
- CRM users permission-based access
- No cross-investor data access

**Data Privacy:**
- Personal data encrypted at rest
- Sensitive fields (NID, CR) hashed
- Audit logging for all data access
- GDPR/PDPA compliance considerations

**API Security:**
- Rate limiting (100 req/min per user)
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF token validation
- File upload security (type, size, virus scan)

**Session Management:**
- Secure session storage
- Session timeout (30 minutes)
- Concurrent session handling
- Logout on status change (Blocked/Inactive)

### 8. User Experience

#### Investor Portal UI/UX

**Landing Page (Before Login):**
- Hero section with value proposition
- "Login" and "Register" buttons prominent
- Asset showcase (preview of available opportunities)
- About the program
- FAQ section
- Contact information

**Dashboard (After Login):**
- Welcome message with investor name
- Quick stats: Contracts, Interests, Favorites
- Recent activity timeline
- Featured assets (personalized recommendations)
- Quick actions: Browse Assets, Submit Interest, View Contracts
- Notifications panel (if notifications enabled)

**Navigation:**
- Top bar: Logo, Search, Profile menu
- Main menu:
  - Dashboard
  - Educational Lands
  - Educational Buildings
  - My Interests
  - My Istifada Requests
  - My Contracts
  - My Favorites
  - My Profile
  - Help & Support

**Responsive Design:**
- Desktop: Full layout with sidebar
- Tablet: Collapsible sidebar
- Mobile: Bottom navigation, swipeable cards

#### CRM UI/UX

**CRM Dashboard Layout:**
- Left sidebar: Module navigation
- Top bar: Search, notifications, user menu
- Main area: Dashboard widgets
- Widgets draggable/resizable
- Save dashboard configuration

**List Views:**
- Data tables with sorting
- Advanced filtering
- Bulk selection
- Quick actions
- Pagination
- Export options

**Detail Views:**
- Tabbed interface
- Context-aware actions
- Inline editing where appropriate
- Activity timeline
- Related records

**Color Scheme:**
- Status badges: New (blue), Review (yellow), Approved (green), Rejected (red)
- Priority flags: High (red), Medium (orange), Low (gray)
- Consistent with main Madares platform

### 9. Business Rules

**BR-01: SSO Authentication**
- All investors must authenticate via Madares SSO
- No local authentication allowed
- Session tied to SSO token

**BR-02: Asset Visibility**
- Only assets with `visible_to_investors = TRUE` shown to investors
- Visibility controlled exclusively by TBC/I&P
- Hidden assets never accessible (even via direct URL)

**BR-03: Portal Permissions**
- Investors have read-only access to exposed assets
- Can submit interests/requests
- Can view own contracts (with PDF download)
- Cannot access internal MOE/TBC modules

**BR-04: Interest Submissions**
- Stored as structured CRM records
- Email-based submissions eliminated
- Each interest links to investor and asset
- Minimum field requirements enforced

**BR-05: Istifada Requests**
- Stored as CRM entities with unique ID
- Required documents mandatory
- Optional asset linkage
- Status visibility TBD

**BR-06: Investor-Contract Linking**
- CRM must link investors to contracts
- Investors see only own contracts
- Contract PDF download secured
- All downloads audited

**BR-07: SSO Data Sync**
- Identity fields sync with Madares SSO
- Editing rules in portal TBD
- CRM updates on SSO changes
- Name, NID/CR always from SSO (read-only)

**BR-08: Investor Status**
- Active: Full portal access
- Inactive: Login may be blocked (TBD)
- Blocked: Cannot login, all access denied
- Status changes audited

**BR-09: Favorites**
- Stored with investor ID, asset ID, timestamp
- Investors view own favorites
- MOE/TBC can analyze favorite trends
- One favorite per investor per asset

**BR-10: CRM as Source of Truth**
- Authoritative source for investor business data
- All interests, requests, contracts, favorites
- Audit records preserved
- No data deletion (soft delete only)

**BR-11: Internal User Permissions**
- Permission-based CRM access
- View/edit/delete by role
- Audit all CRM operations
- Investor portal access isolated

**BR-12: Audit Logging**
- Log investor logins, submissions, downloads
- Log CRM edits and status changes
- Immutable audit trail
- User ID, timestamp, action, record ID

**BR-13: Request Status Visibility (TBD)**
- If approved: Investors see status of interests/requests
- If not approved: One-directional submission (no visibility)
- Requires MOE confirmation

**BR-14: Duplicate Prevention**
- Prevent duplicate investor accounts
- Check NID/CR, Email uniqueness
- Show warning if attempting duplicate
- Link existing records if found

### 10. Testing Strategy

**Unit Tests:**
- SSO authentication flow
- Investor CRM record creation
- Interest submission validation
- Asset visibility filtering
- Favorite add/remove logic
- Status change workflows

**Integration Tests:**
- SSO callback handling
- Asset Bank integration (visibility)
- Contract Management integration (linking)
- File upload to storage
- PDF download security

**E2E Tests:**
- Complete investor registration flow
- Browse and view assets
- Submit investment interest
- Submit Istifada request
- View and download contract
- CRM user manages investor
- Status change workflow

**Security Tests:**
- Authorization checks (access control)
- Session security
- SQL injection attempts
- XSS vulnerability scans
- File upload exploits
- Direct URL manipulation (hidden assets)

### 11. Success Metrics

**Investor Portal:**
- Investor registrations per month
- Active investors (logged in last 30 days)
- Asset views per visitor
- Interests submitted per month
- Interest to contract conversion rate
- Average time to submit interest
- User satisfaction (survey)

**CRM:**
- Average interest response time
- Approval rate (interests)
- CRM user adoption (% of staff using)
- Data quality (% complete records)
- Search usage and performance

**System Performance:**
- Page load time < 2 seconds
- API response time < 500ms
- SSO login time < 3 seconds
- PDF download time < 5 seconds
- System uptime > 99.5%

## Getting Started with Replit

**Setup Steps:**

1. **Create Replit Project:**
   - Template: Full Stack (Node.js + React)

2. **Install Dependencies:**
```bash
# Backend
npm install express pg cors jsonwebtoken bcrypt dotenv
npm install multer aws-sdk passport passport-oauth2
npm install winston

# Frontend
cd client
npm install react react-dom typescript
npm install @mui/material @emotion/react @emotion/styled
npm install axios react-router-dom redux @reduxjs/toolkit
npm install recharts date-fns react-google-maps
```

3. **Database Setup:**
   - Add PostgreSQL addon
   - Run schema migrations
   - Seed initial data (asset visibility flags, status types)

4. **Environment Variables:**
```
DATABASE_URL=<from replit>
JWT_SECRET=<generate>
SSO_CLIENT_ID=<from Madares SSO>
SSO_CLIENT_SECRET=<from Madares SSO>
SSO_CALLBACK_URL=<your app URL>/api/auth/sso/callback
AWS_ACCESS_KEY=<for S3>
AWS_SECRET_KEY=<for S3>
AWS_S3_BUCKET=<bucket name>
GOOGLE_MAPS_API_KEY=<for maps>
NODE_ENV=development
```

5. **SSO Integration:**
   - Configure OAuth2 with Madares Platform
   - Set up redirect URIs
   - Test authentication flow

6. **Run Application:**
```bash
npm run dev
```

## Questions to Clarify (TBD Items)

1. **Profile Editing:** What fields can investors edit in their profile?
2. **Request Status Visibility:** Can investors see status of interests/Istifada requests?
3. **Inactive Status:** Can Inactive investors log in (read-only) or blocked completely?
4. **Assignment Workflow:** Should interests/requests be assignable to specific team members?
5. **Notifications:** Email/SMS notifications for status changes?
6. **Individual vs Company:** Support both or company-only?
7. **Duplicate Interests:** Block duplicate interests for same asset or allow?
8. **Communication:** In-portal messaging between investors and MOE/TBC?
9. **Document Sharing:** Can CRM users upload documents visible to investors?
10. **Reporting:** Specific KPIs required for executive dashboard?

---

**Version:** 1.0  
**Last Updated:** Based on BRD dated 09.12.2025  
**Status:** Ready for development - Phase 2 Investors Module

**Next Steps:**
1. Clarify TBD items with MOE/TBC stakeholders
2. Review and approve specifications
3. Design mockups and user flows
4. Set up SSO integration with Madares Platform
5. Begin sprint planning
