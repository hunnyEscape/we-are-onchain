'use client';

import React, { useEffect, useState } from 'react';
import MessageText from './MessageText';
import { cyberMessages, calculateMessageVisibility, SCROLL_CONFIG } from './constants';
import { ActiveMessageState, DebugInfo } from './types';

interface ScrollMessagesProps {
	scrollProgress: number;
	className?: string;
}

const ScrollMessages: React.FC<ScrollMessagesProps> = ({
	scrollProgress,
	className = '',
}) => {
	// アクティブメッセージの状態管理
	const [activeMessages, setActiveMessages] = useState<ActiveMessageState[]>([]);
	// スクロール位置に基づいてメッセージ表示を更新
	useEffect(() => {
		// アクティブなメッセージを計算
		const newActiveMessages = cyberMessages.map(message => {
			const { isVisible, opacity, isActive } = calculateMessageVisibility(
				message.scrollProgress,
				scrollProgress
			);

			return {
				message,
				opacity: isVisible ? opacity : 0,
				isActive
			};
		}).filter(item => item.opacity > 0);

		setActiveMessages(newActiveMessages);

	}, [scrollProgress]);

	return (
		<>
			{activeMessages.map(({ message, opacity, isActive }) => (
				<MessageText
					key={message.id}
					message={message}
					isActive={isActive}
					opacity={opacity}
				/>
			))}
		</>
	);
};

export default ScrollMessages;