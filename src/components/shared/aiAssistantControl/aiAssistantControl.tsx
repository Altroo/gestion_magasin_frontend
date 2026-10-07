'use client';

import { useState, type FC, Fragment } from 'react';
import diff from 'fast-diff';
import {
	Alert,
	Box,
	Button,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	IconButton,
	Menu,
	MenuItem,
	Paper,
	Stack,
	Tooltip,
	Typography,
} from '@mui/material';
import {
	AutoAwesome as AutoAwesomeIcon,
	Close as CloseIcon,
	Language as LanguageIcon,
	Spellcheck as SpellcheckIcon,
	WorkOutlined as WorkOutlineIcon,
} from '@mui/icons-material';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import { LanguageFlag } from '@/components/shared/languageSwitcher/languageSwitcher';
import { useAssistTextMutation } from '@/store/services/aiAssistant';
import type { AiAssistAction, AiAssistRequest, AiAssistResponse } from '@/types/aiTypes';
import { extractApiErrorMessage } from '@/utils/helpers';
import { useLanguage, useToast } from '@/utils/hooks';

type AiAssistantControlProps = {
	value: string;
	onApply: (value: string) => void;
	context: string;
	disabled?: boolean;
	compact?: boolean;
	maxLength?: number;
};

const isEnabled = () => process.env.NEXT_PUBLIC_AI_ASSISTANT_ENABLED === 'true';

const normalizeForComparison = (text: string) => text.normalize('NFC').replace(/\s+/g, ' ').trim();

type DiffTextProps = {
	changes: diff.Diff[];
	variant: 'original' | 'suggestion';
};

const DiffText: FC<DiffTextProps> = ({ changes, variant }) => (
	<>
		{changes.map(([operation, text], index) => {
			const isChanged = variant === 'original' ? operation === diff.DELETE : operation === diff.INSERT;
			const isVisible = operation === diff.EQUAL || isChanged;

			if (!isVisible) return null;
			if (!isChanged) return <Fragment key={`${operation}-${index}`}>{text}</Fragment>;

			return (
				<Box
					component="mark"
					data-change={variant === 'original' ? 'removed' : 'added'}
					key={`${operation}-${index}`}
					sx={{
						bgcolor: variant === 'original' ? 'error.light' : '#fff59d',
						color: variant === 'original' ? 'error.contrastText' : 'text.primary',
						borderRadius: 0.5,
					}}
				>
					{text}
				</Box>
			);
		})}
	</>
);

const EnabledAiAssistantControl: FC<AiAssistantControlProps> = ({
	value,
	onApply,
	context,
	disabled = false,
	compact = false,
	maxLength,
}) => {
	const { t } = useLanguage();
	const { onSuccess } = useToast();
	const [assistText, { isLoading }] = useAssistTextMutation();
	const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
	const [result, setResult] = useState<AiAssistResponse | null>(null);
	const [lastRequest, setLastRequest] = useState<AiAssistRequest | null>(null);
	const [error, setError] = useState('');
	const [translationDialogOpen, setTranslationDialogOpen] = useState(false);
	const changes = result ? diff(result.original_text, result.suggested_text) : [];

	const handleResponse = (request: AiAssistRequest, response: AiAssistResponse) => {
		const isUnchanged = normalizeForComparison(request.text) === normalizeForComparison(response.suggested_text);

		if (isUnchanged && request.action === 'fix_grammar') {
			setResult(null);
			onSuccess(t.aiAssistant.alreadyCorrect);
			return;
		}

		if (isUnchanged && request.action === 'professionalize') {
			setResult(null);
			onSuccess(t.aiAssistant.alreadyProfessional);
			return;
		}

		setResult(response);
	};

	const run = async (action: AiAssistAction, target_language?: 'fr' | 'en') => {
		setMenuAnchor(null);
		if (!value.trim()) {
			setError(t.aiAssistant.emptyText);
			return;
		}
		const request: AiAssistRequest = {
			action,
			text: value,
			source_language: 'auto',
			target_language,
			context,
		};
		setLastRequest(request);
		setError('');
		try {
			handleResponse(request, await assistText(request).unwrap());
		} catch (requestError) {
			setError(extractApiErrorMessage(requestError, t.aiAssistant.requestError));
		}
	};

	const retry = async () => {
		if (!lastRequest) return;
		if (lastRequest.text !== value) {
			await run(lastRequest.action, lastRequest.target_language);
			return;
		}
		setError('');
		try {
			handleResponse(lastRequest, await assistText(lastRequest).unwrap());
		} catch (requestError) {
			setError(extractApiErrorMessage(requestError, t.aiAssistant.requestError));
		}
	};

	const controlsDisabled = disabled || isLoading || !value.trim() || value.length > 5000;
	const stale = Boolean(result && value !== result.original_text);
	const tooLong = Boolean(result && maxLength && result.suggested_text.length > maxLength);
	const canApply = Boolean(result) && !disabled && !isLoading && !stale && !tooLong;
	const menu = (
		<Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
			<MenuItem
				onClick={() => {
					setMenuAnchor(null);
					setTranslationDialogOpen(true);
				}}
			>
				{t.aiAssistant.translate}
			</MenuItem>
			{compact && <MenuItem onClick={() => void run('fix_grammar')}>{t.aiAssistant.fixGrammar}</MenuItem>}
			{compact && <MenuItem onClick={() => void run('professionalize')}>{t.aiAssistant.professionalize}</MenuItem>}
		</Menu>
	);

	return (
		<>
			{value.length > 5000 && <Alert severity="info">{t.aiAssistant.textTooLong}</Alert>}
			{compact ? (
				<>
					<Tooltip title={t.aiAssistant.previewTitle}>
						<span>
							<IconButton
								size="small"
								disabled={controlsDisabled}
								onClick={(event) => setMenuAnchor(event.currentTarget)}
								aria-label={t.aiAssistant.previewTitle}
							>
								{isLoading ? <CircularProgress size={18} /> : <AutoAwesomeIcon fontSize="small" />}
							</IconButton>
						</span>
					</Tooltip>
					{menu}
				</>
			) : (
				<Box>
					<Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
						<Button
							size="small"
							variant="text"
							startIcon={<LanguageIcon />}
							disabled={controlsDisabled}
							onClick={() => setTranslationDialogOpen(true)}
						>
							{t.aiAssistant.translate}
						</Button>
						<Button
							size="small"
							variant="text"
							startIcon={<SpellcheckIcon />}
							disabled={controlsDisabled}
							onClick={() => void run('fix_grammar')}
						>
							{t.aiAssistant.fixGrammar}
						</Button>
						<Button
							size="small"
							variant="text"
							startIcon={<WorkOutlineIcon />}
							disabled={controlsDisabled}
							onClick={() => void run('professionalize')}
						>
							{isLoading ? <CircularProgress size={18} /> : t.aiAssistant.professionalize}
						</Button>
					</Stack>
					{menu}
				</Box>
			)}

			{translationDialogOpen && (
				<ActionModals
					onClose={() => setTranslationDialogOpen(false)}
					title={t.aiAssistant.translate}
					body={t.aiAssistant.chooseLanguage}
					actions={[
						{
							active: false,
							text: t.aiAssistant.cancel,
							onClick: () => setTranslationDialogOpen(false),
							icon: <CloseIcon />,
							color: '#6B6B6B',
						},
						{
							active: false,
							text: t.aiAssistant.translateToFrench,
							onClick: () => {
								setTranslationDialogOpen(false);
								void run('translate', 'fr');
							},
							icon: <LanguageFlag language="fr" />,
							color: '#0D070B',
						},
						{
							active: true,
							text: t.aiAssistant.translateToEnglish,
							onClick: () => {
								setTranslationDialogOpen(false);
								void run('translate', 'en');
							},
							icon: <LanguageFlag language="en" />,
							color: '#0D070B',
						},
					]}
				/>
			)}

			<Dialog
				open={Boolean(result || error)}
				onClose={() => {
					setResult(null);
					setError('');
				}}
				fullWidth={Boolean(result)}
				maxWidth={result ? 'md' : 'sm'}
			>
				<DialogTitle>{t.aiAssistant.previewTitle}</DialogTitle>
				<DialogContent>
					<Stack spacing={2} sx={{ mt: 1 }}>
						{result && (
							<Box>
								<Typography variant="subtitle2" gutterBottom>
									{t.aiAssistant.original}
								</Typography>
								<Paper variant="outlined" sx={{ p: 2, whiteSpace: 'pre-wrap' }} data-testid="original-text">
									<DiffText changes={changes} variant="original" />
								</Paper>
							</Box>
						)}
						{result && (
							<Box>
								<Typography variant="subtitle2" gutterBottom>
									{t.aiAssistant.suggestion}
								</Typography>
								<Paper variant="outlined" sx={{ p: 2, whiteSpace: 'pre-wrap' }} data-testid="suggested-text">
									<DiffText changes={changes} variant="suggestion" />
								</Paper>
							</Box>
						)}
						{error && <Alert severity="error">{error}</Alert>}
						{stale && <Alert severity="warning">{t.aiAssistant.fieldChanged}</Alert>}
						{tooLong && <Alert severity="warning">{t.aiAssistant.suggestionTooLong}</Alert>}
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button
						onClick={() => {
							setResult(null);
							setError('');
						}}
					>
						{t.aiAssistant.cancel}
					</Button>
					<Button onClick={() => void retry()} disabled={isLoading}>
						{t.aiAssistant.tryAgain}
					</Button>
					<Button
						variant="contained"
						disabled={!canApply}
						onClick={() => {
							if (result && canApply) onApply(result.suggested_text);
							setResult(null);
						}}
					>
						{t.aiAssistant.useSuggestion}
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
};

const AiAssistantControl: FC<AiAssistantControlProps> = (props) => {
	if (!isEnabled()) return null;
	return <EnabledAiAssistantControl {...props} />;
};

export default AiAssistantControl;
