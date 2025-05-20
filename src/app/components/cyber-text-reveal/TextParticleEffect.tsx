import { useEffect, useRef } from 'react';
import { MotionValue } from 'framer-motion';

interface Particle {
	x: number;
	y: number;
	size: number;
	color: string;
	vx: number;
	vy: number;
	life: number;
	maxLife: number;
	targetX?: number;
	targetY?: number;
}

interface TextParticleEffectProps {
	progress: MotionValue<number>;
	containerId: string;
	particleCount?: number;
	colors?: string[];
}

const TextParticleEffect: React.FC<TextParticleEffectProps> = ({
	progress,
	containerId,
	particleCount = 100,
	colors = ['#5CFF5C', '#00FFFF', '#FF9140']
}) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const particlesRef = useRef<Particle[]>([]);
	const requestRef = useRef<number>(0);

	// キャンバスのサイズ調整
	const resizeCanvas = () => {
		if (!canvasRef.current) return;

		const container = document.getElementById(containerId);
		if (!container) return;

		const { width, height } = container.getBoundingClientRect();
		canvasRef.current.width = width;
		canvasRef.current.height = height;
	};

	// パーティクルの初期化
	const initParticles = () => {
		if (!canvasRef.current) return;

		const particles: Particle[] = [];
		const { width, height } = canvasRef.current;

		for (let i = 0; i < particleCount; i++) {
			particles.push({
				x: Math.random() * width,
				y: Math.random() * height,
				size: Math.random() * 3 + 1,
				color: colors[Math.floor(Math.random() * colors.length)],
				vx: (Math.random() - 0.5) * 2,
				vy: (Math.random() - 0.5) * 2,
				life: Math.random() * 100,
				maxLife: 100 + Math.random() * 100
			});
		}

		particlesRef.current = particles;
	};

	// パーティクルの更新とレンダリング
	const updateParticles = () => {
		if (!canvasRef.current) return;

		const canvas = canvasRef.current;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		// キャンバスのクリア
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		const currentProgress = progress.get();
		const particles = particlesRef.current;

		// パーティクルの更新とレンダリング
		for (let i = 0; i < particles.length; i++) {
			const p = particles[i];

			// ライフサイクルの更新
			p.life -= 0.5;
			if (p.life <= 0) {
				// パーティクルの再生成
				p.x = Math.random() * canvas.width;
				p.y = Math.random() * canvas.height;
				p.size = Math.random() * 3 + 1;
				p.life = p.maxLife;
				p.vx = (Math.random() - 0.5) * 2;
				p.vy = (Math.random() - 0.5) * 2;

				// 進行状況が50%以上の場合、テキスト周辺に集まるようにターゲット位置を設定
				if (currentProgress > 0.5) {
					const centerX = canvas.width / 2;
					const centerY = canvas.height / 2;
					const radius = Math.min(canvas.width, canvas.height) * 0.3;
					const angle = Math.random() * Math.PI * 2;

					p.targetX = centerX + Math.cos(angle) * radius * (0.8 + Math.random() * 0.4);
					p.targetY = centerY + Math.sin(angle) * (radius * 0.5) * (0.8 + Math.random() * 0.4);
				} else {
					p.targetX = undefined;
					p.targetY = undefined;
				}
			}

			// 進行状況に応じた動き方
			if (currentProgress > 0.5 && p.targetX !== undefined && p.targetY !== undefined) {
				// テキスト周辺に集まる挙動
				const dx = p.targetX - p.x;
				const dy = p.targetY - p.y;
				const dist = Math.sqrt(dx * dx + dy * dy);

				if (dist > 5) {
					p.vx = dx * 0.02;
					p.vy = dy * 0.02;
				} else {
					// 目標位置付近ではランダムな動きに
					p.vx = (Math.random() - 0.5) * 1;
					p.vy = (Math.random() - 0.5) * 1;
				}
			}

			// 位置の更新
			p.x += p.vx;
			p.y += p.vy;

			// 画面外に出たパーティクルの処理
			if (p.x < 0) p.x = canvas.width;
			if (p.x > canvas.width) p.x = 0;
			if (p.y < 0) p.y = canvas.height;
			if (p.y > canvas.height) p.y = 0;

			// 描画
			const alpha = (p.life / p.maxLife) * 0.7;
			ctx.globalAlpha = alpha;
			ctx.fillStyle = p.color;
			ctx.beginPath();
			ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
			ctx.fill();

			// 進行状況に応じたつながり線の描画
			if (currentProgress > 0.7) {
				for (let j = i + 1; j < particles.length; j++) {
					const p2 = particles[j];
					const dx = p.x - p2.x;
					const dy = p.y - p2.y;
					const dist = Math.sqrt(dx * dx + dy * dy);

					if (dist < 50) {
						ctx.globalAlpha = (1 - dist / 50) * 0.2 * alpha;
						ctx.strokeStyle = p.color;
						ctx.lineWidth = 0.5;
						ctx.beginPath();
						ctx.moveTo(p.x, p.y);
						ctx.lineTo(p2.x, p2.y);
						ctx.stroke();
					}
				}
			}
		}

		// アニメーションフレームの更新
		requestRef.current = requestAnimationFrame(updateParticles);
	};

	// コンポーネントのライフサイクル管理
	useEffect(() => {
		// キャンバスのリサイズ
		resizeCanvas();
		window.addEventListener('resize', resizeCanvas);

		// パーティクルの初期化
		initParticles();

		// アニメーションの開始
		requestRef.current = requestAnimationFrame(updateParticles);

		// クリーンアップ関数
		return () => {
			window.removeEventListener('resize', resizeCanvas);
			cancelAnimationFrame(requestRef.current);
		};
	}, []);

	return (
		<canvas
			ref={canvasRef}
			style={{
				position: 'absolute',
				top: 0,
				left: 0,
				width: '100%',
				height: '100%',
				pointerEvents: 'none',
				zIndex: 1,
			}}
		/>
	);
};

export default TextParticleEffect;