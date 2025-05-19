// src/app/components/ui/CyberBox.tsx
import React, { ReactNode } from 'react';

interface CyberBoxProps {
	children: ReactNode;
	className?: string;
	borderColor?: string;
	glowColor?: string;
}

export const CyberBox: React.FC<CyberBoxProps> = ({
	children,
	className = '',
	borderColor = 'border-neonGreen',
	glowColor = 'shadow-[0_0_10px_rgba(0,255,127,0.5)]',
}) => {
	return (
		<div
			className={`
        relative 
        border-2 
        ${borderColor} 
        ${glowColor} 
        bg-dark-100/80 
        backdrop-blur-sm 
        p-4 
        ${className}
      `}
		>
			{/* 角の装飾 */}
			<div className={`absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 ${borderColor}`}></div>
			<div className={`absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 ${borderColor}`}></div>
			<div className={`absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 ${borderColor}`}></div>
			<div className={`absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 ${borderColor}`}></div>

			{children}
		</div>
	);
};

export default CyberBox;