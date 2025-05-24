// src/app/dashboard/components/SlideInPanel.tsx
'use client';

import React, { useEffect } from 'react';
import { SlideInPanelProps } from '../../../../types/dashboard';
import { X, ArrowLeft } from 'lucide-react';
import CyberButton from '../../components/common/CyberButton';
import GridPattern from '../../components/common/GridPattern';

const SlideInPanel: React.FC<SlideInPanelProps> = ({
	isOpen,
	onClose,
	title,
	children,
	className = ''
}) => {
	// Escape key handling
	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && isOpen) {
				onClose();
			}
		};

		if (isOpen) {
			document.addEventListener('keydown', handleEscape);
			// Prevent background scrolling
			document.body.style.overflow = 'hidden';
		}

		return () => {
			document.removeEventListener('keydown', handleEscape);
			document.body.style.overflow = 'unset';
		};
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	return (
		<>
			{/* Backdrop */}
			<div
				className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] transition-opacity duration-300"
				onClick={onClose}
			/>

			{/* Panel */}
			<div
				className={`
          fixed top-0 right-0 h-full w-full md:w-4/5 lg:w-3/4 xl:w-2/3 2xl:w-1/2
          bg-gradient-to-t from-dark-100 to-black
          border-l border-dark-300 shadow-2xl z-[110]
          transform transition-transform duration-300 ease-out
          translate-x-full
          ${isOpen ? '!translate-x-0' : ''}
          ${className}
        `}
			>
				{/* Background Effects */}
				<div className="absolute inset-0 overflow-hidden">
					<GridPattern
						size={40}
						opacity={0.02}
						color="rgba(0, 255, 127, 0.06)"
					/>
				</div>

				{/* Header */}
				<div className="relative z-10 flex items-center justify-between p-6 border-b border-dark-300">
					<div className="flex items-center space-x-4">
						{/* Back Button */}
						<CyberButton
							variant="outline"
							size="sm"
							onClick={onClose}
							className="flex items-center space-x-2 hover:bg-dark-200/50 transition-colors"
						>
							<ArrowLeft className="w-4 h-4" />
							<span>Back</span>
						</CyberButton>

						{/* Title */}
						<h2 className="text-2xl font-heading font-bold text-white">
							{title}
						</h2>
					</div>

					{/* Close Button */}
					<button
						onClick={onClose}
						className="p-2 text-gray-400 hover:text-white transition-colors duration-200 hover:bg-dark-200 rounded-sm group"
						aria-label="Close panel"
					>
						<X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-200" />
					</button>
				</div>

				{/* Content */}
				<div className="relative z-10 h-[calc(100%-5rem)] overflow-y-auto">
					<div className={`
            p-6 transition-all duration-700 ease-out delay-300
            ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
          `}>
						{children}
					</div>
				</div>

				{/* Subtle border glow */}
				<div className="absolute inset-0 border-l-2 border-neonGreen/10 pointer-events-none" />
			</div>
		</>
	);
};

export default SlideInPanel;