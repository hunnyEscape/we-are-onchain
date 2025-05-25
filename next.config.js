/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'], // この行を追加
	images: {
		domains: [],
		formats: ["image/avif", "image/webp"],
	},
	// WebGLキャンバスサポート
	webpack: (config) => {
		config.module.rules.push({
			test: /\.(glsl|vs|fs|vert|frag)$/,
			type: "asset/source",
		});

		// WalletConnect用のnode polyfills
		config.resolve.fallback = {
			...config.resolve.fallback,
			crypto: require.resolve('crypto-browserify'),
			stream: require.resolve('stream-browserify'),
			buffer: require.resolve('buffer'),
			util: require.resolve('util'),
		};

		return config;
	},
	// 実験的機能
	experimental: {
		optimizeCss: true,
		scrollRestoration: true,
		esmExternals: 'loose', // この行も追加
	},
};

module.exports = nextConfig;