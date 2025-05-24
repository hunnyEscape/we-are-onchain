// src/app/components/common/CyberButton.tsx
'use client';

import React from 'react';

export interface CyberButtonProps {
	children: React.ReactNode;
	onClick?: () => void;
	variant?: 'primary' | 'secondary' | 'outline';
	size?: 'sm' | 'md' | 'lg';
	disabled?: boolean;
	className?: string;
	type?: 'button' | 'submit' | 'reset';
}

const CyberButton: React.FC<CyberButtonProps> = ({
	children,
	onClick,
	variant = 'primary',
	size = 'md',
	disabled = false,
	className = '',
	type = 'button',
}) => {
	const baseClasses = 'relative font-semibold rounded-sm transition-all duration-200 overflow-hidden group';

	const variantClasses = {
		primary: 'bg-gradient-to-r from-neonGreen to-neonOrange text-black hover:shadow-lg hover:shadow-neonGreen/25',
		secondary: 'bg-gradient-to-r from-neonOrange to-neonGreen text-black hover:shadow-lg hover:shadow-neonOrange/25',
		outline: 'border border-neonGreen text-neonGreen hover:bg-neonGreen hover:text-black'
	};

	const sizeClasses = {
		sm: 'px-4 py-2 text-sm',
		md: 'px-6 py-3 text-base',
		lg: 'px-8 py-4 text-lg'
	};

	const disabledClasses = disabled
		? 'opacity-50 cursor-not-allowed'
		: 'cursor-pointer';

	return (
		<button
			type={type}
			onClick={disabled ? undefined : onClick}
			disabled={disabled}
			className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabledClasses}
        ${className}
      `}
		>
			{/* ホバー時のリバースグラデーション */}
			{variant === 'primary' && (
				<div className="absolute inset-0 bg-gradient-to-r from-neonOrange to-neonGreen transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"></div>
			)}

			{variant === 'secondary' && (
				<div className="absolute inset-0 bg-gradient-to-r from-neonGreen to-neonOrange transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"></div>
			)}

			{/* パルス効果 */}
			{!disabled && (
				<div className="absolute inset-0 animate-pulse bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
			)}

			{/* テキスト */}
			<span className="relative z-10">{children}</span>
		</button>
	);
};

export default CyberButton;