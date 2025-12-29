# Comprehensive System Implementation Prompt
## Based on: Madares Business - Lands for Investor: Assets Bank & ISNAD Workflow Automation

---

## Executive Summary

You are tasked with developing a comprehensive digital platform for the Ministry of Education (MOE) that transforms their manual, paper-based ISNAD (property investment approval) process into an automated, traceable, and efficient workflow system. The platform consists of two interconnected modules:

1. **Asset Bank**: A centralized digital repository replacing Excel-based property management
2. **ISNAD Workflow**: An automated multi-stage approval process for property investment decisions

---

## System Context & Problem Statement

### Current State (AS-IS)
- Property details managed in disparate Excel and Word files
- Approvals conducted via email chains and physical signatures
- Departments operate in silos with no visibility into approval status
- No tracking mechanism for SLA compliance
- High risk of duplicate entries and lost documentation
- Impossible to generate consolidated reports or analytics
- Investor inquiries require manual coordination across multiple departments

### Target State (TO-BE)
- Single digital Asset Bank with centralized property data
- Automated ISNAD workflow with role-based approvals
- Real-time status tracking and dashboards
- Automated SLA monitoring with escalation alerts
- Audit trails for all actions and decisions
- Self-service portal for investors to track their interests
- Integration-ready architecture for future Ministry systems

---

## Core Modules & Functionality

### Module 1: Asset Bank (Digital Property Repository)

**Purpose**: Centralized registration and management of all MOE lands and buildings available for investment consideration.

**Key Features Required**:

1. **Asset Registration**
   - Unique asset identification system
   - Comprehensive property metadata capture:
     * Property type (land/building)
     * Location details (coordinates, address, region)
     * Size specifications (sqm, boundaries)
     * Legal status and ownership documentation
     * Current usage status
     * Investment suitability indicators
     * Associated documents and media (deeds, photos, surveys)
   - Duplicate detection mechanisms
   - Data validation rules enforcement

2. **Asset Status Management**
   - Multi-state lifecycle tracking:
     * Draft (being registered)
     * Available (ready for ISNAD)
     * In Review (ISNAD form initiated)
     * Approved (cleared for investment)
     * Rejected (not suitable)
     * Allocated (assigned to investor)
     * Withdrawn (removed from consideration)
   - Status change authorization controls
   - Automated status transitions based on workflow events

3. **Search & Discovery**
   - Advanced filtering capabilities:
     * By location/region
     * By property characteristics
     * By status
     * By investment criteria
   - Map-based property visualization
   - Bulk export functionality for reporting
   - Saved search preferences per user role

4. **Asset Modification & History**
   - Version control for all property data changes
   - Change approval workflow for critical fields
   - Complete audit trail with timestamps and user attribution
   - Rollback capabilities for authorized users

### Module 2: ISNAD Workflow Automation

**Purpose**: Structured, trackable approval process determining if properties can be offered for investment.

**Workflow Stages & Logic**:

1. **Initiation Stage**
   - **Actor**: Investment & Partnerships (I&P) Department
   - **Actions**:
     * Select asset(s) from Asset Bank
     * Complete ISNAD Assignment Criteria Form (digitalized)
     * Attach supporting documentation
     * Submit form to workflow engine
   - **Validations**:
     * Asset must have "Available" status
     * Asset cannot be in another active ISNAD flow
     * All mandatory form fields completed
   - **Output**: ISNAD Form with status "Pending Department Review"

2. **Department Review Stage (Parallel Reviews)**
   - **Actors**: 7 MOE Departments (parallel approvers)
     * Administration
     * Engineering
     * Legal
     * Planning
     * Projects
     * School Services
     * Shared Services (limited scope: financial dues + custody)
   - **Actions Each Department Can Take**:
     * **Approve**: Confirms property suitable from their perspective
     * **Reject**: Property cannot be used for investment (with mandatory justification)
     * **Return for Modification**: Request I&P to correct/add information, then resubmit
     * **Add Comments**: Provide conditions, recommendations, or notes
   - **Business Rules**:
     * All 7 departments must approve for workflow to advance
     * Single rejection from any department = entire ISNAD rejected
     * Returned forms go back to I&P for modifications
     * SLA timers run per department (configurable days)
     * Escalation alerts if SLA breached

3. **Investment Agency Review Stage**
   - **Actor**: Investment Agency (MISA equivalent)
   - **Actions**:
     * Approve: Property suitable for investor offering
     * Reject: Property not attractive for investment market
     * Return for Modification: Additional documentation needed
   - **Business Rules**:
     * Only proceeds if all 7 departments approved
     * Approval moves assets to "Package Preparation" state
     * Rejection ends ISNAD process (asset returns to Available)

4. **Package Preparation Stage**
   - **Actor**: TBC User (role to be confirmed)
   - **Actions**:
     * Select one or multiple Investment Agency-approved assets
     * Create ISNAD Package with metadata:
       - Package ID
       - Package description
       - Justification/business case
       - Asset list with summaries
     * Submit package for executive approval
   - **Business Rules**:
     * Assets cannot be in multiple packages simultaneously
     * Package can contain 1-N approved assets
     * Optional draft state before submission

5. **Executive Approval Stage (Sequential)**
   - **Stage 5a: CEO of TBC Approval**
     * Actions: Approve or Reject (no Return option)
     * Approval advances to Associate Minister
     * Rejection sends package back to TBC User
   
   - **Stage 5b: Associate Minister of MOE Approval**
     * Actions: Approve or Reject (no Return option)
     * Approval = ISNAD complete, assets marked "Approved for Investment"
     * Rejection sends package back to TBC User

---

## Cross-Cutting Features

### 1. User Role Management

**Define and implement comprehensive RBAC (Role-Based Access Control)**:

**Core Roles**:

- **Platform Administrator**
  - Full system access and configuration
  - User management and role assignment
  - System settings and workflow configuration
  - Access to all audit logs and analytics
  - Can cancel any ISNAD form with justification

- **Investment & Partnerships (I&P)**
  - Add/edit assets in Asset Bank
  - Initiate ISNAD forms
  - Respond to "Return for Modification" requests
  - Track all ISNAD forms they initiated
  - Can cancel ISNAD forms they initiated

- **Department Reviewers** (7 departments)
  - View ISNAD forms assigned to their department
  - Approve/Reject/Return forms with comments
  - View their approval queue and SLA status
  - Access to asset details related to assigned forms
  - Cannot edit Asset Bank directly

- **Shared Services Reviewer** (special limited role)
  - Reviews only financial dues and custody items
  - Cannot approve/reject based on other criteria
  - Provides input for decision-making but not full approval authority

- **Investment Agency Reviewer**
  - View forms that passed department review
  - Approve/Reject/Return with market viability assessment
  - Access to all asset documentation

- **TBC User**
  - Create ISNAD packages from approved assets
  - Submit packages to CEO
  - Manage package drafts
  - Track package approval status

- **CEO of TBC**
  - Approve or Reject packages
  - View complete package documentation
  - Access to approval history

- **Associate Minister of MOE**
  - Final approval authority on packages
  - Approve or Reject with policy-level justification
  - Dashboard of all pending ministerial approvals

- **Investor (External Portal - Optional in Initial Phase)**
  - View available properties (approved assets)
  - Express interest in properties
  - Track status of their investment inquiries
  - Download property documentation packages
  - Read-only access, no workflow participation

### 2. SLA Management & Notifications

**Implement comprehensive SLA tracking and alerting**:

**SLA Configuration** (per workflow stage):
- Define standard approval timeframes (e.g., 5 business days per department)
- Configurable by admin for different workflow stages
- Account for holidays and non-working days

**Alert Mechanisms**:
- **Reminder 1**: At 70% of SLA time elapsed
- **Reminder 2**: At 90% of SLA time elapsed  
- **Escalation**: At 100% SLA breach
- **Recurring Escalations**: Every 48 hours after initial breach

**Notification Channels**:
- In-platform notification center
- Email notifications to approver and their manager
- Dashboard indicators for overdue items
- Weekly digest reports to department heads

**Escalation Workflow**:
- Auto-notify approver's supervisor on breach
- Option to reassign if approver unavailable
- Track breach incidents in audit log
- Generate SLA compliance reports for management

### 3. Form Management Actions

**Return for Modification**:
- Available to: Department Reviewers, Investment Agency
- **Process**:
  1. Reviewer selects "Return for Modification"
  2. System prompts for mandatory explanation of what needs correction
  3. Form status changes to "Returned to I&P"
  4. I&P receives notification with reviewer comments
  5. I&P makes corrections and resubmits
  6. Form re-enters workflow at the returning department's stage
  7. All previous approvals retained (departments don't re-review unless specified)
- **Audit Trail**: Record all return events with reasons

**Cancel ISNAD Form**:
- Available to: Platform Admin, I&P (initiator), Investment Agency
- **Process**:
  1. User selects "Cancel Form"
  2. System prompts for mandatory cancellation justification
  3. Confirmation dialog (prevent accidental cancellations)
  4. System sets status = "Cancelled"
  5. All stakeholders notified of cancellation
  6. Asset returns to "Available" in Asset Bank (unless also marked for removal)
  7. Cancelled form remains visible for audit purposes
- **Business Rules**:
  - Cannot cancel forms in Final Executive Approval (CEO/Minister stage)
  - Cancellation reason required and logged
  - Cancelled forms visible to Admin and I&P for historical review

### 4. Status Tracking & Transparency

**Dashboard Requirements**:

- **I&P Dashboard**:
  - All ISNAD forms they initiated with current status
  - Forms requiring their action (returned for modification)
  - Forms pending in each department with days elapsed
  - SLA breach alerts
  - Asset Bank statistics (total assets, by status)

- **Department Reviewer Dashboard**:
  - Queue of pending forms requiring their approval
  - SLA countdown timers per form
  - Recently completed reviews
  - Forms returned by them awaiting resubmission

- **Admin Dashboard**:
  - System-wide statistics (forms by status, approval times)
  - SLA compliance metrics per department
  - Active forms count at each workflow stage
  - User activity logs
  - System health indicators

- **Executive Dashboard** (CEO/Minister):
  - Pending packages requiring approval
  - Recently approved packages
  - High-level statistics (properties approved, investment pipeline)
  - Strategic insights (types of properties, regional distribution)

**Status Visibility Rules**:
- I&P can see complete status of their own forms
- Departments see only forms assigned to them
- Investors (if portal enabled) see only "Available" or "Approved" assets
- Admins have full visibility across all forms and statuses
- Audit trails accessible based on role permissions

### 5. Audit & Compliance

**Comprehensive Audit Logging**:
- Every action logged with:
  * Timestamp (UTC and local)
  * User ID and role
  * Action type (create, update, approve, reject, etc.)
  * Entity affected (asset ID, form ID, package ID)
  * Old value → New value (for updates)
  * IP address and session info
  * Justification/comments provided

**Audit Log Features**:
- Searchable and filterable
- Exportable to CSV/Excel
- Tamper-proof (write-once, no deletions)
- Retention policy compliant (configurable years)
- Real-time log streaming to SIEM if required

**Compliance Reports**:
- Processing time by department
- SLA compliance percentage
- Rejection rate analysis
- User activity summaries
- Asset lifecycle reports
- Package approval success rates

---

## Technical Requirements

### 1. Data Model Considerations

**Asset Bank Schema** (minimum fields):
- `asset_id` (UUID, primary key)
- `asset_type` (enum: land, building)
- `title_deed_number` (unique, indexed)
- `location_coordinates` (geometry type)
- `region_id` (foreign key to regions lookup)
- `size_sqm` (decimal)
- `legal_status` (enum: clear, disputed, etc.)
- `current_usage` (text)
- `status` (enum: Draft, Available, In Review, Approved, Rejected, Allocated, Withdrawn)
- `created_by` (user_id)
- `created_at` (timestamp)
- `updated_by` (user_id)
- `updated_at` (timestamp)
- `version` (integer, for versioning)
- `documents` (JSON array or separate table for file references)

**ISNAD Form Schema** (minimum fields):
- `form_id` (UUID, primary key)
- `asset_id` (foreign key to assets)
- `initiated_by` (user_id, I&P member)
- `initiated_at` (timestamp)
- `current_stage` (enum: Pending Dept Review, Investment Agency, Package Prep, CEO, Minister, Approved, Rejected, Cancelled)
- `status` (enum: Draft, Active, Returned, Completed, Cancelled)
- `assignment_criteria` (JSON object with form responses)
- `department_approvals` (JSON array with approval records per dept)
- `investment_agency_decision` (JSON object)
- `package_id` (foreign key, nullable)
- `completed_at` (timestamp, nullable)
- `cancellation_reason` (text, nullable)

**ISNAD Package Schema**:
- `package_id` (UUID, primary key)
- `package_name` (text)
- `description` (text)
- `created_by` (user_id, TBC User)
- `created_at` (timestamp)
- `asset_ids` (JSON array of UUIDs)
- `ceo_approval_status` (enum: Pending, Approved, Rejected, null)
- `ceo_approved_by` (user_id, nullable)
- `ceo_approved_at` (timestamp, nullable)
- `minister_approval_status` (enum: Pending, Approved, Rejected, null)
- `minister_approved_by` (user_id, nullable)
- `minister_approved_at` (timestamp, nullable)
- `current_status` (enum: Draft, Pending CEO, Pending Minister, Approved, Rejected)

### 2. Workflow Engine Requirements

- **State Machine Implementation**: Use formal workflow engine (e.g., Camunda, Temporal, custom state machine)
- **Parallel Processing**: Support for 7 departments reviewing simultaneously
- **Conditional Routing**: Logic for approval/rejection/return paths
- **Compensation Logic**: Handle form cancellations and returns gracefully
- **Idempotency**: Ensure actions can't be double-submitted
- **Transaction Management**: Atomic updates across related entities

### 3. Integration Points

**Current Phase** (MVP):
- No external integrations required initially
- Self-contained system with internal APIs

**Future Integration Readiness**:
- Design APIs for:
  * GIS systems (map-based property visualization)
  * Ministry HR systems (user authentication/authorization)
  * Document management systems (deed storage, legal documents)
  * Investor portal (external-facing property marketplace)
  * Financial systems (investment tracking, revenue management)
  * National land registry (deed verification)

### 4. Non-Functional Requirements

**Performance**:
- Form submission response time < 2 seconds
- Dashboard load time < 3 seconds
- Support 500 concurrent users
- Handle 10,000+ assets in Asset Bank
- 1,000+ concurrent ISNAD workflows

**Security**:
- Role-based access control (RBAC)
- Multi-factor authentication for Admin and Executive roles
- Encrypted data at rest and in transit
- Session management with timeout
- Audit logging for all security events
- Protection against OWASP Top 10 vulnerabilities

**Availability**:
- 99.5% uptime SLA
- Automated backups (daily, retained 30 days)
- Disaster recovery plan with 24-hour RTO
- Maintenance windows communicated 48 hours in advance

**Usability**:
- Arabic and English language support (RTL for Arabic)
- Responsive design (desktop, tablet, mobile)
- Accessibility compliance (WCAG 2.1 Level AA)
- Intuitive navigation with max 3 clicks to any feature
- Contextual help and tooltips

**Scalability**:
- Horizontal scaling for application tier
- Database read replicas for reporting
- CDN for static assets and document serving
- Queue-based architecture for async tasks (notifications, reports)

---

## Open Questions & Design Decisions Needed

### 1. Asset Bank

- **Q**: Should assets be editable after ISNAD form is initiated, or locked?
  - **Recommendation**: Lock critical fields (location, size, deed number) once ISNAD starts; allow non-critical field updates with version tracking

- **Q**: Who can reject an asset during Asset Bank registration?
  - **Recommendation**: Only Platform Admin or designated I&P supervisors; require justification

- **Q**: Should duplicate detection be automatic or manual approval required?
  - **Recommendation**: Automatic detection with flagging; manual review by Admin before accepting/rejecting

### 2. ISNAD Workflow

- **Q**: If one department rejects, can other departments still submit approvals?
  - **Recommendation**: Form immediately moves to "Rejected" status; no further approvals accepted; notify all pending departments

- **Q**: When form is "Returned for Modification," do all previous approvals stay valid?
  - **Recommendation**: Yes, unless the modification affects that department's domain (configurable logic)

- **Q**: Should there be a timeout for forms stuck in a stage?
  - **Recommendation**: Yes, after X months (e.g., 6 months) of inactivity, auto-flag for Admin review with option to auto-cancel

- **Q**: Can a single asset be in multiple ISNAD forms simultaneously?
  - **Recommendation**: No, enforce uniqueness constraint; asset locked to one active ISNAD at a time

### 3. Notifications

- **Q**: Preferred notification channels: email, SMS, in-app, or all three?
  - **Recommendation**: In-app (mandatory) + email (configurable per user) + SMS for critical escalations only

- **Q**: Should notifications be batched or real-time?
  - **Recommendation**: Real-time for urgent actions (form assigned to you, SLA breach); daily digest for informational updates

### 4. Packages

- **Q**: Can TBC modify a package after CEO approval but before Minister approval?
  - **Recommendation**: No, package is immutable after submission; rejection sends back to TBC for new package creation

- **Q**: Should there be a "bulk reject" feature if Minister rejects a package?
  - **Recommendation**: Yes, Minister rejection = all assets in package return to Investment Agency for re-evaluation

### 5. Investor Portal

- **Q**: Should this be included in MVP or Phase 2?
  - **Recommendation**: Phase 2; focus MVP on internal workflow automation first

- **Q**: What information can investors see about properties?
  - **Recommendation**: Sanitized property details (no sensitive internal notes); ability to download investment prospectus

### 6. Reporting

- **Q**: What are the top 5 reports needed at launch?
  - **Recommendations**:
    1. ISNAD Processing Time by Department (SLA compliance)
    2. Asset Bank Status Distribution (inventory report)
    3. Monthly Approvals/Rejections Trend
    4. Bottleneck Analysis (which departments cause most delays)
    5. Property Type Distribution by Region

---

## Implementation Approach Recommendations

### Phase 1: MVP (Months 1-4)
1. Asset Bank core functionality (add, edit, search, status management)
2. ISNAD Workflow through Department Review stage
3. Basic user management and RBAC
4. Email notifications for key events
5. Simple dashboards for I&P and Department Reviewers
6. Audit logging foundation

### Phase 2: Full Workflow (Months 5-6)
1. Investment Agency stage
2. Package preparation and Executive Approvals
3. Enhanced SLA management with escalations
4. Return for Modification workflows
5. Cancel form functionality
6. Admin dashboards and reporting

### Phase 3: Optimization (Months 7-9)
1. Advanced reporting and analytics
2. Bulk operations (mass asset import, bulk approvals if allowed)
3. Mobile app (if required)
4. Performance optimization
5. User experience enhancements based on feedback

### Phase 4: Expansion (Months 10-12)
1. Investor portal (external-facing)
2. GIS integration for map-based property views
3. Advanced workflow customization (configurable approval chains)
4. API for third-party integrations
5. AI-powered insights (property recommendations, risk assessment)

---

## Success Metrics (KPIs)

### Process Efficiency
- **Avg ISNAD processing time**: Target < 30 days (down from current 90+ days)
- **SLA compliance rate**: Target > 90% across all departments
- **Forms returned for modification**: Target < 15% of submissions

### System Adoption
- **Active user rate**: Target > 85% of assigned users logging in weekly
- **Asset Bank completeness**: Target 100% of properties digitized within 6 months
- **Manual workarounds**: Target < 5% of workflows handled outside system

### Business Outcomes
- **Approved properties per quarter**: Track trend (expect 2x increase post-automation)
- **Investor inquiry response time**: Target < 3 days (down from current weeks)
- **Documentation completeness**: Target 95% of assets with all required documents attached

### Quality Metrics
- **System uptime**: Target 99.5%
- **User satisfaction score**: Target > 4.0/5.0 (quarterly survey)
- **Critical bug resolution time**: Target < 24 hours

---

## Detailed ISNAD Assignment Criteria Form Fields (To Be Digitalized)

Based on BRD section 1.4, the form should capture:

### Section A: Property Identification
- Asset ID (auto-populated from Asset Bank)
- Property Type
- Title Deed Number
- Location Details
- Size and Boundaries

### Section B: Investment Suitability Assessment
- Current usage status
- Zoning classification
- Accessibility (road access, utilities)
- Proximity to key infrastructure
- Environmental considerations

### Section C: Legal & Administrative
- Ownership clarity (any disputes?)
- Encumbrances or liens
- Compliance with MOE regulations
- Any existing commitments or obligations

### Section D: Strategic Rationale
- Why this property is being considered for investment
- Alignment with MOE strategic objectives
- Potential investment models (lease, build-operate-transfer, etc.)
- Expected benefits to MOE

### Section E: Supporting Documentation Checklist
- Title deed (scanned copy)
- Land survey
- Property valuation report
- Legal clearance certificate
- Photos and site inspection report
- Any other relevant documents

---

## User Stories (Examples for Development Team)

### Asset Bank

**US-001**: As an I&P staff member, I want to add a new property to the Asset Bank with all required details, so that it can be considered for future ISNAD workflows.

**US-002**: As an I&P staff member, I want to search for properties by region and size, so that I can quickly find suitable candidates for investor inquiries.

**US-003**: As a Platform Admin, I want to review duplicate property alerts, so that I can ensure data integrity in the Asset Bank.

**US-004**: As any user, I want to view the complete history of changes made to a property record, so that I can understand how the asset information evolved over time.

### ISNAD Workflow

**US-005**: As an I&P staff member, I want to initiate an ISNAD form for a selected asset, so that I can start the approval process for investor offering.

**US-006**: As a Department Reviewer, I want to see a list of ISNAD forms pending my approval with SLA countdown, so that I can prioritize my review work.

**US-007**: As a Department Reviewer, I want to approve a form with optional comments, so that I can provide my department's clearance along with any conditions.

**US-008**: As a Department Reviewer, I want to reject a form with mandatory justification, so that unsuitable properties are not offered to investors.

**US-009**: As a Department Reviewer, I want to return a form to I&P for modifications with specific instructions, so that incomplete submissions can be corrected without full rejection.

**US-010**: As an I&P staff member, I want to receive notifications when my ISNAD form is returned for modification, so that I can promptly address the feedback.

**US-011**: As an Investment Agency reviewer, I want to see only forms that have passed all 7 department approvals, so that I can focus on market viability assessment.

**US-012**: As a TBC User, I want to create a package from multiple Investment Agency-approved assets, so that I can present them to executives for final sign-off.

**US-013**: As a CEO, I want to see a summary of each package with all asset details and department comments, so that I can make an informed approval decision.

**US-014**: As an Associate Minister, I want to approve or reject packages with policy-level justification, so that final decisions are properly documented.

### Cross-Cutting

**US-015**: As any user, I want to receive email notifications when an action is required from me, so that I don't miss important tasks.

**US-016**: As a Platform Admin, I want to configure SLA timeframes for each workflow stage, so that approval times can be adjusted based on organizational needs.

**US-017**: As a Department Head, I want to see SLA compliance reports for my department's reviewers, so that I can manage workload and identify bottlenecks.

**US-018**: As a Platform Admin, I want to cancel any ISNAD form with justification, so that I can handle exceptional situations or errors.

**US-019**: As any user, I want to view a real-time dashboard showing the status of forms relevant to my role, so that I have full visibility into pending work.

**US-020**: As a Platform Admin, I want to export audit logs for a specific time period, so that I can provide compliance reports to management.

---

## Acceptance Criteria Examples

### For US-005 (Initiate ISNAD Form)

**Given** I am logged in as an I&P staff member  
**And** I have selected an asset with status "Available" from the Asset Bank  
**When** I click "Initiate ISNAD Form"  
**Then** the system should:
- Display the ISNAD Assignment Criteria Form with asset details pre-populated
- Allow me to fill in all required sections
- Validate that all mandatory fields are completed before submission
- Prevent submission if the asset is already in another active ISNAD workflow
- Create a new ISNAD form with status "Pending Department Review" upon successful submission
- Automatically route the form to all 7 departments for parallel review
- Update the asset status to "In Review"
- Send notifications to all 7 department reviewers
- Display a confirmation message with the form ID
- Log the initiation event in the audit trail

### For US-008 (Reject ISNAD Form)

**Given** I am logged in as a Department Reviewer  
**And** I have a pending ISNAD form assigned to me  
**When** I select "Reject" for that form  
**Then** the system should:
- Display a modal requiring mandatory justification text (minimum 50 characters)
- Prevent rejection if justification is missing or too short
- Upon submission:
  - Change form status to "Rejected"
  - Record my rejection with timestamp and justification in the form history
  - Notify the I&P initiator of the rejection with my comments
  - Notify all other pending department reviewers that the form has been rejected (no further action needed)
  - Update the asset status back to "Available" in the Asset Bank
  - Log the rejection event in the audit trail
- Display a success confirmation message

---

## Glossary of Terms (for Development Team)

- **Asset Bank**: The digital repository module for storing all MOE properties
- **ISNAD Form**: The workflow instance representing a property's journey through the approval process
- **ISNAD Package**: A collection of Investment Agency-approved assets bundled for executive approval
- **I&P**: Investment & Partnerships department, responsible for initiating ISNAD workflows
- **TBC**: "To Be Confirmed" - refers to the organizational role responsible for package preparation (likely Investment Agency or dedicated team)
- **Department Review**: The stage where 7 MOE departments review in parallel
- **Return for Modification**: Sending a form back to I&P for corrections without full rejection
- **Cancel Form**: Terminating an ISNAD workflow completely (requires justification)
- **SLA**: Service Level Agreement - the target time for each approval stage
- **Escalation**: Automated alerts triggered when SLA is breached
- **Shared Services**: Department with limited review scope (financial dues and custody items only)

---

## Appendix: Workflow State Diagram (Textual Description)

```
[Asset Bank: Available Asset]
        ↓
[I&P Initiates ISNAD Form] → [Status: Pending Department Review]
        ↓
[7 Departments Review in Parallel]
    ├── All Approve → [Status: Pending Investment Agency]
    ├── Any Reject → [Status: Rejected] → Asset returns to "Available"
    └── Any Return → [Status: Returned to I&P] → I&P modifies → Re-enters at returning dept
        ↓
[Investment Agency Review]
    ├── Approve → [Status: Package Preparation]
    ├── Reject → [Status: Rejected] → Asset returns to "Available"
    └── Return → [Status: Returned to I&P]
        ↓
[TBC Creates Package with 1-N Assets] → [Status: Pending CEO Approval]
        ↓
[CEO Reviews Package]
    ├── Approve → [Status: Pending Minister Approval]
    └── Reject → [Status: Returned to TBC]
        ↓
[Associate Minister Reviews Package]
    ├── Approve → [Status: Approved for Investment] → Assets marked "Approved"
    └── Reject → [Status: Returned to TBC]
        ↓
[Final State: Assets available for investor allocation]
```

---

## Final Development Prompt Summary

**You are tasked with building a comprehensive digital transformation platform for MOE's property investment approval process. The system must:**

1. Replace manual Excel/Word-based property management with a centralized Asset Bank
2. Automate a complex multi-stage approval workflow (ISNAD) involving 9 distinct roles across 7 departments
3. Provide real-time tracking, SLA management, and transparency for all stakeholders
4. Support parallel approvals, conditional routing (approve/reject/return), and package-based executive sign-offs
5. Maintain comprehensive audit trails and generate compliance reports
6. Be scalable, secure, and integration-ready for future enhancements

**Key technical challenges:**
- Parallel workflow execution with "all must approve" logic
- Complex state management (forms can be returned, cancelled, or packaged)
- Role-based access control with fine-grained permissions
- SLA tracking with multi-level escalations
- Immutable audit logging for regulatory compliance
- Performance at scale (10K+ assets, 1K+ concurrent workflows)

**Deliverables:**
- Fully functional web application (backend + frontend)
- RESTful APIs for all operations
- Admin panel for system configuration
- User dashboards tailored to each role
- Email notification system
- Reporting and analytics module
- Comprehensive documentation (API docs, user manuals, admin guides)

**Development approach:** Agile with 4 phases over 12 months, starting with MVP focusing on core Asset Bank and Department Review workflow.

**Success criteria:** System processes ISNAD forms in <30 days (down from 90+ days manual), achieves >90% SLA compliance, and has >85% user adoption rate within 6 months of launch.
