# Madares Business Platform - User Management System

## Project Overview
Build a comprehensive User Management System for the Madares Business platform (Lands for Investor) with role-based access control, custom permissions, and admin dashboard functionality.

## Tech Stack Requirements
- **Frontend**: React.js with TypeScript
- **Backend**: Node.js with Express
- **Database**: PostgreSQL or MongoDB
- **Authentication**: SSO (Single Sign-On) with invitation-based first login
- **UI Framework**: Material-UI or Ant Design
- **State Management**: Redux or Context API

## Core Features

### 1. Admin Dashboard (Admin Portal)
The control panel where Platform Admin manages users, roles, and monitors activity.

**Key Components:**
- User management interface
- Role catalogue management
- Permission assignment interface
- Audit log viewer
- Activity monitoring dashboard

### 2. User Management System

#### User Creation Flow
**Requirements:**
- Create new users with email, organization, and work unit
- Support both predefined roles and custom permissions
- Email uniqueness validation (real-time)
- Mandatory fields: Email (unique), Organization, Work Unit
- User states: Active, Inactive, Pending activation

**User Profile Fields:**
- Email address (primary identifier)
- Organization
- Work Unit
- Assigned role OR custom permissions
- Status (Active/Inactive/Pending)
- Last login timestamp
- Created date
- Created by (Platform Admin)

#### Invitation System
**First Login Flow:**
1. Admin creates user in system
2. System generates one-time invitation link
3. Invitation email sent to user with activation link
4. User clicks link to access first-time login
5. User sets up profile/password
6. Subsequent logins use SSO

**Subsequent Login:**
- Direct login via SSO
- No invitation link needed
- Standard authentication flow

### 3. Role-Based Access Control (RBAC)

#### Phase 1 Roles (TBC Scope - October Release)
Implement these roles for initial release:

**TBC Roles:**
1. **TBC Executive Management** - Approves/reviews final submissions
2. **TBC Contracts Manager** - Manages contract workflows
3. **TBC Asset Management** - Handles asset-related processes
4. **TBC Dashboard Viewer** - Read-only access to dashboards

**Platform Admin:**
- **Platform Admin (TBC)** - Full system administration access

#### Permission Groups
Organize permissions by process groups:

1. **New Asset: Management**
   - Initiate new asset
   - Edit new asset request
   - Cancel new asset request
   - Submit new asset for review

2. **New Asset: Reviewing**
   - Review new asset submissions
   - Approve/reject new asset
   - Request modifications
   - View new asset history

3. **ISNAD: Management**
   - Create ISNAD records
   - Edit ISNAD data
   - Submit ISNAD for approval
   - Archive ISNAD records

4. **ISNAD: Reviewing**
   - Review ISNAD submissions
   - Approve/reject ISNAD
   - Request changes
   - View ISNAD audit trail

5. **TBC Final Approval: Management**
   - Prepare final approval package
   - Edit final submission
   - Submit to executive management

6. **TBC Final Approval: Reviewing**
   - Review final submissions
   - Provide executive approval/rejection
   - Add executive comments

7. **Admin: Role Management**
   - Create/edit/delete roles
   - Define role permissions
   - View role catalog
   - Assign roles to users

8. **Admin: User Management**
   - Create/edit/delete users
   - Assign/revoke roles
   - Activate/deactivate accounts
   - View user activity

#### Access Levels
For each permission area, support these access levels:
- **Viewer** - Read-only access
- **Editor** - Read and write access
- **Approver** - Read, comment, and approve/reject
- **Full Access** - Complete control including deletion

#### Special Permissions
Certain areas require special permission tags:
- Head of Education Department (Ministry of Education)
- Tatweer Building Company Executive Management
- Special approval authority indicators

### 4. Custom Permissions Interface

**UI Requirements:**
1. **Radio Button Selection:**
   - Predefined role (select from dropdown)
   - Custom permissions (opens permission builder)

2. **Permission Builder:**
   - Expandable/collapsible process groups
   - Toggle switches for each group
   - Nested permission areas under each group
   - Dropdown for access level selection
   - Multiple selections across groups allowed
   - Auto-deselect children when parent deselected

3. **Help & Guidance:**
   - Information icon with modal
   - 4-step guide:
     1. Select permission group
     2. Select permission area
     3. Choose access level
     4. Review and confirm

4. **Validation:**
   - Inline validation messages
   - Real-time email uniqueness check
   - Prevent submission without required fields
   - At least one permission must be selected

5. **Navigation:**
   - "Go to Summary" button
   - Only enabled when form is valid
   - Shows summary of assigned permissions

### 5. Permission Matrix (Visual Reference)

Create a comprehensive permission matrix showing:
- Roles (rows)
- Permissions (columns)
- Access levels (cell values: -, V, E, A, F)
  - `-` No access
  - `V` Viewer
  - `E` Editor
  - `A` Approver
  - `F` Full Access

### 6. Audit Log System

**Track and log:**
- User creation/modification/deletion
- Role assignments/changes
- Login attempts (successful/failed)
- Permission changes
- Approval/rejection actions
- Data modifications with before/after values

**Log Entry Fields:**
- Timestamp
- User ID (who performed action)
- Action type
- Target entity (user, role, permission)
- Changes made (JSON diff)
- IP address
- Session ID

### 7. Business Rules

#### User Management Rules:
1. Email addresses must be unique across the system
2. Users cannot be created without an organization
3. Work unit is mandatory for all users
4. Platform Admin must assign at least one role or custom permission
5. Users start in "Active" state upon creation
6. Deactivated users cannot log in but retain their data
7. User deletion is soft delete (archive, not permanent removal)

#### Role Assignment Rules:
1. A user can have either ONE predefined role OR custom permissions, not both
2. Custom permissions can span multiple process groups
3. Each permission area requires an access level selection
4. Deselecting a process group deselects all nested permissions
5. Role changes require Platform Admin approval
6. Role modifications don't affect existing users unless explicitly updated

#### Permission Inheritance Rules:
1. Process group toggle affects all nested permissions
2. Higher access levels include lower levels (Full Access > Approver > Editor > Viewer)
3. Special permissions override standard access levels
4. Executive management roles have implicit special permissions

#### Login & Security Rules:
1. First login must use invitation link
2. Invitation links expire after 7 days
3. After first login, only SSO is allowed
4. Failed login attempts are logged
5. Account locks after 5 failed attempts
6. Session timeout after 30 minutes of inactivity

#### Workflow Rules:
1. Contract management requires TBC Contracts Manager role minimum
2. Final approvals require executive management authorization
3. Dashboard access requires assigned dashboard viewer role
4. Audit logs are immutable (append-only)

### 8. UI/UX Requirements

#### Admin Dashboard Layout:
- Sidebar navigation with sections:
  - Dashboard (overview)
  - User Management
  - Role Management
  - Audit Logs
  - System Settings
- Main content area with breadcrumbs
- Search and filter functionality
- Responsive design for desktop and tablet

#### User List View:
- Sortable table with columns:
  - Name/Email
  - Organization
  - Work Unit
  - Role
  - Status
  - Last Login
  - Actions (Edit/Deactivate/Delete)
- Pagination (25 users per page)
- Bulk actions (activate/deactivate selected)
- Export to CSV functionality

#### User Creation/Edit Form:
- Step 1: Basic Information
  - Email (with real-time validation)
  - Organization (dropdown)
  - Work Unit (dropdown, filtered by organization)
- Step 2: Role Assignment
  - Radio: Predefined Role
  - Radio: Custom Permissions
- Step 3: Permission Builder (if custom)
  - Process groups with toggles
  - Expandable sections
  - Access level dropdowns
- Step 4: Summary & Confirmation
  - Review all selections
  - Edit links to go back
  - Send invitation checkbox
  - Create User button

#### Role Management Interface:
- List of existing roles with usage count
- Add New Role button
- Role template selection
- Permission assignment interface (similar to custom permissions)
- Role preview before saving
- Confirmation for role deletion (if users assigned)

### 9. API Endpoints

#### Authentication:
- `POST /api/auth/login` - SSO login
- `POST /api/auth/validate-invitation` - Validate invitation token
- `POST /api/auth/first-login` - Complete first-time setup
- `POST /api/auth/logout` - End session

#### User Management:
- `GET /api/users` - List all users (with filters)
- `POST /api/users` - Create new user
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Deactivate user
- `POST /api/users/:id/resend-invitation` - Resend invitation email
- `POST /api/users/validate-email` - Check email uniqueness

#### Role Management:
- `GET /api/roles` - List all roles
- `POST /api/roles` - Create new role
- `GET /api/roles/:id` - Get role details
- `PUT /api/roles/:id` - Update role
- `DELETE /api/roles/:id` - Delete role

#### Permissions:
- `GET /api/permissions/groups` - Get all permission groups
- `GET /api/permissions/matrix` - Get permission matrix
- `POST /api/users/:id/permissions` - Assign custom permissions

#### Audit:
- `GET /api/audit-logs` - Retrieve audit logs (with filters)
- `GET /api/audit-logs/user/:id` - Get user-specific logs
- `GET /api/audit-logs/export` - Export logs to CSV

#### Reference Data:
- `GET /api/organizations` - List organizations
- `GET /api/work-units` - List work units (filtered by organization)

### 10. Database Schema

#### Users Table:
```sql
users {
  id: UUID PRIMARY KEY
  email: VARCHAR(255) UNIQUE NOT NULL
  organization_id: UUID FOREIGN KEY
  work_unit_id: UUID FOREIGN KEY
  role_id: UUID FOREIGN KEY (nullable)
  has_custom_permissions: BOOLEAN DEFAULT FALSE
  status: ENUM('active', 'inactive', 'pending')
  invitation_token: VARCHAR(255) UNIQUE
  invitation_expires_at: TIMESTAMP
  first_login_at: TIMESTAMP
  last_login_at: TIMESTAMP
  created_by: UUID FOREIGN KEY
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
  deleted_at: TIMESTAMP (soft delete)
}
```

#### Roles Table:
```sql
roles {
  id: UUID PRIMARY KEY
  name: VARCHAR(100) UNIQUE NOT NULL
  description: TEXT
  is_system_role: BOOLEAN DEFAULT FALSE
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```

#### Permissions Table:
```sql
permissions {
  id: UUID PRIMARY KEY
  process_group: VARCHAR(100) NOT NULL
  permission_area: VARCHAR(100) NOT NULL
  code: VARCHAR(50) UNIQUE NOT NULL
  description: TEXT
  requires_special_permission: BOOLEAN DEFAULT FALSE
}
```

#### Role_Permissions Table:
```sql
role_permissions {
  id: UUID PRIMARY KEY
  role_id: UUID FOREIGN KEY
  permission_id: UUID FOREIGN KEY
  access_level: ENUM('viewer', 'editor', 'approver', 'full_access')
  UNIQUE(role_id, permission_id)
}
```

#### User_Custom_Permissions Table:
```sql
user_custom_permissions {
  id: UUID PRIMARY KEY
  user_id: UUID FOREIGN KEY
  permission_id: UUID FOREIGN KEY
  access_level: ENUM('viewer', 'editor', 'approver', 'full_access')
  granted_by: UUID FOREIGN KEY
  granted_at: TIMESTAMP
  UNIQUE(user_id, permission_id)
}
```

#### Audit_Logs Table:
```sql
audit_logs {
  id: UUID PRIMARY KEY
  user_id: UUID FOREIGN KEY
  action_type: VARCHAR(50) NOT NULL
  entity_type: VARCHAR(50) NOT NULL
  entity_id: UUID
  changes: JSONB
  ip_address: VARCHAR(45)
  session_id: VARCHAR(255)
  created_at: TIMESTAMP
}
```

#### Organizations Table:
```sql
organizations {
  id: UUID PRIMARY KEY
  name: VARCHAR(200) NOT NULL
  code: VARCHAR(50) UNIQUE
  type: VARCHAR(50)
  created_at: TIMESTAMP
}
```

#### Work_Units Table:
```sql
work_units {
  id: UUID PRIMARY KEY
  organization_id: UUID FOREIGN KEY
  name: VARCHAR(200) NOT NULL
  code: VARCHAR(50)
  created_at: TIMESTAMP
}
```

### 11. Security Requirements

1. **Authentication:**
   - SSO integration (SAML 2.0 or OAuth 2.0)
   - JWT tokens for session management
   - Secure password hashing (bcrypt, minimum 12 rounds)
   - MFA support (optional, configurable)

2. **Authorization:**
   - Role-based access control (RBAC)
   - Permission checks on every API call
   - Middleware for route protection
   - Granular permission validation

3. **Data Protection:**
   - Encrypt sensitive data at rest
   - HTTPS/TLS for all communications
   - SQL injection prevention (parameterized queries)
   - XSS protection (input sanitization)
   - CSRF token validation

4. **Audit & Compliance:**
   - Log all security-relevant events
   - Immutable audit trail
   - Data retention policies
   - GDPR compliance considerations

### 12. Testing Requirements

#### Unit Tests:
- User creation/update/delete functions
- Permission validation logic
- Role assignment logic
- Email validation
- Access level inheritance

#### Integration Tests:
- API endpoint testing
- Database operations
- SSO authentication flow
- Email invitation sending

#### E2E Tests:
- User creation workflow
- Role assignment workflow
- Custom permission setup
- First login process
- SSO login process

### 13. Deployment & Environment

**Development Environment:**
- Local PostgreSQL database
- Node.js development server
- React development server
- Mock SSO provider

**Production Requirements:**
- Scalable database (AWS RDS, Azure Database)
- Load balancer for API servers
- Redis for session management
- Email service (SendGrid, AWS SES)
- Monitoring (CloudWatch, DataDog)
- Backup strategy (daily automated backups)

### 14. Future Phases (Not in Current Scope)

**Deferred Features:**
- Ministry of Education (MOE) roles
- School Planning Reviewer role
- Multi-tenant organization support
- Advanced reporting dashboard
- Role templates library
- Bulk user import via CSV
- API rate limiting
- Webhook notifications

## Acceptance Criteria

### Must Have (Phase 1):
✅ Platform Admin can create users with custom permissions
✅ Email uniqueness validation works in real-time
✅ Invitation system sends one-time activation links
✅ First login flow allows profile setup
✅ SSO works for subsequent logins
✅ Permission builder UI with expandable groups
✅ Access level dropdowns for each permission
✅ Audit log records all user management actions
✅ TBC-specific roles are fully functional
✅ User list view with search and filters
✅ Role catalogue management interface

### Should Have:
- Export user list to CSV
- Bulk user activation/deactivation
- Password reset functionality
- Session management dashboard
- Advanced audit log filtering

### Nice to Have:
- Real-time notifications
- User activity analytics
- Role usage statistics
- Permission conflict detection
- Automated role recommendations

## Development Workflow

1. **Setup Phase:**
   - Initialize React + Node.js project
   - Configure database schema
   - Set up authentication middleware
   - Create base UI components

2. **Backend Development:**
   - Implement user management APIs
   - Build role management system
   - Create permission validation logic
   - Set up audit logging
   - Integrate SSO

3. **Frontend Development:**
   - Build admin dashboard layout
   - Create user management interface
   - Implement permission builder UI
   - Design role management screens
   - Add audit log viewer

4. **Integration:**
   - Connect frontend to backend APIs
   - Test authentication flows
   - Validate permission enforcement
   - Test invitation system

5. **Testing & QA:**
   - Run unit tests
   - Execute integration tests
   - Perform E2E testing
   - Security audit
   - Performance testing

6. **Documentation:**
   - API documentation (Swagger/OpenAPI)
   - User manual for Platform Admin
   - Developer documentation
   - Deployment guide

## Success Metrics

- User creation time < 2 minutes
- Page load time < 2 seconds
- API response time < 500ms
- Zero permission bypass vulnerabilities
- 99.9% uptime
- Email delivery success rate > 98%
- Audit log completeness 100%

## Support & Maintenance

- Bug fix SLA: Critical (4 hours), High (24 hours), Medium (1 week)
- Monthly security patches
- Quarterly feature updates
- 24/7 monitoring for production
- Backup verification weekly
- Performance optimization quarterly

---

## Getting Started

To implement this system in Replit:

1. **Create a new Repl** with Node.js template
2. **Install dependencies:**
   - Frontend: `npm install react react-dom typescript @mui/material`
   - Backend: `npm install express pg jsonwebtoken bcrypt`
3. **Set up database** using Replit's PostgreSQL addon
4. **Implement core features** following the specifications above
5. **Test thoroughly** before deployment

## Questions to Clarify

1. SSO Provider - Which specific SSO system (Azure AD, Okta, Auth0)?
2. Email Service - Preference for email provider?
3. Hosting Environment - Replit deployment or external?
4. Branding - Color scheme, logo, and design assets?
5. Notification Preferences - Email only or in-app notifications too?
6. Data Retention - How long should audit logs be kept?
7. Backup Frequency - Daily, hourly, or real-time?

---

**Version:** 3.0  
**Last Updated:** Based on BRD dated 07.10.2025  
**Status:** Ready for development - Phase 1 (TBC Scope)
