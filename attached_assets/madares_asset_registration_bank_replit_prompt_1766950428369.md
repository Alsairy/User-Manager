# Madares Business Platform - Assets Registration & Asset Bank

## Project Overview
Build a comprehensive dual-module system for managing MOE (Ministry of Education) land and building assets. The system consists of **Asset Registration** (workflow-based digitization with multi-department approvals) and **Asset Bank** (centralized repository and source of truth for all completed assets).

## Tech Stack Requirements
- **Frontend**: React.js with TypeScript
- **Backend**: Node.js with Express
- **Database**: PostgreSQL (for asset data, workflow states)
- **Maps Integration**: Google Maps API or similar GIS service (for location validation)
- **File Storage**: AWS S3 or similar (for documents, ownership files)
- **Workflow Engine**: Custom or BPM.js (for approval routing)
- **UI Framework**: Material-UI or Ant Design
- **State Management**: Redux or Context API
- **Excel Processing**: ExcelJS (for bulk upload/export)

## System Architecture

### Two Primary Modules:

**1. Asset Registration Module**
- Multi-step form for asset digitization
- Two registration modes: Direct Registration (no approval) and Approval Cycle (5-department review)
- Draft saving and editing
- Map validation with nearby asset detection
- Bulk upload capability
- Department-specific review queues

**2. Asset Bank Module**
- Central repository of all completed assets
- Read-only view with filtering and search
- Visibility toggle for investor exposure
- Visibility history tracking
- Map view (admin only)
- ISNAD workflow initiation
- Asset lifecycle history

## Core Features

### 1. Asset Registration - Two Registration Modes

#### Mode 1: Direct Registration (Permission-Based)

**Purpose:** Allows authorized users to register assets directly without approval workflow

**Who Can Use:**
- Users with "Direct Registration" permission
- Bypasses all department reviews
- Asset moves directly to Asset Bank with status "Completed"

**Flow:**
1. User creates asset registration
2. Completes all required fields
3. Performs map validation
4. Clicks "Submit"
5. System validates
6. Asset status = "Completed"
7. Asset appears in Asset Bank immediately
8. "Verified By" field remains empty

**Use Cases:**
- Digitizing existing assets from Excel
- Bulk migration of historical data
- Admin-level asset creation

#### Mode 2: Approval Cycle Registration

**Purpose:** Multi-department verification for new assets requiring validation

**Workflow Stages:**
1. **School Planning** (Department Reviewer)
2. **Facilities & Security** (Department Reviewer)
3. **Investment & Partnerships (I&P)** (Department Reviewer)
4. **Investment Agency (MOE)** (Department Reviewer)
5. **TBC Asset Approver** (Final Approver)

**Flow:**
1. Asset Creator submits registration (status: "Draft" → "In Review")
2. System routes to School Planning
3. School Planning reviews assigned sections → Approve/Reject
4. If approved → Routes to Facilities & Security
5. Facilities & Security reviews → Approve/Reject
6. If approved → Routes to I&P
7. I&P reviews → Approve/Reject
8. If approved → Routes to Investment Agency
9. Investment Agency reviews → Approve/Reject
10. If approved → Routes to TBC Asset Approver
11. TBC approves → Asset status = "Completed", moves to Asset Bank
12. "Verified By" populated with approvers from each stage

**Actions Available:**
- **Approve**: Move to next stage
- **Reject**: Stop workflow, asset status = "Rejected", cannot be reopened
- **NO Return for Modification** (explicitly stated in BRD)

**Business Rules:**
- Each department can edit only their assigned sections
- Cannot change fields owned by other departments
- All rejections require mandatory reason
- TBC can only Approve or Reject (no return option)
- Rejected assets cannot be reopened (must create new registration)

### 2. Asset Registration Form Structure

#### Section 1: Basic Information
- **Asset Name** (Arabic & English)
  - Validation: Letters and spaces only
  - Duplicate check within same district
- **Asset Type** (Dropdown)
  - Land
  - Building
- **Asset Code** (Auto-generated or manual)
- **Region** (Dropdown)
  - Options: TBD based on Saudi regions
- **City** (Dropdown, dependent on Region)
- **District** (Dropdown, dependent on City)
- **Neighborhood** (Optional text)

#### Section 2: Location & Coordinates
- **Street Address** (Text area)
- **Latitude** (Decimal, enabled after District selected)
- **Longitude** (Decimal, enabled after District selected)
- **Map Validation** (Interactive, mandatory)
  - Click "Validate Location" button
  - Opens interactive map centered on coordinates
  - Shows nearby assets (within 200-500m radius, TBD)
  - Only shows assets in same district
  - User confirms location is correct
  - If nearby assets detected → Mandatory justification field appears
  - User must provide reason before submission
- **Coordinate Accuracy Validation**
  - Rejects invalid lat/long
  - Rejects out-of-range coordinates
  - Ensures coordinates within Saudi Arabia bounds

#### Section 3: Property Details
- **Total Area** (Number, in square meters)
- **Built-up Area** (Number, optional for buildings)
- **Land Use Type** (Dropdown)
  - Residential
  - Commercial
  - Mixed Use
  - Educational
  - Industrial
  - Vacant Land
  - Other
- **Zoning Classification** (Text)
- **Current Status** (Dropdown)
  - Available
  - Occupied
  - Under Development
  - Reserved
  
#### Section 4: Ownership & Documentation
- **Ownership Type** (Dropdown)
  - MOE Owned
  - Leased
  - Under Custodianship
  - Other
- **Deed Number** (Text)
- **Deed Date** (Date picker)
- **Ownership Documents** (File upload)
  - Accepted formats: PDF, JPG, PNG
  - Max 10 files, 10MB each
  - Mandatory for certain ownership types

#### Section 5: Features & Amenities
- **Asset Features** (Multi-select checkboxes)
  - Predefined options:
    - Utilities Connected (Water, Electricity, Sewage)
    - Road Access
    - Fenced/Secured
    - Building Permit Available
    - Cleared Title
    - No Encumbrances
  - "Other" option with text field for custom features
  - Features are optional

#### Section 6: Financial & Administrative (Shared Services)
- **Financial Dues** (Currency, optional)
- **Custody Details** (Text area)
- **Administrative Notes** (Rich text)
- **Related Reference Numbers** (Text)

**Note:** Only Shared Services users can edit Section 6

#### Section 7: Additional Information
- **Description** (Rich text editor, optional)
- **Special Conditions** (Text area)
- **Investment Potential** (Text area)
- **Restrictions/Limitations** (Text area)

#### Section 8: Attachments
- **Supporting Documents** (File upload, optional)
  - Site photos
  - Survey reports
  - Legal documents
  - Environmental assessments
  - Max 20 files, 10MB each

### 3. Department-Specific Sections

**School Planning Review:**
- Assigned sections: Basic Information, Property Details
- Can add comments to any section
- Views all sections (read-only for non-assigned)
- Decision: Approve/Reject

**Facilities & Security Review:**
- Assigned sections: Location & Coordinates, Ownership & Documentation, Features
- Validates safety and facility compliance
- Can upload additional documents
- Decision: Approve/Reject

**Investment & Partnerships (I&P) Review:**
- Assigned sections: Property Details, Additional Information
- Evaluates investment potential
- Can modify investment-related fields
- Decision: Approve/Reject
- **Special Permission:** Can toggle "Visible to Investors" in Asset Bank

**Investment Agency (MOE) Review:**
- Assigned sections: All sections (read-only, ministry-level validation)
- Provides centralized MOE approval
- Can add ministry-level comments
- Decision: Approve/Reject

**TBC Asset Approver:**
- Final approval authority
- Reviews all sections (read-only)
- Can view all previous comments and decisions
- Decision: Approve/Reject (NO RETURN)
- **Special Permission:** Can toggle "Visible to Investors" in Asset Bank

**Shared Services:**
- Limited to Section 6: Financial & Administrative
- Cannot approve or reject
- Cannot view other sections
- Edit-only access to assigned fields

### 4. Map Validation Feature

#### Interactive Map Component

**Triggering:**
- User enters Latitude and Longitude
- Clicks "Validate Location" button
- Map modal opens

**Map Display:**
- Centers on entered coordinates
- Shows pin at exact location
- Displays nearby assets within radius (200-500m, TBD)
- Only shows assets in same district
- Different pin colors:
  - Blue: Current asset being registered
  - Red: Nearby existing assets
  - Green: User's confirmed location

**Nearby Asset Detection:**
- System queries assets table
- Filters by same district
- Calculates distance using Haversine formula
- Returns assets within defined radius
- Displays as list below map:
  - Asset Name
  - Asset Code
  - Distance (meters)
  - "View Details" link

**Justification Requirement:**
- If nearby assets detected (list not empty)
- "Justification for Proximity" text area appears (mandatory)
- User must explain why new asset needed despite proximity
- Cannot submit without justification
- Minimum 100 characters

**Validation Actions:**
- "Confirm Location" button
  - Saves lat/long and validation status
  - Closes map modal
  - Enables form submission
- "Adjust Coordinates" button
  - Allows user to drag pin to new location
  - Updates lat/long fields
  - Re-checks nearby assets
- "Cancel" button
  - Closes modal without saving
  - Location not validated (blocks submission)

**Coordinate Accuracy Rules:**
- Latitude: Must be between 16.0 and 32.0 (Saudi Arabia bounds)
- Longitude: Must be between 34.0 and 56.0 (Saudi Arabia bounds)
- Decimal precision: Up to 6 decimal places
- Invalid coordinates rejected with error message

### 5. Draft Management (UC-03)

**Draft Saving:**
- Available at any time during form completion
- "Save as Draft" button always visible
- No validation required for draft saving
- Status: "Draft"
- Drafts visible only to creator

**Draft Editing:**
- User opens saved draft from registration list
- All fields editable
- Can save changes multiple times
- Can delete draft
- No approval workflow triggered

**Draft Limitations:**
- Drafts don't appear in Asset Bank
- Drafts don't appear in review queues
- Only creator can view/edit drafts
- No expiration on drafts

**Draft List View:**
- Separate "Drafts" tab in Asset Registration
- Table columns:
  - Asset Name
  - Asset Type
  - District
  - Created Date
  - Last Modified
  - Actions (Edit, Delete)
- Filter by date range
- Search by asset name

### 6. Bulk Upload (UC-08)

**Purpose:** Rapidly create multiple asset registration records from Excel template

**Flow:**
1. User clicks "Upload Assets" in Asset Registration
2. System provides Excel template download
3. User fills template with asset data
4. User uploads completed file
5. System validates each row
6. Valid records → Create as "Incomplete (Bulk Upload)" status
7. Invalid records → Rejected with error report
8. User reviews uploaded records
9. User opens each incomplete record individually
10. User completes missing information (map validation, documents)
11. User submits each record through normal flow

**Template Structure:**
- Excel file (.xlsx)
- Required columns:
  - Asset Name (Arabic)
  - Asset Name (English)
  - Asset Type
  - Region
  - City
  - District
  - Street Address
  - Total Area
  - Land Use Type
  - Ownership Type
- Optional columns:
  - Latitude, Longitude
  - Built-up Area
  - Deed Number
  - Description
- Max 1000 rows per upload

**Validation Rules (per row):**
- Required fields not empty
- Asset Name unique within district
- Asset Type valid (Land/Building)
- Region, City, District valid (from lookup tables)
- Total Area > 0
- Coordinates (if provided) within valid range

**Error Handling:**
- Invalid file format → Reject entire upload
- Template structure wrong → Reject entire upload
- Some rows valid, some invalid → Process valid, report invalid
- Error report: Excel file with columns [Row Number, Field, Error Message]
- User downloads error report and can fix issues

**Post-Upload:**
- Incomplete records appear in "Bulk Uploads" tab
- Status: "Incomplete (Bulk Upload)"
- User must complete:
  - Map validation (mandatory)
  - Document uploads (if required)
  - Additional fields
- Then submit through normal approval cycle

### 7. Asset Registration List Views

**Main List (All Registrations):**
- **Columns:**
  - Asset Code
  - Asset Name
  - Asset Type
  - District
  - Status (Draft, In Review, Completed, Rejected, Incomplete)
  - Current Stage (if In Review)
  - Created By
  - Created Date
  - Actions (View, Edit, Delete)

**Status Filters (Quick Tabs):**
- All (count)
- Draft (count)
- In Review (count)
- Completed (count)
- Rejected (count)
- Incomplete - Bulk Upload (count)

**Advanced Filters:**
- Region (multi-select)
- City (multi-select)
- District (multi-select)
- Asset Type (Land/Building)
- Date Range (created date)
- Status
- Created By (user dropdown)

**Sorting:**
- Asset Name (A-Z, Z-A)
- Created Date (newest/oldest)
- Status (alphabetical)
- District (alphabetical)

**Search:**
- Full-text search across:
  - Asset Code
  - Asset Name (Arabic & English)
  - District
  - Street Address
- Real-time search results

**Pagination:**
- 25/50/100/200 per page
- Page navigation
- Total count display

**Bulk Actions:**
- Select multiple drafts
- Delete selected
- Export selected

### 8. Department Review Queues (UC-05)

**My Review Queue:**
- Lists assets pending review for logged-in reviewer's department
- **Columns:**
  - Asset Code
  - Asset Name
  - District
  - Submitted Date
  - Days Pending
  - SLA Status (On Time, Warning, Overdue)
  - Priority Flag
  - Actions (Review)

**SLA Tracking:**
- Each department has defined SLA (TBD: 3-5 business days)
- Timer starts when asset reaches department
- Visual indicators:
  - Green: 0-50% of SLA time elapsed
  - Yellow: 50-80% (Warning)
  - Red: 80-100% (Urgent)
  - Red + Bold: >100% (Overdue)
- Email reminders (optional):
  - At 50% SLA time
  - At 80% SLA time
  - At 100% (overdue notification to supervisor)

**Review Actions:**
1. **Open Asset for Review**
   - View all sections (assigned sections editable)
   - Add comments to any section
   - View previous stage comments (read-only)
   - Upload supporting documents

2. **Approve**
   - Click "Approve" button
   - Optional: Add approval comments
   - Confirmation dialog: "Are you sure?"
   - System routes to next stage
   - Updates "Verified By" field
   - Audit log entry created

3. **Reject**
   - Click "Reject" button
   - **Mandatory:** Rejection reason (dropdown)
     - Duplicate asset
     - Incorrect data
     - Insufficient documentation
     - Location not suitable
     - Ownership issues
     - Other (specify)
   - **Mandatory:** Detailed justification (min 100 chars)
   - Confirmation dialog with warning: "This action cannot be undone"
   - System sets status to "Rejected"
   - Asset cannot be reopened
   - Notification to creator
   - Audit log entry

**Comments System:**
- Each section has comment thread
- Comments visible to all reviewers (current + future stages)
- Comment structure:
  - User name + department
  - Timestamp
  - Comment text
  - Optional: Attached file
- Comments read-only after stage completed
- Comment history preserved in audit log

**Review History Timeline:**
- Chronological view of all actions
- Shows:
  - Stage name
  - Reviewer name + department
  - Action (Submitted, Approved, Rejected)
  - Date/Time
  - Comments
  - Documents added
- Color-coded: Green (approved), Red (rejected), Blue (in progress)

### 9. Asset Bank Module

**Purpose:** Central repository and single source of truth for all completed assets

**Entry Requirements:**
- Asset status must be "Completed"
- Two paths to completion:
  1. Direct Registration submitted → Immediately "Completed"
  2. Approval Cycle fully approved by TBC → "Completed"

#### AB-UC-01: View Asset Bank

**Main List View:**
- **Columns:**
  - Asset Code (link to details)
  - Asset Name
  - Asset Type
  - District
  - Total Area
  - Ownership Type
  - Visible to Investors (Toggle icon)
  - Last Modified
  - Actions (View Details, Edit Visibility, Initiate ISNAD)

**Filtering:**
- Region (multi-select)
- City (multi-select)
- District (multi-select)
- Asset Type
- Ownership Type
- Visibility Status (Visible/Hidden)
- Area Range (min/max)

**Search:**
- Asset Code
- Asset Name (Arabic/English)
- District
- Ownership documents

**Sorting:**
- Asset Name (A-Z, Z-A)
- Total Area (smallest/largest)
- Date Added (newest/oldest)
- Visibility Count (high/low)

**Pagination:**
- 25/50/100/200 per page

**Export:**
- Export to XLS
- All visible columns
- Respects filters
- Audit log records export

#### AB-UC-02: View Asset Details

**Asset Detail Page Layout:**

**Tab 1: Overview**
- All asset information (read-only)
- Basic Information section
- Location section with embedded map
- Property Details
- Ownership & Documentation
- Features
- Financial & Administrative
- Additional Information
- All attachments (downloadable)

**Tab 2: Visibility History**
- Table of visibility changes
- Columns:
  - Visibility Status (Visible/Hidden)
  - Start Date
  - End Date (if hidden again)
  - Duration (days visible)
  - Changed By (user)
  - Reason/Notes
- **Visibility Count:** Total number of times asset marked visible
- **Total Exposure Days:** Sum of all visibility periods
- **Current Status:** Currently Visible/Hidden (badge)

**Tab 3: ISNAD History**
- List of all ISNAD workflows for this asset
- Columns:
  - ISNAD ID
  - Status (New, In Progress, Approved, Rejected)
  - Initiated By
  - Initiated Date
  - Completed Date
  - Final Decision
  - Link to ISNAD details
- Shows complete ISNAD journey for transparency

**Tab 4: Contracts**
- List of contracts associated with this asset
- Columns:
  - Contract ID
  - Investor Name
  - Start Date
  - End Date
  - Contract Status
  - Link to Contract details
- Shows active and historical contracts

**Tab 5: Lifecycle & History**
- Complete chronological timeline
- Shows:
  - Registration created (date, user)
  - Each approval stage (date, reviewer, decision)
  - Rejection (if any during registration)
  - Completed date
  - Visibility toggles
  - ISNAD initiations
  - Contract signings
  - Any modifications
- All with timestamps and user details
- Immutable audit trail

**Action Buttons (Top Right):**
- Edit Visibility (if permission)
- Initiate ISNAD (if permission)
- Export Details (PDF)
- View on Map

#### AB-UC-03: Toggle Asset Visibility (Investor Exposure)

**Purpose:** Control which assets are visible to investors in Investor Portal

**Who Can Toggle:**
- Investment & Partnerships (I&P) users (permission-based)
- TBC Asset Approver (permission-based)
- Platform Admin

**Toggle Functionality:**
1. Open Asset Details in Asset Bank
2. Click "Edit Visibility" button
3. Toggle switch: "Visible to Investors" (ON/OFF)
4. If turning ON:
   - Optional: Add reason/notes
   - Confirm action
   - System records:
     - Start Date (current timestamp)
     - Changed By (user)
     - Reason
   - Visibility Count + 1
   - Asset appears in Investor Portal
5. If turning OFF:
   - **Mandatory:** Reason for hiding
   - Confirm action
   - System records:
     - End Date (current timestamp)
     - Changed By
     - Reason
   - Asset removed from Investor Portal

**Visibility History Tracking:**
- Each toggle creates history record
- Structure:
  - Period ID
  - Asset ID
  - Status (Visible/Hidden)
  - Start Date
  - End Date (null if currently visible)
  - Duration in Days (calculated)
  - Changed By (user ID)
  - Reason/Notes
- Visibility Count: Total times asset has been made visible
- Cumulative Exposure: Total days asset has been visible

**Business Rules:**
- Can toggle on/off multiple times
- No limit on number of toggles
- Each toggle creates new history record
- Cannot delete history records
- Must be Asset Bank Viewer or higher to see visibility status
- Only authorized users can change visibility

#### AB-UC-04: View Asset Map (Admin Only)

**Purpose:** Visual geographic overview of all assets in Asset Bank

**Access:** Platform Admin only (permission-based)

**Map View:**
- Full-screen interactive map
- All completed assets shown as pins
- Pin colors indicate:
  - Green: Available assets
  - Blue: Assets in ISNAD process
  - Orange: Assets with active contracts
  - Purple: Visible to investors
- Clustered markers when zoomed out
- Individual pins when zoomed in

**Map Interactions:**
- Click pin → Asset info popup
  - Asset Name
  - Asset Code
  - District
  - Total Area
  - Status badges
  - "View Details" button
- Zoom controls
- Pan controls
- Satellite/street view toggle
- Reset to default view button

**Map Filters (Side Panel):**
- Region
- City
- District
- Asset Type
- Visibility Status
- ISNAD Status
- Contract Status
- Apply Filters button
- Clear Filters button

**Map Legend:**
- Color key for pin types
- Symbol meanings
- Filter status summary

**Export Map View:**
- Screenshot/PDF of current map view
- Includes visible pins and legend
- Includes filter criteria applied

#### AB-UC-05: Initiate ISNAD Workflow

**Purpose:** Start investment suitability (ISNAD) workflow for an asset

**Prerequisites:**
- Asset must be in Asset Bank (status = Completed)
- Asset must NOT have active ISNAD workflow
- User must have "Initiate ISNAD" permission (typically I&P)

**Flow:**
1. User opens Asset Details in Asset Bank
2. Click "Initiate ISNAD" button
3. System checks:
   - Asset has no active ISNAD
   - User has permission
4. Confirmation dialog: "Start ISNAD workflow for [Asset Name]?"
5. User confirms
6. System creates new ISNAD record:
   - ISNAD ID (auto-generated)
   - Asset ID (linked)
   - Status: "New"
   - Initiated By (user)
   - Initiated Date (timestamp)
7. User redirected to ISNAD workflow module
8. ISNAD workflow begins (separate module, see ISNAD BRD)

**Business Rules:**
- One active ISNAD per asset at a time
- ISNAD initiation doesn't change asset status in Asset Bank
- Asset remains in Asset Bank during ISNAD process
- ISNAD history tracked in Asset Details (Tab 3)
- Audit log records initiation

**ISNAD Status Badges in Asset Bank:**
- No ISNAD: No badge
- ISNAD In Progress: Blue badge "ISNAD In Progress"
- ISNAD Approved: Green badge "ISNAD Approved"
- ISNAD Rejected: Red badge "ISNAD Rejected"

### 10. Audit Logging

**All Actions Logged:**
- Asset registration created
- Draft saved/edited
- Asset submitted
- Approval/rejection at each stage
- Comments added
- Documents uploaded/downloaded
- Visibility toggled
- Map validation performed
- Nearby assets viewed
- ISNAD initiated
- Export actions
- Bulk uploads
- Any data modifications

**Audit Log Structure:**
- Log ID (unique)
- Timestamp (precise to millisecond)
- User ID + Name + Role
- Action Type (from predefined list)
- Entity Type (Asset Registration, Asset Bank, etc.)
- Entity ID (asset ID)
- Action Details (JSON)
  - What changed (before/after for updates)
  - Section affected
  - Comments/notes
- IP Address
- Session ID
- Success/Failure status

**Audit Log Access:**
- Platform Admin: Full access to all logs
- Department Reviewers: Logs for assets they reviewed
- Asset Creators: Logs for assets they created
- Read-only (logs cannot be edited/deleted)

**Audit Log Views:**
- Filter by date range
- Filter by user
- Filter by action type
- Filter by asset
- Search by keyword
- Export to CSV/Excel
- Generate audit reports

### 11. Database Schema

#### Assets Table
```sql
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_code VARCHAR(50) UNIQUE NOT NULL,
  
  -- Basic Information
  asset_name_ar VARCHAR(255) NOT NULL,
  asset_name_en VARCHAR(255) NOT NULL,
  asset_type VARCHAR(20) NOT NULL, -- Land, Building
  
  -- Location
  region VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  district VARCHAR(100) NOT NULL,
  neighborhood VARCHAR(255),
  street_address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location_validated BOOLEAN DEFAULT FALSE,
  nearby_assets_justification TEXT,
  
  -- Property Details
  total_area DECIMAL(15, 2) NOT NULL, -- sq meters
  built_up_area DECIMAL(15, 2), -- for buildings
  land_use_type VARCHAR(100),
  zoning_classification VARCHAR(100),
  current_status VARCHAR(50),
  
  -- Ownership
  ownership_type VARCHAR(50),
  deed_number VARCHAR(100),
  deed_date DATE,
  ownership_documents JSONB, -- array of file references
  
  -- Features
  features JSONB, -- array of selected features
  
  -- Financial & Administrative (Shared Services)
  financial_dues DECIMAL(15, 2),
  custody_details TEXT,
  administrative_notes TEXT,
  related_references TEXT,
  
  -- Additional Info
  description TEXT,
  special_conditions TEXT,
  investment_potential TEXT,
  restrictions TEXT,
  
  -- Attachments
  attachments JSONB, -- array of file references
  
  -- Registration Status
  status VARCHAR(50) NOT NULL DEFAULT 'Draft',
  -- Draft, In Review, Completed, Rejected, Incomplete (Bulk Upload)
  
  registration_mode VARCHAR(50), -- Direct, Approval Cycle
  current_stage VARCHAR(100), -- if In Review: School Planning, Facilities, I&P, etc.
  
  -- Approval Tracking
  verified_by JSONB, -- array of approvers: [{department, user, date}, ...]
  rejection_reason VARCHAR(255),
  rejection_justification TEXT,
  
  -- Asset Bank Specific
  visible_to_investors BOOLEAN DEFAULT FALSE,
  visibility_count INTEGER DEFAULT 0,
  total_exposure_days INTEGER DEFAULT 0,
  
  -- Active Workflow Flags
  has_active_isnad BOOLEAN DEFAULT FALSE,
  has_active_contract BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_by UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  submitted_at TIMESTAMP,
  completed_at TIMESTAMP,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT check_asset_type CHECK (asset_type IN ('Land', 'Building')),
  CONSTRAINT check_status CHECK (status IN ('Draft', 'In Review', 'Completed', 'Rejected', 'Incomplete (Bulk Upload)')),
  CONSTRAINT check_coordinates CHECK (
    (latitude IS NULL AND longitude IS NULL) OR 
    (latitude BETWEEN 16.0 AND 32.0 AND longitude BETWEEN 34.0 AND 56.0)
  )
);

CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_district ON assets(district);
CREATE INDEX idx_assets_type ON assets(asset_type);
CREATE INDEX idx_assets_visibility ON assets(visible_to_investors);
CREATE INDEX idx_assets_location ON assets(latitude, longitude) WHERE latitude IS NOT NULL;
CREATE INDEX idx_assets_current_stage ON assets(current_stage) WHERE status = 'In Review';
```

#### Asset Workflow History Table
```sql
CREATE TABLE asset_workflow_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
  
  stage VARCHAR(100) NOT NULL,
  -- School Planning, Facilities & Security, I&P, Investment Agency, TBC
  
  action VARCHAR(50) NOT NULL, -- Submitted, Approved, Rejected
  
  reviewer_id UUID REFERENCES users(id),
  reviewer_department VARCHAR(100),
  
  comments TEXT,
  rejection_reason VARCHAR(255),
  rejection_justification TEXT,
  
  documents_added JSONB, -- array of file references
  
  action_date TIMESTAMP DEFAULT NOW(),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_workflow_history_asset ON asset_workflow_history(asset_id);
CREATE INDEX idx_workflow_history_stage ON asset_workflow_history(stage);
CREATE INDEX idx_workflow_history_action ON asset_workflow_history(action);
CREATE INDEX idx_workflow_history_date ON asset_workflow_history(action_date);
```

#### Asset Visibility History Table
```sql
CREATE TABLE asset_visibility_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
  
  visibility_status VARCHAR(20) NOT NULL, -- Visible, Hidden
  
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP, -- NULL if currently visible
  duration_days INTEGER, -- calculated when end_date set
  
  changed_by UUID REFERENCES users(id) NOT NULL,
  reason TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_visibility_history_asset ON asset_visibility_history(asset_id);
CREATE INDEX idx_visibility_history_status ON asset_visibility_history(visibility_status);
CREATE INDEX idx_visibility_history_dates ON asset_visibility_history(start_date, end_date);
```

#### Asset Comments Table
```sql
CREATE TABLE asset_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
  
  section VARCHAR(100) NOT NULL,
  -- Basic Information, Location, Property Details, etc.
  
  comment_text TEXT NOT NULL,
  
  commenter_id UUID REFERENCES users(id) NOT NULL,
  commenter_department VARCHAR(100),
  
  workflow_stage VARCHAR(100),
  -- Which stage comment was added
  
  attachments JSONB, -- optional file references
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_comments_asset ON asset_comments(asset_id);
CREATE INDEX idx_comments_section ON asset_comments(section);
CREATE INDEX idx_comments_stage ON asset_comments(workflow_stage);
```

#### Bulk Upload Logs Table
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
  
  error_report_url TEXT, -- S3 URL to error Excel
  
  status VARCHAR(20) NOT NULL, -- Processing, Completed, Failed
  
  processing_started_at TIMESTAMP,
  processing_completed_at TIMESTAMP
);

CREATE INDEX idx_bulk_uploads_user ON bulk_upload_logs(uploaded_by);
CREATE INDEX idx_bulk_uploads_date ON bulk_upload_logs(uploaded_at);
```

#### Audit Logs Table (Extended)
```sql
-- See User Management BRD for base audit_logs table
-- Add asset-specific action types:
-- asset_created, asset_submitted, asset_approved, asset_rejected,
-- asset_completed, visibility_toggled, map_validated, 
-- comment_added, document_uploaded, isnad_initiated, etc.
```

### 12. API Endpoints

#### Asset Registration APIs
- `POST /api/assets/registrations` - Create new registration (draft)
- `GET /api/assets/registrations` - List registrations (with filters)
- `GET /api/assets/registrations/:id` - Get registration details
- `PUT /api/assets/registrations/:id` - Update draft
- `DELETE /api/assets/registrations/:id` - Delete draft
- `POST /api/assets/registrations/:id/submit` - Submit for approval/completion
- `POST /api/assets/registrations/:id/validate-location` - Perform map validation
- `GET /api/assets/registrations/:id/nearby` - Get nearby assets
- `POST /api/assets/registrations/:id/comments` - Add comment to section
- `GET /api/assets/registrations/:id/history` - Get workflow history

#### Department Review APIs
- `GET /api/assets/reviews/queue` - My review queue (for logged-in reviewer)
- `POST /api/assets/reviews/:assetId/approve` - Approve asset at current stage
- `POST /api/assets/reviews/:assetId/reject` - Reject asset with reason
- `GET /api/assets/reviews/:assetId` - Get asset for review
- `PUT /api/assets/reviews/:assetId/sections/:sectionId` - Update assigned section

#### Bulk Upload APIs
- `GET /api/assets/bulk-upload/template` - Download Excel template
- `POST /api/assets/bulk-upload` - Upload Excel file
- `GET /api/assets/bulk-upload/:uploadId/status` - Check upload progress
- `GET /api/assets/bulk-upload/:uploadId/errors` - Download error report

#### Asset Bank APIs
- `GET /api/assets/bank` - List all completed assets (with filters)
- `GET /api/assets/bank/:id` - Get asset details
- `PUT /api/assets/bank/:id/visibility` - Toggle visibility
- `GET /api/assets/bank/:id/visibility-history` - Get visibility history
- `GET /api/assets/bank/:id/lifecycle` - Get complete lifecycle
- `POST /api/assets/bank/:id/initiate-isnad` - Initiate ISNAD workflow
- `GET /api/assets/bank/map` - Get assets for map view (admin only)

#### Export APIs
- `POST /api/assets/registrations/export` - Export registrations to XLS
- `POST /api/assets/bank/export` - Export asset bank to XLS

#### Reference Data APIs
- `GET /api/reference/regions` - Get regions list
- `GET /api/reference/cities/:regionId` - Get cities for region
- `GET /api/reference/districts/:cityId` - Get districts for city
- `GET /api/reference/asset-features` - Get predefined features list
- `GET /api/reference/ownership-types` - Get ownership types

#### Analytics APIs
- `GET /api/assets/analytics/status-distribution` - Count by status
- `GET /api/assets/analytics/by-district` - Count by district
- `GET /api/assets/analytics/sla-compliance` - Review SLA metrics
- `GET /api/assets/analytics/visibility-stats` - Visibility metrics

### 13. Integration Points

**User Management Integration:**
- Role-based permissions for all operations
- Department assignments for reviewers
- SSO authentication
- Audit user actions

**ISNAD Workflow Integration:**
- Initiate ISNAD from Asset Bank
- Link asset to ISNAD form
- Update asset when ISNAD completes
- Display ISNAD history in asset details

**Contract Management Integration:**
- Link contracts to assets
- Display active contracts in asset details
- Prevent visibility toggle if active contract (optional rule)

**Investor Portal Integration:**
- Expose assets with visibility toggle ON
- Hide assets when toggle OFF
- Sync visibility changes real-time

**File Storage (AWS S3):**
- Ownership documents
- Attachments
- Supporting documents uploaded during review
- Bulk upload templates and error reports

**Maps Service (Google Maps/GIS):**
- Display asset location on map
- Validate coordinates
- Calculate distances for nearby assets
- Full map view for admin

**Email/Notification Service (Optional):**
- SLA reminder notifications
- Approval stage notifications
- Rejection notifications
- Bulk upload completion

### 14. Business Rules Summary

**BR-01:** Each department can edit only its assigned sections
**BR-02:** Only assigned reviewer can approve/reject; all rejections need reasons
**BR-03:** Two registration modes: Direct (no approval) and Approval Cycle (5 stages)
**BR-04:** Shared Services limited to Section 6: Financial & Administrative
**BR-05:** Draft saving available anytime without validation
**BR-06:** Rejected assets cannot be reopened (create new registration)
**BR-07:** All actions fully audited with immutable logs
**BR-08:** Permission-based access for all functions
**BR-09:** Visibility toggle only in Asset Bank (not during registration)
**BR-10:** Map validation required when coordinates entered
**BR-11:** Justification mandatory if nearby assets detected
**BR-12:** Nearby assets shown only in same district, within defined radius
**BR-13:** Invalid coordinates rejected before submission
**BR-14:** Asset enters Asset Bank only after completion (Direct or Full Approval)
**BR-16:** Comments allowed on every section
**BR-17:** Filters support region/city/district/status/type
**BR-18:** Export format is XLS only
**BR-19:** Asset Name must be unique within district, letters and spaces only
**BR-20:** Features: predefined + custom "Other" option
**BR-21:** Full map view access: Admin only
**BR-22:** Visibility history tracks every toggle with start/end dates
**BR-23:** Status changes automatic based on actions
**BR-24:** "Verified By" empty for Direct Registration, populated for Approval Cycle

### 15. UI/UX Specifications

#### Registration Form UI

**Layout:**
- Multi-step progress indicator (if long form)
- OR: Single page with collapsible sections
- Left sidebar: Section navigation with completion checkmarks
- Main area: Active section with fields
- Right sidebar: Help text and tips
- Bottom: Action buttons (Save Draft, Submit, Cancel)

**Section States:**
- Completed: Green checkmark, collapsed by default
- In Progress: Blue indicator, expanded
- Not Started: Gray, collapsed
- Error: Red indicator with error count

**Field Validation:**
- Inline validation on blur
- Error messages below fields (red text)
- Required fields marked with red asterisk
- Character counters for text areas
- Real-time duplicate checking for Asset Name

**Map Validation Modal:**
- Full-screen or large modal (1200px x 800px)
- Map takes 70% of space
- Right panel (30%): Nearby assets list
- Bottom: Action buttons
- Draggable pin with coordinate updates

**Department Review Interface:**
- Split screen:
  - Left: Asset form (read-only except assigned sections)
  - Right: Comments panel
- Comments panel:
  - Filter by section
  - Add new comment button
  - Comment threads (chronological)
  - Attach file option
- Action buttons (fixed position):
  - Approve (green, prominent)
  - Reject (red, with confirmation)
- Status banner at top: "In Review at [Department]"

#### Asset Bank UI

**List View:**
- Data table with column sorting
- Filters in left sidebar (collapsible)
- Search bar at top
- Action buttons: Add to Package, Edit Visibility, Initiate ISNAD
- Row hover: Highlight with quick actions popup
- Visibility icon column: Eye (visible) / Eye-slash (hidden)
- Color-coded badges for status

**Asset Detail Page:**
- Header: Asset name, code, badges (ISNAD status, contract status, visibility)
- Tab navigation (5 tabs)
- Breadcrumb: Asset Bank > District > Asset Name
- Action buttons top-right
- Print/Export button
- Share link button (for internal sharing)

**Map View (Admin):**
- Full-screen map
- Filters panel (left sidebar, collapsible)
- Asset info popup on pin click
- Clustering enabled
- Legend bottom-right
- Zoom to fit all assets button
- Search location bar at top

**Visibility Toggle Interface:**
- Modal dialog (600px x 400px)
- Current status display (large, prominent)
- Toggle switch with labels
- Reason text area (conditional)
- Visibility history preview (last 5 changes)
- Confirm / Cancel buttons

### 16. Testing Strategy

**Unit Tests:**
- Asset creation and validation
- Map validation logic
- Distance calculation (nearby assets)
- Coordinate validation
- Workflow stage progression
- Status transition logic
- Visibility tracking calculations

**Integration Tests:**
- Multi-department approval flow
- Bulk upload process
- Map service integration
- File upload/download
- Visibility toggle with history

**E2E Tests:**
- Complete Direct Registration flow
- Complete Approval Cycle (all 5 stages)
- Rejection at various stages
- Bulk upload with errors
- Map validation with nearby assets
- Visibility toggle multiple times
- ISNAD initiation from Asset Bank

**Performance Tests:**
- Asset list with 10,000+ assets
- Map view with 5,000+ pins
- Bulk upload with 1,000 rows
- Nearby asset calculation performance
- Export large datasets

### 17. Success Metrics

**Registration Efficiency:**
- Average time to complete registration: < 30 minutes
- Direct Registration time: < 10 minutes
- Bulk upload processing: < 5 minutes for 500 assets

**Approval Workflow:**
- Average approval cycle duration: < 15 business days
- SLA compliance rate: > 85%
- First-pass approval rate: > 70%
- Rejection rate: < 15%

**Data Quality:**
- Assets with validated locations: 100%
- Complete ownership documentation: > 90%
- Duplicate asset detection accuracy: > 95%

**System Performance:**
- Page load time: < 2 seconds
- API response time: < 500ms
- Map view load time: < 3 seconds
- Bulk upload validation: < 30 seconds per 100 rows

**User Adoption:**
- Assets digitized: 100% within 6 months
- Direct Registration usage: 40% of total registrations
- Reviewer adoption: 100% (all departments)
- Average reviews per day: > 10

## Getting Started with Replit

**Setup Steps:**

1. **Create Replit Project:**
   - Template: Full Stack (Node.js + React)

2. **Install Dependencies:**
```bash
# Backend
npm install express pg cors jsonwebtoken dotenv
npm install multer aws-sdk
npm install exceljs
npm install geolib # for distance calculations
npm install winston

# Frontend
cd client
npm install react react-dom typescript
npm install @mui/material @emotion/react @emotion/styled
npm install axios react-router-dom redux @reduxjs/toolkit
npm install @react-google-maps/api
npm install react-dropzone
```

3. **Database Setup:**
   - Add PostgreSQL addon
   - Run schema migrations
   - Seed reference data (regions, cities, districts, features)

4. **Environment Variables:**
```
DATABASE_URL=<from replit>
JWT_SECRET=<generate>
AWS_ACCESS_KEY=<for S3>
AWS_SECRET_KEY=<for S3>
AWS_S3_BUCKET=<bucket name>
GOOGLE_MAPS_API_KEY=<for maps>
NEARBY_ASSET_RADIUS=300 # meters (200-500 range)
NODE_ENV=development
```

5. **Run Application:**
```bash
npm run dev
```

## Questions to Clarify

1. **Nearby Asset Radius:** Finalize radius (200-500m) for nearby asset detection?
2. **SLA Timings:** Specific SLA duration for each department review stage?
3. **Direct Registration:** Which specific roles/users get Direct Registration permission?
4. **Features List:** Complete list of predefined asset features?
5. **Notifications:** Email/SMS notifications for SLA reminders and approvals?
6. **Regional Data:** Complete list of Saudi regions, cities, districts?
7. **Export Columns:** Exact columns to include in XLS export?
8. **Map Service:** Google Maps or alternative (Mapbox, ArcGIS)?
9. **File Retention:** How long to retain uploaded documents?
10. **Data Migration:** Plan for migrating existing Excel data?

---

**Version:** 5.0  
**Last Updated:** Based on BRD dated 16.12.2025  
**Status:** Ready for development - Assets Registration & Asset Bank

**Next Steps:**
1. Review and approve specifications
2. Finalize TBD parameters (radius, SLA, permissions)
3. Design UI mockups and workflows
4. Set up development environment
5. Begin sprint planning
