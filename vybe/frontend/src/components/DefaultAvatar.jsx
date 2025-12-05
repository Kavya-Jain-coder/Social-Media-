import React from 'react';

const DefaultAvatar = ({ name, username, size = 'md', className = '' }) => {
    // Get initials from name or username
    const getInitials = () => {
        if (name) {
            const parts = name.split(' ');
            if (parts.length >= 2) {
                return (parts[0][0] + parts[1][0]).toUpperCase();
            }
            return name.slice(0, 2).toUpperCase();
        }
        if (username) {
            return username.slice(0, 2).toUpperCase();
        }
        return '??';
    };

    // Generate a consistent color based on the username/name
    const getColor = () => {
        const colors = [
            'from-purple-500 to-pink-500',
            'from-blue-500 to-cyan-500',
            'from-green-500 to-emerald-500',
            'from-orange-500 to-red-500',
            'from-indigo-500 to-purple-500',
            'from-pink-500 to-rose-500',
            'from-teal-500 to-green-500',
            'from-amber-500 to-orange-500',
        ];
        const str = username || name || '';
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    const sizeClasses = {
        xs: 'w-6 h-6 text-[10px]',
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base',
        xl: 'w-14 h-14 text-lg',
        '2xl': 'w-20 h-20 text-xl',
        '3xl': 'w-24 h-24 text-2xl',
    };

    return (
        <div
            className={`rounded-full bg-gradient-to-br ${getColor()} flex items-center justify-center font-bold text-white ${sizeClasses[size] || sizeClasses.md} ${className}`}
        >
            {getInitials()}
        </div>
    );
};

export default DefaultAvatar;
