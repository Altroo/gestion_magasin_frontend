import { render, screen } from '@testing-library/react';
import AiTextField from './aiTextField';

jest.mock('@/components/shared/aiAssistantControl/aiAssistantControl', () => ({
	__esModule: true,
	default: () => <div data-testid="ai-controls" />,
}));

const props = { value: 'Texte', onChange: jest.fn() };
describe('AI controls on reviewed writing fields only', () => {
	it.each(['barcode', 'first_name', 'client_nom', 'adresse', 'st_capital', 'superficie', 'name', 'unreviewed'])(
		'hides AI for %s',
		(name) => {
			render(<AiTextField {...props} name={name} label="Description" />);
			expect(screen.queryByTestId('ai-controls')).not.toBeInTheDocument();
		},
	);
	it('does not infer eligibility from a translated label', () => {
		render(<AiTextField {...props} label="Description" />);
		expect(screen.queryByTestId('ai-controls')).not.toBeInTheDocument();
	});
	it('shows AI for a reviewed prose field', () => {
		render(<AiTextField {...props} name="note" />);
		expect(screen.getByTestId('ai-controls')).toBeInTheDocument();
	});
	it('allows an explicitly reviewed descriptive product name', () => {
		render(<AiTextField {...props} name="name" ai />);
		expect(screen.getByTestId('ai-controls')).toBeInTheDocument();
		expect(screen.getByRole('textbox')).not.toHaveAttribute('ai');
	});
	it.each([
		{ ai: false },
		{ disabled: true },
		{ type: 'number', ai: true },
		{ select: true, ai: true, value: '' },
		{ slotProps: { input: { readOnly: true } } },
		{ slotProps: { htmlInput: { readOnly: true } } },
	])('keeps non-editable and non-text controls free of AI: %j', (extra) => {
		render(<AiTextField {...props} name="note" {...extra} />);
		expect(screen.queryByTestId('ai-controls')).not.toBeInTheDocument();
	});
});
