// components/PepePush.tsx (Modified)
'use client';

import React from 'react';
import ScrollController from './ScrollController';
import { PepePushProps } from './types';

interface ExtendedPepePushProps extends PepePushProps {
  showMessages?: boolean; // メッセージ表示のオプションを追加
}

export default function PepePush({ 
  className = '', 
  showMessages = true // デフォルトでメッセージ表示
}: ExtendedPepePushProps) {
  return (
    <section className={`relative w-full ${className}`}>
      <ScrollController 
        className="bg-black" 
        showMessages={showMessages}
      />
    </section>
  );
}