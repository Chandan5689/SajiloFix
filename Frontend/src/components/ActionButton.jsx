import React from 'react';

/**
 * Reusable ActionButton component with loading state support
 * 
 * Props:
 * - label: string - Button text when not loading
 * - loadingLabel: string - Text to show when loading (e.g., "Saving...", "Loading...")
 * - isLoading: boolean - Whether button is in loading state
 * - onClick: function - Click handler
 * - disabled: boolean - Whether button is disabled
 * - icon: React component - Icon to show (from react-icons)
 * - variant: 'primary' | 'secondary' | 'danger' | 'warning' | 'info' - Button style variant
 * - size: 'sm' | 'md' | 'lg' - Button size (default: 'md')
 * - className: string - Additional custom classes
 * - type: 'button' | 'submit' - HTML button type (default: 'button')
 * - spinIcon: boolean - Whether to spin the icon during loading (default: true)
 */
export default function ActionButton({
    label,
    loadingLabel,
    isLoading = false,
    onClick,
    disabled = false,
    icon: Icon = null,
    variant = 'primary',
    size = 'md',
    className = '',
    type = 'button',
    spinIcon = true,
}) {
    // Variant color mappings
    const variantClasses = {
        primary: 'bg-green-600 text-white hover:bg-green-700',
        secondary: 'border border-green-600 text-green-600 hover:bg-green-50',
        danger: 'border border-red-500 text-red-500 hover:bg-red-50',
        success: 'bg-green-600 text-white hover:bg-green-700',
        warning: 'bg-yellow-500 text-white hover:bg-yellow-600',
        info: 'bg-blue-600 text-white hover:bg-blue-700',
    };

    // Size mappings
    const sizeClasses = {
        sm: 'px-3 py-1 text-xs',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
    };

    const baseClasses = 'rounded-md font-semibold transition flex items-center gap-1 disabled:opacity-60';
    const variantClass = variantClasses[variant] || variantClasses.primary;
    const sizeClass = sizeClasses[size] || sizeClasses.md;

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || isLoading}
            className={`${baseClasses} ${variantClass} ${sizeClass} ${className}`}
        >
            {Icon && (
                <Icon 
                    className={`w-4 h-4 ${isLoading && spinIcon ? 'animate-spin' : ''}`}
                    style={{ display: 'flex', alignItems: 'center' }}
                />
            )}
            <span>
                {isLoading ? (loadingLabel || `${label}...`) : label}
            </span>
        </button>
    );
}
