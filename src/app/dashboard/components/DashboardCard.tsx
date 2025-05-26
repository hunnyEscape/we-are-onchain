// src/app/dashboard/components/DashboardCard.tsx
'use client';

import React, { useState } from 'react';
import { DashboardCardProps } from '@/types/dashboard';
import GridPattern from '../../components/common/GridPattern';

const DashboardCard: React.FC<DashboardCardProps> = ({
	id, // ←　idプロパティを受け取る
	title,
	description,
	icon,
	stats,
	badge,
	onClick,
	className = ''
}) => {
	const [isHovered, setIsHovered] = useState(false);

	// クリックハンドラー
	const handleClick = () => {
		onClick(id); // ←　idを渡してonClickを実行
	};

	return (
		<div
			className={`
        relative bg-gradient-to-t from-dark-100 to-black 
        border border-dark-300 rounded-sm overflow-hidden
        cursor-pointer transition-all duration-300 ease-out
        hover:border-neonGreen hover:scale-[1.02]
        hover:shadow-lg hover:shadow-neonGreen/20
        group
        ${className}
      `}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			onClick={handleClick} // ←　クリックイベントを追加
		>
			{/* Background Effects - スキャンラインなし、軽微なグリッドのみ */}
			<GridPattern
				size={30}
				opacity={0.03}
				color="rgba(0, 255, 127, 0.08)"
			/>

			{/* Content */}
			<div className="relative z-10 p-6">
				{/* Header */}
				<div className="flex items-center justify-between mb-4">
					<div className="flex items-center space-x-3">
						<div className="p-2 rounded-sm bg-dark-200/50 border border-dark-300">
							{icon}
						</div>
						<div>
							<h3 className="text-white font-heading font-semibold text-lg">
								{title}
							</h3>
						</div>
					</div>

					{badge && (
						<span className="inline-block px-2 py-1 text-xs rounded-sm bg-neonGreen/10 text-neonGreen border border-neonGreen/30 animate-pulse">
							{badge}
						</span>
					)}
				</div>

				{/* Description */}
				<p className="text-gray-400 text-sm mb-4 leading-relaxed">
					{description}
				</p>

				{/* Stats */}
				{stats && (
					<div className="flex items-center justify-between border-t border-dark-300 pt-3">
						<span className="text-xs text-gray-500">
							{stats}
						</span>
						<div className="w-2 h-2 bg-neonGreen rounded-full animate-pulse opacity-60" />
					</div>
				)}

				{/* Action Indicator */}
				<div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
					<div className="w-6 h-6 border border-neonGreen rounded-sm flex items-center justify-center">
						<svg
							className="w-3 h-3 text-neonGreen"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M9 5l7 7-7 7"
							/>
						</svg>
					</div>
				</div>
			</div>

			{/* Hover Overlay */}
			<div
				className={`
          absolute inset-0 bg-gradient-to-r from-neonGreen/5 to-neonOrange/5 
          transition-opacity duration-300 pointer-events-none
          ${isHovered ? 'opacity-100' : 'opacity-0'}
        `}
			/>

			{/* Subtle glow on hover */}
			{isHovered && (
				<div className="absolute inset-0 border border-neonGreen/20 rounded-sm pointer-events-none" />
			)}
		</div>
	);
};

export default DashboardCard;