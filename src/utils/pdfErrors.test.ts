import { PdfTranslationDeferredError, showPdfError } from './pdfErrors';

it('shows queued work as information and genuine PDF failures as errors', () => {
	const onError = jest.fn();
	const onInfo = jest.fn();
	showPdfError(new PdfTranslationDeferredError(), onError, onInfo, 'Queued', 'Failed');
	expect(onInfo).toHaveBeenCalledWith('Queued');
	expect(onError).not.toHaveBeenCalled();
	showPdfError(new Error('unavailable'), onError, onInfo, 'Queued', 'Failed');
	expect(onError).toHaveBeenCalledWith('Failed');
});
