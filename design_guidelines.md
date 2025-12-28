# Madares User Management System - Design Guidelines

## Design Approach

**Selected System:** Carbon Design System (IBM)
**Justification:** Carbon is purpose-built for enterprise applications with complex data structures, forms, and tables - perfect for admin dashboards requiring clarity and efficiency over visual flair.

**Key Design Principles:**
1. **Clarity First** - Every element serves a functional purpose
2. **Scannable Hierarchy** - Information organized for quick comprehension
3. **Consistent Patterns** - Familiar UI reduces cognitive load
4. **Data Density** - Efficient use of space for information-rich interfaces

---

## Core Design Elements

### A. Typography

**Font Family:** IBM Plex Sans (via Google Fonts CDN)

**Hierarchy:**
- Page Titles: 2xl (24px), font-semibold
- Section Headers: xl (20px), font-semibold
- Subsection Headers: lg (18px), font-medium
- Body Text: base (16px), font-normal
- Table Headers: sm (14px), font-semibold, uppercase tracking-wide
- Table Data: sm (14px), font-normal
- Labels: sm (14px), font-medium
- Helper Text: xs (12px), font-normal
- Buttons: sm (14px), font-medium

---

### B. Layout System

**Spacing Primitives:** Tailwind units of **2, 3, 4, 6, 8, 12, 16**
- Micro spacing (form elements): 2, 3
- Standard spacing (components): 4, 6, 8
- Section spacing: 12, 16

**Grid Structure:**
- Sidebar: Fixed 256px (w-64)
- Main content: flex-1 with max-w-7xl container
- Form layouts: Single column max-w-2xl for optimal readability
- Table layouts: Full width with horizontal scroll on overflow

**Responsive Breakpoints:**
- Mobile: Single column, collapsible sidebar
- Tablet (md:): Persistent sidebar, optimized tables
- Desktop (lg:): Full layout with expanded data views

---

### C. Component Library

### Navigation & Layout

**Sidebar Navigation:**
- Vertical fixed sidebar with icon + label format
- Active state: Distinct background treatment
- Nested menu items with chevron indicators
- Collapsible sections for permission groups
- User profile section at bottom

**Top Bar:**
- Breadcrumb navigation (Home / User Management / Create User)
- Search input (w-96, right-aligned)
- Notification icon + user avatar menu

**Page Headers:**
- Page title (left-aligned)
- Primary action button (right-aligned, e.g., "Create User")
- Subtitle/description below title (text-sm)
- Horizontal divider (border-b) below header section

### Data Display

**Tables:**
- Zebra striping for row alternation
- Sticky header on scroll
- Column sorting indicators (arrows)
- Row hover states
- Checkbox selection column (leftmost)
- Actions column (rightmost) with icon buttons
- Empty states with icon + message + CTA
- Pagination: "Showing 1-25 of 247" + page numbers + per-page selector

**Cards:**
- Role cards in grid layout (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
- Card structure: Header + Content + Footer
- Hover elevation effect
- Icon or badge in header

**Status Badges:**
- Pill-shaped badges (rounded-full, px-3, py-1)
- Active: Green treatment
- Inactive: Gray treatment
- Pending: Yellow/amber treatment
- Small text (text-xs)

### Forms & Inputs

**Form Layout:**
- Vertical stacking with consistent spacing (space-y-6)
- Label above input (mb-2)
- Required field indicator (red asterisk)
- Helper text below input (mt-1, text-xs)
- Error messages in red below input
- Field groups with subtle background (bg-gray-50, p-4, rounded)

**Input Fields:**
- Standard height (h-10)
- Border with focus ring
- Placeholder text in muted color
- Prefix icons where appropriate (email, search)
- Real-time validation indicators (checkmark/X icon)

**Dropdowns/Selects:**
- Chevron down icon indicator
- Max height with scroll for long lists
- Search capability for extensive options
- Multi-select with tags/chips

**Radio Buttons & Toggles:**
- Radio groups for mutually exclusive options (Predefined Role vs Custom Permissions)
- Toggle switches for on/off states (permission enables)
- Labels to the right of controls

**Step Indicator:**
- Horizontal progress for multi-step forms
- Numbered circles (1, 2, 3, 4)
- Connecting lines between steps
- Current step highlighted, completed steps with checkmark

### Interactive Elements

**Buttons:**
Primary: Solid background, medium weight text, px-6 py-2
Secondary: Outlined, same padding
Tertiary: Text-only with hover underline
Icon buttons: Square (w-10 h-10), centered icon
Disabled state: Reduced opacity (0.5), cursor-not-allowed

**Expandable Sections:**
- Accordion pattern for permission groups
- Chevron rotation animation on expand/collapse
- Indented nested content (pl-8)
- Subtle background change when expanded

**Modal Dialogs:**
- Overlay with backdrop blur
- Centered modal (max-w-lg to max-w-2xl based on content)
- Header with title + close button
- Content area with scrolling if needed
- Footer with action buttons (right-aligned)

**Information Icons:**
- Tooltip on hover showing help text
- Icon: Heroicons "information-circle"
- 4-step guide modal for permission builder

### Specialized Components

**Permission Builder:**
- Tree structure with checkboxes/toggles
- Process groups as parent nodes (bold, larger)
- Permission areas as child nodes (regular weight)
- Access level dropdown for each permission (inline, right-aligned)
- "Select All" toggle at group level
- Visual indication of inherited states

**Audit Log Viewer:**
- Timeline format with vertical line
- Timestamp on left, action details on right
- Color-coded action types (Create, Update, Delete, Login)
- Expandable entries for JSON diff view
- Filter controls above timeline

**Summary Review:**
- Two-column layout: Category | Selected Values
- Role assignment with badge
- Permission list grouped by process area
- Edit links next to each section
- Confirmation checkbox at bottom

---

## Animations

**Use Sparingly:**
- Sidebar expand/collapse: 200ms ease
- Dropdown menus: 150ms ease
- Modal fade in: 200ms ease
- No scroll animations or parallax effects
- Focus on functional micro-interactions only

---

## Icons

**Library:** Heroicons (via CDN)
**Usage:**
- Navigation: outline variant (20px)
- Buttons: solid variant (16px)
- Form inputs: outline variant (16px)
- Table actions: outline variant (20px)
- Status indicators: solid variant (12px)