# Navigation Loading Animation Implementation

## Overview
This implementation adds smooth loading animations when navigating through side menu items in the Zeno project management app. The system provides multiple visual feedback options:

1. **Progress Bar** - Top-of-page progress indicator
2. **Full Screen Overlay** - Backdrop with centered spinner
3. **Sidebar Indicator** - Small spinner in sidebar header
4. **Active Menu Item State** - Visual feedback on clicked items

## Files Created/Modified

### Core Context & Hooks
- `src/contexts/NavigationLoadingContext.tsx` - Global loading state management
- `src/hooks/useNavigateWithLoading.ts` - Enhanced navigation hook with loading

### UI Components
- `src/components/shared/NavigationLoadingOverlay.tsx` - Full screen loading overlay
- `src/components/shared/NavigationProgressBar.tsx` - Top progress bar
- `src/components/shared/NavigationLoadingIndicator.tsx` - Small spinner component
- `src/components/demo/NavigationLoadingDemo.tsx` - Test component (remove in production)

### Modified Components
- `src/app/layout.tsx` - Added NavigationLoadingProvider
- `src/components/layouts/PostLoginLayout/components/CollapsibleSide.tsx` - Added loading components
- `src/components/template/SideNav.tsx` - Added sidebar loading indicator
- `src/components/template/VerticalMenuContent/VerticalSingleMenuItem.tsx` - Enhanced navigation handling

## Features

### 1. Automatic Loading Detection
- Automatically shows loading when routes change
- Smart delay to prevent flash for fast navigations
- Auto-clears when navigation completes

### 2. Multiple Visual Feedback Options
```typescript
// Progress bar at top
<NavigationProgressBar />

// Full screen overlay
<NavigationLoadingOverlay />

// Small indicator in sidebar
<NavigationLoadingIndicator size={20} />
```

### 3. Enhanced Navigation Hook
```typescript
import { useNavigateWithLoading } from '@/hooks/useNavigateWithLoading'

const { navigate, replace, back } = useNavigateWithLoading()

// Navigate with loading
navigate('/app/projects')

// Navigate without loading
navigate('/app/projects', { showLoading: false })

// Custom loading delay
navigate('/app/projects', { loadingDelay: 50 })
```

### 4. Manual Loading Control
```typescript
import { useNavigationLoading } from '@/contexts/NavigationLoadingContext'

const { isLoading, setIsLoading } = useNavigationLoading()

// Manual loading control
setIsLoading(true)
// ... async operation
setIsLoading(false)
```

## Configuration Options

### Progress Bar Customization
```typescript
<NavigationProgressBar 
    height={3}
    color="bg-primary"
    className="custom-styles"
/>
```

### Overlay Customization
```typescript
<NavigationLoadingOverlay 
    className="custom-backdrop"
/>
```

### Navigation Options
```typescript
// All options with defaults
navigate('/path', {
    showLoading: true,     // Show loading animation
    loadingDelay: 100      // Delay before showing (prevents flash)
})
```

## Usage Examples

### Basic Navigation
```typescript
import { useNavigateWithLoading } from '@/hooks/useNavigateWithLoading'

const Component = () => {
    const { navigate } = useNavigateWithLoading()
    
    return (
        <button onClick={() => navigate('/app/calendar')}>
            Go to Calendar
        </button>
    )
}
```

### Custom Loading State
```typescript
import { useNavigationLoading } from '@/contexts/NavigationLoadingContext'

const Component = () => {
    const { setIsLoading } = useNavigationLoading()
    
    const handleAsyncAction = async () => {
        setIsLoading(true)
        try {
            await someAsyncOperation()
        } finally {
            setIsLoading(false)
        }
    }
    
    return <button onClick={handleAsyncAction}>Action</button>
}
```

## Best Practices

1. **Use the enhanced navigation hook** for all programmatic navigation
2. **Keep loading delays short** (50-200ms) to prevent UI flash
3. **Remove demo components** in production
4. **Test on slow networks** to ensure good UX
5. **Consider mobile experience** - overlays work well on mobile

## Customization

### Changing Loading Colors
Edit the progress bar color in `NavigationProgressBar.tsx`:
```typescript
color="bg-blue-500"  // or any Tailwind color class
```

### Adjusting Animation Speed
Modify transition durations in component styles:
```typescript
className="transition-all duration-300"  // Faster: duration-150
```

### Different Loading Styles
You can replace the spinner with other loading animations by modifying the `NavigationLoadingOverlay` component.

## Performance Notes

- Loading state is global but efficiently managed
- Components only re-render when loading state changes
- Automatic cleanup prevents memory leaks
- Minimal impact on navigation performance

## Browser Support

- Works with all modern browsers
- Responsive design for mobile/tablet
- Respects user's reduced motion preferences
- Fallback for browsers without backdrop-filter support

## Testing

Use the demo component to test different scenarios:
- Fast navigation between pages
- Slow network conditions
- Manual loading triggers
- Multiple rapid navigation attempts

Remove `NavigationLoadingDemo` from production builds.
