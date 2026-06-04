import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import CustomSquareImageUploading from './customSquareImageUploading';
import '@testing-library/jest-dom';

interface MockCallbacks {
	readyCallback: (() => void) | null;
	cropendCallback: (() => void) | null;
	cropperRef: { cropper: { getCroppedCanvas: () => HTMLCanvasElement | null } } | null;
}

// Store callback refs for testing - use object to avoid reassignment
(global as unknown as { __mockCallbacks: MockCallbacks }).__mockCallbacks = {
	readyCallback: null as (() => void) | null,
	cropendCallback: null as (() => void) | null,
	cropperRef: null as { cropper: { getCroppedCanvas: () => HTMLCanvasElement | null } } | null,
};
const mockCallbacks = (global as unknown as { __mockCallbacks: MockCallbacks }).__mockCallbacks;

jest.mock('@mui/icons-material/HighlightOffOutlined', () => {
	return {
		__esModule: true,
		default: (props: React.SVGProps<SVGSVGElement> & { htmlColor?: string }) => {
			const { htmlColor, ...rest } = props;
			const svgProps: React.SVGProps<SVGSVGElement> = { ...rest };
			if (htmlColor) {
				svgProps.fill = htmlColor;
			}
			return React.createElement('svg', svgProps);
		},
	};
});
jest.mock('next/image', () => {
	return {
		__esModule: true,
		default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => React.createElement('img', props),
	};
});

jest.mock('@/utils/hooks', () => ({
	useLanguage: () => ({ language: 'fr', setLanguage: jest.fn(), t: jest.requireActual('@/translations').translations.fr }),
}));

// Mock react-cropper to capture and expose callbacks
jest.mock('react-cropper', () => {
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const React = require('react');
	return {
		__esModule: true,
		default: React.forwardRef(function MockCropper(
			props: {
				ready?: () => void;
				cropend?: () => void;
				children?: React.ReactNode;
			},
			ref: React.Ref<{ cropper: { getCroppedCanvas: () => HTMLCanvasElement | null } }>,
		) {
			// Store callbacks for manual triggering via global
			const mockCallbacksRef = (global as unknown as { __mockCallbacks: MockCallbacks }).__mockCallbacks;
			// eslint-disable-next-line react-hooks/immutability
			mockCallbacksRef.readyCallback = props.ready || null;
			// eslint-disable-next-line react-hooks/immutability
			mockCallbacksRef.cropendCallback = props.cropend || null;

			// Create mock cropper ref
			// eslint-disable-next-line react-hooks/immutability
			mockCallbacksRef.cropperRef = {
				cropper: {
					getCroppedCanvas: () => {
						const canvas = document.createElement('canvas');
						canvas.width = 100;
						canvas.height = 100;
						canvas.toDataURL = () => 'data:image/png;base64,croppedData';
						return canvas;
					},
				},
			};

			// Expose mock cropper via ref
			React.useImperativeHandle(ref, () => mockCallbacksRef.cropperRef!);

			return React.createElement('div', { role: 'presentation', 'data-testid': 'cropper' }, props.children);
		}),
	};
});

describe('CustomSquareImageUploading (with MUI icon mock)', () => {
	const mockOnChange: jest.MockedFunction<(image: string | ArrayBuffer | null) => void> = jest.fn();
	const mockOnCrop: jest.MockedFunction<(data: string | null) => void> = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
		mockCallbacks.readyCallback = null;
		mockCallbacks.cropendCallback = null;
	});

	it('renders upload button when no image is provided', () => {
		render(<CustomSquareImageUploading image={null} onChange={mockOnChange} onCrop={mockOnCrop} />);

		const button = screen.getByRole('button');
		expect(button).toBeInTheDocument();
	});

	it('renders cropper when image is provided and no croppedImage', () => {
		render(
			<CustomSquareImageUploading image="data:image/png;base64,test" onChange={mockOnChange} onCrop={mockOnCrop} />,
		);

		const cropper = screen.getByRole('presentation');
		expect(cropper).toBeInTheDocument();
	});

	it('renders cropped image preview when not editing', () => {
		render(
			<CustomSquareImageUploading
				image="data:image/png;base64:original"
				croppedImage="data:image/png;base64:cropped"
				onChange={mockOnChange}
				onCrop={mockOnCrop}
			/>,
		);

		const preview = screen.getByAltText('Aperçu recadré');
		expect(preview).toBeInTheDocument();
	});

	it('calls onChange and onCrop when clear button is clicked', () => {
		render(
			<CustomSquareImageUploading image="data:image/png;base64,test" onChange={mockOnChange} onCrop={mockOnCrop} />,
		);

		const clearButton = screen.getByTestId('clear-button');
		fireEvent.click(clearButton);

		expect(mockOnChange).toHaveBeenCalledWith(null);
		expect(mockOnCrop).toHaveBeenCalledWith(null);
	});

	it('enters editing mode when cropped image is clicked', () => {
		render(
			<CustomSquareImageUploading
				image="data:image/png;base64:original"
				croppedImage="data:image/png;base64:cropped"
				onChange={mockOnChange}
				onCrop={mockOnCrop}
			/>,
		);

		const preview = screen.getByAltText('Aperçu recadré');
		fireEvent.click(preview);

		const cropper = screen.getByRole('presentation');
		expect(cropper).toBeInTheDocument();
	});

	it('handles file upload correctly', async () => {
		render(<CustomSquareImageUploading image={null} onChange={mockOnChange} onCrop={mockOnCrop} />);

		const uploadButton = screen.getByRole('button');
		fireEvent.click(uploadButton);

		const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
		expect(fileInput).toBeInTheDocument();

		const file = new File(['test'], 'test.png', { type: 'image/png' });
		const mockFileReader = {
			readAsDataURL: jest.fn(),
			result: 'data:image/png;base64,uploadedImage',
			onload: null as ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null,
		};

		jest.spyOn(window, 'FileReader').mockImplementation(() => mockFileReader as unknown as FileReader);

		fireEvent.change(fileInput, { target: { files: [file] } });

		// Trigger onload wrapped in act
		await act(async () => {
			if (mockFileReader.onload) {
				mockFileReader.onload.call(mockFileReader as unknown as FileReader, {} as ProgressEvent<FileReader>);
			}
		});

		await waitFor(() => {
			expect(mockOnChange).toHaveBeenCalledWith('data:image/png;base64,uploadedImage');
			expect(mockOnCrop).toHaveBeenCalledWith(null);
		});
	});

	it('handles file upload with no files', () => {
		render(<CustomSquareImageUploading image={null} onChange={mockOnChange} onCrop={mockOnCrop} />);

		const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
		fireEvent.change(fileInput, { target: { files: [] } });

		expect(mockOnChange).not.toHaveBeenCalled();
	});

	it('handles file upload with null files', () => {
		render(<CustomSquareImageUploading image={null} onChange={mockOnChange} onCrop={mockOnCrop} />);

		const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
		fireEvent.change(fileInput, { target: { files: null } });

		expect(mockOnChange).not.toHaveBeenCalled();
	});

	it('triggers handleReady callback and crops on new upload', async () => {
		render(
			<CustomSquareImageUploading image="data:image/png;base64,test" onChange={mockOnChange} onCrop={mockOnCrop} />,
		);

		// Simulate file upload to set isNewUpload to true
		const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
		const file = new File(['test'], 'test.png', { type: 'image/png' });
		const mockFileReader = {
			readAsDataURL: jest.fn(),
			result: 'data:image/png;base64,newImage',
			onload: null as ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null,
		};

		jest.spyOn(window, 'FileReader').mockImplementation(() => mockFileReader as unknown as FileReader);
		fireEvent.change(fileInput, { target: { files: [file] } });

		await act(async () => {
			if (mockFileReader.onload) {
				mockFileReader.onload.call(mockFileReader as unknown as FileReader, {} as ProgressEvent<FileReader>);
			}
		});

		await waitFor(() => {
			expect(mockOnChange).toHaveBeenCalledWith('data:image/png;base64,newImage');
		});

		// Trigger the ready callback (simulates cropper being ready)
		await act(async () => {
			if (mockCallbacks.readyCallback) {
				mockCallbacks.readyCallback();
			}
		});

		await waitFor(() => {
			expect(mockOnCrop).toHaveBeenCalledWith('data:image/png;base64,croppedData');
		});
	});

	it('triggers cropend callback', async () => {
		render(
			<CustomSquareImageUploading image="data:image/png;base64,test" onChange={mockOnChange} onCrop={mockOnCrop} />,
		);

		// Trigger the cropend callback
		await act(async () => {
			if (mockCallbacks.cropendCallback) {
				mockCallbacks.cropendCallback();
			}
		});

		await waitFor(() => {
			expect(mockOnCrop).toHaveBeenCalledWith('data:image/png;base64,croppedData');
		});
	});

	it('clears input value when handleClear is called', () => {
		render(
			<CustomSquareImageUploading image="data:image/png;base64,test" onChange={mockOnChange} onCrop={mockOnCrop} />,
		);

		const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

		// Set a value manually
		Object.defineProperty(fileInput, 'value', { writable: true, value: 'somefile.png' });

		const clearButton = screen.getByTestId('clear-button');
		fireEvent.click(clearButton);

		expect(fileInput.value).toBe('');
	});

	it('applies custom cssClasse', () => {
		const { container } = render(
			<CustomSquareImageUploading
				image={null}
				onChange={mockOnChange}
				onCrop={mockOnCrop}
				cssClasse="custom-class"
			/>,
		);

		const wrapper = container.firstChild;
		expect(wrapper).toHaveClass('custom-class');
	});

	it('clears Aperçu recadré when clear is clicked in non-editing mode', () => {
		render(
			<CustomSquareImageUploading
				image="data:image/png;base64:original"
				croppedImage="data:image/png;base64:cropped"
				onChange={mockOnChange}
				onCrop={mockOnCrop}
			/>,
		);

		// Find the close button by clicking on the parent box
		const preview = screen.getByAltText('Aperçu recadré');
		const parent = preview.closest('div');
		const closeButton = parent?.parentElement?.querySelector('[class*="closeButtonWrapper"]');
		if (closeButton) {
			fireEvent.click(closeButton);
			expect(mockOnChange).toHaveBeenCalledWith(null);
			expect(mockOnCrop).toHaveBeenCalledWith(null);
		}
	});

	it('handles handleReady when not a new upload (edit mode)', async () => {
		render(
			<CustomSquareImageUploading
				image="data:image/png;base64:original"
				croppedImage="data:image/png;base64:cropped"
				onChange={mockOnChange}
				onCrop={mockOnCrop}
			/>,
		);

		// Enter edit mode by clicking preview
		const preview = screen.getByAltText('Aperçu recadré');
		fireEvent.click(preview);

		// Trigger ready callback - should not crop since isNewUpload is false
		await act(async () => {
			if (mockCallbacks.readyCallback) {
				mockCallbacks.readyCallback();
			}
		});

		// onCrop should not be called since it's not a new upload
		expect(mockOnCrop).not.toHaveBeenCalled();
	});
});
