import type { Config } from "tailwindcss";

const config: Config = {
	content: [
		"./src/assets/svg/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/constants/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/utils/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	darkMode: 'class',
	theme: {
		fontFamily: {
			sans: [
				'Inter',
				'ui-sans-serif',
				'system-ui',
				'-apple-system',
				'BlinkMacSystemFont',
				'"Segoe UI"',
				'Roboto',
				'"Helvetica Neue"',
				'Arial',
				'"Noto Sans"',
				'sans-serif',
				'"Apple Color Emoji"',
				'"Segoe UI Emoji"',
				'"Segoe UI Symbol"',
				'"Noto Color Emoji"',
			],
			serif: [
				'ui-serif',
				'Georgia',
				'Cambria',
				'"Times New Roman"',
				'Times',
				'serif',
			],
			mono: [
				'ui-monospace',
				'SFMono-Regular',
				'Menlo',
				'Monaco',
				'Consolas',
				'"Liberation Mono"',
				'"Courier New"',
				'monospace',
			],
		},
		screens: {
			xs: '576px',
			sm: '640px',
			md: '768px',
			lg: '1024px',
			xl: '1280px',
			'2xl': '1536px',
		},
		extend: {
			colors: {
				// New luxury gold theme - Exact Match
				primary: "#FBBF24", // Amber 400 - More vivid gold
				"primary-dark": "#D97706", // Amber 600
				"background-light": "#F3F4F6",
				"background-dark": "#09090B", // Zinc 950 - Darker background
				"surface-dark": "#18181B", // Zinc 900
				"surface-darker": "#121212", // Almost black
				"surface-card": "#1C1C1E", // Apple Dark Gray
				"accent-green": "#10B981", // Emerald 500
				"accent-red": "#EF4444", // Red 500
				"accent-blue": "#3B82F6", // Blue 500
				"accent-purple": "#8B5CF6", // Violet 500
				"accent-orange": "#F97316", // Orange 500
				"accent-cyan": "#06B6D4", // Cyan 500

				// Existing variables
				'primary-deep': 'var(--primary-deep)',
				'primary-mild': 'var(--primary-mild)',
				'primary-subtle': 'var(--primary-subtle)',
				'error': 'var(--error)',
				'error-subtle': 'var(--error-subtle)',
				'success': 'var(--success)',
				'success-subtle': 'var(--success-subtle)',
				'info': 'var(--info)',
				'info-subtle': 'var(--info-subtle)',
				'warning': 'var(--warning)',
				'warning-subtle': 'var(--warning-subtle)',
				'neutral': 'var(--neutral)',
				'gray-50': 'var(--gray-50)',
				'gray-100': 'var(--gray-100)',
				'gray-200': 'var(--gray-200)',
				'gray-300': 'var(--gray-300)',
				'gray-400': 'var(--gray-400)',
				'gray-500': 'var(--gray-500)',
				'gray-600': 'var(--gray-600)',
				'gray-700': 'var(--gray-700)',
				'gray-800': 'var(--gray-800)',
				'gray-900': 'var(--gray-900)',
				'gray-950': 'var(--gray-950)',
			},
			borderRadius: {
				DEFAULT: "0.75rem", // 12px
				"xl": "1rem", // 16px
				"2xl": "1.5rem", // 24px
				"3xl": "2rem", // 32px
			},
			boxShadow: {
				'glow': '0 0 20px rgba(212, 175, 55, 0.15)',
				'glow-green': '0 0 15px rgba(16, 185, 129, 0.1)',
				'glow-red': '0 0 15px rgba(239, 68, 68, 0.1)',
				'glow-subtle': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
				'inner-light': 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
			},
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			typography: (theme: any) => ({
				DEFAULT: {
					css: {
						color: theme('colors.gray.500'),
						maxWidth: '65ch',
					},
				},
				invert: {
					css: {
						color: theme('colors.gray.400'),
					},
				},
			}),
		},
	},
	plugins: [
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        require('@tailwindcss/typography'),
	],
};
export default config;
