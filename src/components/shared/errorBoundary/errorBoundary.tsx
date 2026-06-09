'use client';

import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined';
import type { Language } from '@/types/languageTypes';
import { translations } from '@/translations';

interface ErrorBoundaryProps {
	children: ReactNode;
	fallback?: ReactNode;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
}

/**
 * Error Boundary component to catch JavaScript errors anywhere in the child
 * component tree and display a fallback UI instead of crashing the whole app.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
		// Log error to monitoring service in production
		if (process.env.NODE_ENV === 'production') {
			// Could integrate with Sentry, LogRocket, etc.
			// For now, just suppress the error in production
		} else {
			// In development, log to console for debugging
			console.error('ErrorBoundary caught an error:', error, errorInfo);
		}
	}

	handleReset = (): void => {
		this.setState({ hasError: false, error: null });
	};

	private getTranslations() {
		const stored = typeof window !== 'undefined' ? localStorage.getItem('app-language') : null;
		const lang: Language = stored === 'en' ? 'en' : 'fr';
		return translations[lang];
	}

	render(): ReactNode {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}

			const t = this.getTranslations();

			return (
				<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', p: 3 }}>
					<Paper elevation={3} sx={{ p: 4, maxWidth: 500, textAlign: 'center' }}>
						<ErrorOutlinedIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
						<Typography variant="h5" gutterBottom>
							{t.errors.errorOccurred}
						</Typography>
						<Typography
							variant="body1"
							sx={{
								color: 'text.secondary',
								mb: 3,
							}}
						>
							{t.errors.errorApology}
						</Typography>
						{process.env.NODE_ENV !== 'production' && this.state.error && (
							<Typography
								variant="caption"
								component="pre"
								sx={{
									textAlign: 'left',
									bgcolor: 'grey.100',
									p: 2,
									borderRadius: 1,
									overflow: 'auto',
									maxHeight: 150,
									mb: 2,
								}}
							>
								{this.state.error.message}
							</Typography>
						)}
						<Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
							<Button variant="contained" onClick={this.handleReset}>
								{t.common.retry}
							</Button>
							<Button variant="outlined" onClick={() => window.location.reload()}>
								{t.common.refresh}
							</Button>
						</Box>
					</Paper>
				</Box>
			);
		}

		return this.props.children;
	}
}

export default ErrorBoundary;
