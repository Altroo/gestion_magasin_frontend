import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AiAssistantControl from './aiAssistantControl';

const assistText = jest.fn();
const onSuccess = jest.fn();
let mockMutationState = { isLoading: false };

jest.mock('@/store/services/aiAssistant', () => ({
	useAssistTextMutation: () => [assistText, mockMutationState],
}));

jest.mock('@/utils/hooks', () => ({
	useToast: () => ({ onSuccess, onError: jest.fn() }),
	useLanguage: () => ({
		t: {
			aiAssistant: {
				translate: 'Translate',
				fixGrammar: 'Fix grammar',
				professionalize: 'Make professional',
				translateToFrench: 'French',
				translateToEnglish: 'English',
				chooseLanguage: 'Choose a translation language.',
				previewTitle: 'AI assistant suggestion',
				original: 'Original text',
				suggestion: 'Suggestion',
				useSuggestion: 'Use suggestion',
				tryAgain: 'Try again',
				cancel: 'Cancel',
				emptyText: 'Enter text first.',
				requestError: 'Request failed.',
				alreadyCorrect: 'The text is already correct.',
				alreadyProfessional: 'The text is already professionally written.',
			},
		},
	}),
}));

const response = {
	original_text: 'texte source',
	suggested_text: 'source text',
	detected_language: 'fr' as const,
	model: 'qwen3.6-35b-a3b-q5_k_m',
	cached: false,
	processing_ms: 120,
};

describe('AiAssistantControl', () => {
	const originalFlag = process.env.NEXT_PUBLIC_AI_ASSISTANT_ENABLED;

	beforeEach(() => {
		jest.clearAllMocks();
		mockMutationState = { isLoading: false };
		process.env.NEXT_PUBLIC_AI_ASSISTANT_ENABLED = 'true';
	});

	afterAll(() => {
		if (originalFlag === undefined) {
			delete process.env.NEXT_PUBLIC_AI_ASSISTANT_ENABLED;
		} else {
			process.env.NEXT_PUBLIC_AI_ASSISTANT_ENABLED = originalFlag;
		}
	});

	it('stays hidden while the rollout flag is disabled', () => {
		process.env.NEXT_PUBLIC_AI_ASSISTANT_ENABLED = 'false';
		render(<AiAssistantControl value="texte" context="project" onApply={jest.fn()} />);
		expect(screen.queryByRole('button')).not.toBeInTheDocument();
	});

	it('offers French/English translation and applies only after confirmation', async () => {
		const onApply = jest.fn();
		assistText.mockReturnValue({ unwrap: () => Promise.resolve(response) });
		render(<AiAssistantControl value="texte source" context="project" onApply={onApply} />);

		fireEvent.click(screen.getByRole('button', { name: 'Translate' }));
		expect(await screen.findByRole('button', { name: 'French' })).toBeInTheDocument();
		fireEvent.click(await screen.findByRole('button', { name: 'English' }));

		expect(await screen.findByTestId('suggested-text')).toHaveTextContent('source text');
		expect(onApply).not.toHaveBeenCalled();
		expect(assistText).toHaveBeenCalledWith({
			action: 'translate',
			text: 'texte source',
			source_language: 'auto',
			target_language: 'en',
			context: 'project',
		});

		fireEvent.click(screen.getByRole('button', { name: 'Use suggestion' }));
		expect(onApply).toHaveBeenCalledWith('source text');
	});

	it.each([
		['Fix grammar', 'fix_grammar'],
		['Make professional', 'professionalize'],
	])('runs %s without changing the source language', async (label, action) => {
		assistText.mockReturnValue({ unwrap: () => Promise.resolve(response) });
		render(<AiAssistantControl value="texte source" context="expense" onApply={jest.fn()} />);

		fireEvent.click(screen.getByRole('button', { name: label }));
		expect(await screen.findByTestId('suggested-text')).toHaveTextContent('source text');
		expect(assistText).toHaveBeenCalledWith({
			action,
			text: 'texte source',
			source_language: 'auto',
			target_language: undefined,
			context: 'expense',
		});
	});

	it('preserves the source and supports retry after a failed request', async () => {
		assistText
			.mockReturnValueOnce({ unwrap: () => Promise.reject({ data: { message: 'Model unavailable' } }) })
			.mockReturnValueOnce({ unwrap: () => Promise.resolve(response) });
		render(<AiAssistantControl value="texte source" context="supplier" onApply={jest.fn()} />);

		fireEvent.click(screen.getByRole('button', { name: 'Fix grammar' }));
		await screen.findByText('Model unavailable');
		fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

		await waitFor(() => expect(screen.getByTestId('suggested-text')).toHaveTextContent('source text'));
		expect(assistText).toHaveBeenCalledTimes(2);
	});

	it('cancels a preview without applying or saving the suggestion', async () => {
		const onApply = jest.fn();
		assistText.mockReturnValue({ unwrap: () => Promise.resolve(response) });
		render(<AiAssistantControl value="texte source" context="project" onApply={onApply} />);

		fireEvent.click(screen.getByRole('button', { name: 'Fix grammar' }));
		expect(await screen.findByTestId('suggested-text')).toHaveTextContent('source text');
		fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

		expect(onApply).not.toHaveBeenCalled();
		expect(screen.queryByTestId('suggested-text')).not.toBeInTheDocument();
	});

	it.each([
		['Fix grammar', 'The text is already correct.'],
		['Make professional', 'The text is already professionally written.'],
	])('shows a toast for an unchanged %s result without opening a preview', async (label, message) => {
		const onApply = jest.fn();
		assistText.mockReturnValue({
			unwrap: () =>
				Promise.resolve({
					...response,
					original_text: 'Le rapport est prêt.',
					suggested_text: '  Le rapport est prêt.\n',
				}),
		});
		render(<AiAssistantControl value="Le rapport est prêt." context="project" onApply={onApply} />);

		fireEvent.click(screen.getByRole('button', { name: label }));

		await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(message));
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		expect(screen.queryByTestId('suggested-text')).not.toBeInTheDocument();
		expect(onApply).not.toHaveBeenCalled();
	});

	it('highlights removed text in red and added text in yellow', async () => {
		assistText.mockReturnValue({
			unwrap: () =>
				Promise.resolve({
					...response,
					original_text: 'Le rapport sont prêt.',
					suggested_text: 'Le rapport est prêt.',
				}),
		});
		render(<AiAssistantControl value="Le rapport sont prêt." context="project" onApply={jest.fn()} />);

		fireEvent.click(screen.getByRole('button', { name: 'Fix grammar' }));
		await screen.findByTestId('suggested-text');

		expect(screen.getByTestId('original-text').querySelector('mark[data-change="removed"]')).toHaveTextContent('on');
		expect(screen.getByTestId('suggested-text').querySelector('mark[data-change="added"]')).toHaveTextContent('e');
	});

	it('disables actions and shows progress while a request is running', () => {
		mockMutationState = { isLoading: true };
		render(<AiAssistantControl value="texte source" context="project" onApply={jest.fn()} />);

		expect(screen.getByRole('button', { name: 'Translate' })).toBeDisabled();
		expect(screen.getByRole('button', { name: 'Fix grammar' })).toBeDisabled();
		expect(screen.getByRole('progressbar')).toBeInTheDocument();
	});
});

describe('Suggestion safety', () => {
	beforeEach(() => {
		process.env.NEXT_PUBLIC_AI_ASSISTANT_ENABLED = 'true';
		mockMutationState = { isLoading: false };
		assistText.mockReturnValue({ unwrap: () => Promise.resolve(response) });
	});
	afterEach(() => {
		delete process.env.NEXT_PUBLIC_AI_ASSISTANT_ENABLED;
	});
	it('does not overwrite a field changed while the suggestion was open', async () => {
		const onApply = jest.fn();
		const { rerender } = render(<AiAssistantControl value="texte source" context="form" onApply={onApply} />);
		fireEvent.click(screen.getByRole('button', { name: 'Fix grammar' }));
		await screen.findByTestId('suggested-text');
		rerender(<AiAssistantControl value="texte modifié" context="form" onApply={onApply} />);
		expect(screen.getByRole('button', { name: 'Use suggestion' })).toBeDisabled();
		expect(onApply).not.toHaveBeenCalled();
	});
	it('rejects a suggestion longer than the field allows', async () => {
		render(<AiAssistantControl value="texte source" context="form" maxLength={5} onApply={jest.fn()} />);
		fireEvent.click(screen.getByRole('button', { name: 'Fix grammar' }));
		await screen.findByTestId('suggested-text');
		expect(screen.getByRole('button', { name: 'Use suggestion' })).toBeDisabled();
	});
});
