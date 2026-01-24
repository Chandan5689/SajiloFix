# ActionButton Component Refactoring

## Overview
Created a reusable `ActionButton` component to eliminate code duplication across ProviderMyBookings.jsx buttons.

## New Component: ActionButton

**Location:** `src/components/ActionButton.jsx`

### Props
- `label` (string) - Button text when not loading
- `loadingLabel` (string) - Text to show during loading (optional, defaults to "{label}...")
- `isLoading` (boolean) - Loading state
- `onClick` (function) - Click handler
- `disabled` (boolean) - Disabled state
- `icon` (React component) - Icon from react-icons (optional)
- `variant` (string) - Style variant: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'info'
- `size` (string) - Button size: 'sm' | 'md' | 'lg' (default: 'md')
- `className` (string) - Additional custom classes
- `type` (string) - HTML button type: 'button' | 'submit' (default: 'button')
- `spinIcon` (boolean) - Whether to spin icon during loading (default: true)

### Variants Available
- **primary**: Green background (for main actions)
- **secondary**: Green border (for secondary actions)
- **danger**: Red border (for destructive actions)
- **success**: Green background
- **warning**: Yellow background
- **info**: Blue background (for informational actions)

## Refactored Buttons in ProviderMyBookings.jsx

### Before (Repeated Code)
```jsx
<button
    className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-semibold hover:bg-green-700 transition flex items-center gap-1 disabled:opacity-60"
    onClick={() => handleAccept(booking.id)}
    disabled={actionInProgress === booking.id}
>
    <MdCheckCircle className={actionInProgress === booking.id ? 'animate-spin' : ''} /> 
    {actionInProgress === booking.id ? 'Accepting...' : 'Accept'}
</button>
```

### After (Using ActionButton)
```jsx
<ActionButton
    label="Accept"
    loadingLabel="Accepting..."
    isLoading={actionInProgress === booking.id}
    onClick={() => handleAccept(booking.id)}
    disabled={actionInProgress === booking.id}
    icon={MdCheckCircle}
    variant="primary"
    size="md"
/>
```

## Buttons Converted
1. ✅ View Details (variant: secondary)
2. ✅ Accept (variant: primary, icon: MdCheckCircle)
3. ✅ Decline (variant: danger, icon: MdCancel)
4. ✅ Start Work (variant: info, icon: MdPlayArrow)
5. ✅ Complete Job (variant: primary)

## Benefits
- **DRY Principle**: No more repeating button HTML structure
- **Consistency**: All buttons follow the same pattern
- **Maintainability**: Changes to button styles only need to be made in one place
- **Scalability**: Easy to extend with new variants or sizes
- **Readability**: Button intent is clear from props (label, variant, icon)

## Future Improvements
- Can be used in other components (UserMyBookings, etc.)
- Additional variants can be added as needed
- Can be extended with tooltips, badges, or counts
- Loading spinner can be customized per variant
