# Fee-ver Components Documentation

This document provides a comprehensive overview of all components and containers in the Fee-ver medical bill analysis application.

## Table of Contents

1. [Main Application Screens](#main-application-screens)
2. [UI Components](#ui-components)
3. [Utilities and Hooks](#utilities-and-hooks)
4. [Component Architecture](#component-architecture)

---

## Main Application Screens

### 1. UploadScreen (`components/upload-screen.tsx`)

**Purpose**: Initial screen for uploading medical bills and consent management.

**Features**:
- PDF file upload via drag-and-drop or file picker
- File validation (PDF only, max 10MB)
- Terms of Service & Privacy Policy modal
- Consent checkbox for document processing
- Optional data contribution checkbox
- Compliance with RA 10173 (Data Privacy Act of 2012)

**Props**:
- `onComplete: (data: any) => void` - Callback when upload is successful

**Key States**:
- `file`: Selected file
- `consentChecked`: Required consent status
- `contributeData`: Optional data sharing consent
- `showTosModal`: Terms modal visibility
- `error`: Error message display

### 2. TriageScreen (`components/triage-screen.tsx`)

**Purpose**: Payment method selection screen to determine analysis type.

**Features**:
- Two analysis options: Cash payment vs HMO/Insurance
- HMO provider selection dropdown
- Responsive card-based layout
- Supports major Philippine HMO providers (Cocolife, Intellicare, Maxicare, etc.)

**Props**:
- `onSelect: (type: 'v1' | 'v2', hmoProvider?: string) => void`

**Analysis Types**:
- `v1`: Basic analysis for cash payments
- `v2`: Enhanced analysis with HMO coverage details

### 3. LoaderScreen (`components/loader-screen.tsx`)

**Purpose**: Loading screen with dynamic status messages during bill analysis.

**Features**:
- Animated spinner with rotating phrases
- 8 different loading messages
- Auto-rotating messages every 5 seconds
- Gradient background design

**Messages Include**:
- "Analyzing your medical bill..."
- "Checking for duplicate charges..."
- "Comparing against PhilHealth benchmarks..."
- "Identifying overcharged items..."

### 4. AnalysisScreen (`components/analysis-screen.tsx`)

**Purpose**: Display comprehensive bill analysis results.

**Features**:
- Duplicate charge detection
- Benchmark comparison
- HMO coverage analysis (v2 only)
- Interactive tooltips
- Copy/share functionality
- Summary statistics

**Props**:
- `billData: any` - Uploaded bill data
- `analysisType: 'v1' | 'v2'` - Analysis version
- `onComplete: () => void` - Continue callback
- `onBack: () => void` - Back navigation

**Analysis Components**:
- **Duplicate Charges**: Shows repeated items with total amounts
- **Benchmark Issues**: Compares charges against standard rates
- **HMO Items**: Coverage details and patient responsibility (v2 only)
- **Summary**: Total charges, flagged amounts, and percentages

### 5. ReassessmentScreen (`components/reassessment-screen.tsx`)

**Purpose**: Generate dispute templates and correspondence tools.

**Features**:
- Professional email template generation
- Copy to clipboard functionality
- Download options
- Polite, structured dispute format
- Includes specific charge details and benchmark comparisons

**Template Includes**:
- Formal letterhead format
- Itemized charge discrepancies
- Professional language
- Request for clarification
- Contact information placeholders

---

## UI Components

### Layout & Structure

#### Card (`components/ui/card.tsx`)
- **Purpose**: Container component with consistent styling
- **Variants**: Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardAction
- **Features**: Rounded borders, shadow, responsive padding

#### Button (`components/ui/button.tsx`)
- **Purpose**: Interactive button component
- **Variants**: Primary, secondary, destructive, ghost, outline
- **Features**: Hover states, disabled states, loading states

#### Alert (`components/ui/alert.tsx`)
- **Purpose**: Status and notification messages
- **Variants**: Default, destructive
- **Features**: Icon support, dismissible options

### Form Components

#### Checkbox (`components/ui/checkbox.tsx`)
- **Purpose**: Boolean input selection
- **Features**: Custom styling, controlled/uncontrolled modes

#### Input (`components/ui/input.tsx`)
- **Purpose**: Text input fields
- **Features**: Validation states, placeholder support

#### Textarea (`components/ui/textarea.tsx`)
- **Purpose**: Multi-line text input
- **Features**: Resizable, character limits

#### Select (`components/ui/select.tsx`)
- **Purpose**: Dropdown selection
- **Features**: Search functionality, custom options

#### Form (`components/ui/form.tsx`)
- **Purpose**: Form validation and structure
- **Features**: Error handling, field validation

### Navigation & Interaction

#### Button Group (`components/ui/button-group.tsx`)
- **Purpose**: Related button collections
- **Features**: Consistent spacing, visual grouping

#### Tooltip (`components/ui/tooltip.tsx`)
- **Purpose**: Contextual help and information
- **Features**: Hover activation, positioning

#### Dialog (`components/ui/dialog.tsx`)
- **Purpose**: Modal dialogs and overlays
- **Features**: Backdrop, keyboard navigation, focus management

#### Sheet (`components/ui/sheet.tsx`)
- **Purpose**: Slide-out panels
- **Features**: Multiple positions, overlay support

### Data Display

#### Table (`components/ui/table.tsx`)
- **Purpose**: Structured data presentation
- **Features**: Sorting, responsive design

#### Badge (`components/ui/badge.tsx`)
- **Purpose**: Status indicators and labels
- **Features**: Color variants, size options

#### Progress (`components/ui/progress.tsx`)
- **Purpose**: Progress indicators
- **Features**: Animated, customizable

#### Skeleton (`components/ui/skeleton.tsx`)
- **Purpose**: Loading placeholders
- **Features**: Animated shimmer effect

### Utility Components

#### Separator (`components/ui/separator.tsx`)
- **Purpose**: Visual content division
- **Features**: Horizontal/vertical orientation

#### Spinner (`components/ui/spinner.tsx`)
- **Purpose**: Loading indicators
- **Features**: Multiple sizes, color variants

#### Empty (`components/ui/empty.tsx`)
- **Purpose**: Empty state displays
- **Features**: Customizable messages and actions

---

## Utilities and Hooks

### Theme Provider (`components/theme-provider.tsx`)
- **Purpose**: Application theme management
- **Features**: Dark/light mode support, system preference detection

### Custom Hooks

#### useMobile (`hooks/use-mobile.ts`)
- **Purpose**: Responsive breakpoint detection
- **Returns**: Boolean indicating mobile viewport

#### useToast (`hooks/use-toast.ts`)
- **Purpose**: Toast notification management
- **Features**: Queue management, auto-dismiss, action buttons

### Utility Functions (`lib/utils.ts`)
- **cn()**: Class name utility for conditional styling
- **clsx**: Class composition utility

---

## Component Architecture

### Design System
- **Color Palette**: Slate-based with blue accents
- **Typography**: Consistent font sizes and weights
- **Spacing**: 4px grid system
- **Border Radius**: Consistent rounded corners
- **Shadows**: Subtle depth indicators

### State Management
- **Local State**: React useState for component-specific data
- **Props Down**: Data flow through component hierarchy
- **Event Callbacks**: Parent-child communication

### Accessibility
- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: Proper ARIA labels and roles
- **Focus Management**: Logical tab order
- **Color Contrast**: WCAG compliance

### Responsive Design
- **Mobile First**: Progressive enhancement
- **Breakpoints**: Tailwind CSS responsive utilities
- **Touch Targets**: Minimum 44px touch areas
- **Readable Text**: Appropriate font sizes

### File Structure
```
components/
├── analysis-screen.tsx      # Main analysis display
├── loader-screen.tsx        # Loading states
├── reassessment-screen.tsx  # Dispute generation
├── theme-provider.tsx       # Theme context
├── triage-screen.tsx        # Payment type selection
├── upload-screen.tsx        # File upload and consent
└── ui/                      # Reusable UI components
    ├── button.tsx
    ├── card.tsx
    ├── checkbox.tsx
    ├── input.tsx
    └── [40+ other components]
```

### Dependencies
- **React**: Core framework
- **Next.js**: Application framework
- **Tailwind CSS**: Styling system
- **Lucide React**: Icon library
- **next-themes**: Theme management
- **Radix UI**: Unstyled component primitives

---

## Usage Examples

### Basic Component Usage
```tsx
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

function MyComponent() {
  return (
    <Card>
      <Button onClick={() => console.log('clicked')}>
        Click me
      </Button>
    </Card>
  );
}
```

### Screen Navigation
```tsx
import UploadScreen from '@/components/upload-screen';
import TriageScreen from '@/components/triage-screen';

function App() {
  const [screen, setScreen] = useState('upload');
  
  if (screen === 'upload') {
    return <UploadScreen onComplete={() => setScreen('triage')} />;
  }
  
  if (screen === 'triage') {
    return <TriageScreen onSelect={(type) => setScreen('analysis')} />;
  }
}
```

---

## Contributing

When adding new components:

1. Follow the established naming conventions
2. Include proper TypeScript interfaces
3. Add accessibility attributes
4. Implement responsive design
5. Update this documentation
6. Add usage examples

For UI components, extend the existing design system and maintain consistency with the current styling approach.
