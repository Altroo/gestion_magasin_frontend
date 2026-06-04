'use client';

import React, { useRef, useCallback, useState } from 'react';
import Styles from './customSquareImageUploading.module.sass';
import { Box, Stack } from '@mui/material';
import Image from 'next/image';
import { HighlightOff as HighlightOffIcon } from '@mui/icons-material';
import SquareImageInputFile from '../../htmlElements/buttons/squareImageInputFile/squareImageInputFile';
import Cropper, { type ReactCropperElement } from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import { useLanguage } from '@/utils/hooks';

type Props = {
	image: string | ArrayBuffer | null;
	croppedImage?: string | ArrayBuffer | null;
	onChange: (image: string | ArrayBuffer | null) => void;
	onCrop: (data: string | null) => void;
	cssClasse?: string;
};

const CustomSquareImageUploading: React.FC<Props> = ({ image, croppedImage, onChange, onCrop, cssClasse }) => {
	const cropperRef = useRef<ReactCropperElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const { t } = useLanguage();

	const [isNewUpload, setIsNewUpload] = useState(false);
	const [isEditing, setIsEditing] = useState(false);

	const handleImageUploadClick = (): void => {
		if (fileInputRef.current) {
			fileInputRef.current.click();
		}
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = () => {
				onChange(reader.result);
				onCrop(null);
				setIsNewUpload(true);
				setIsEditing(true);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleCrop = useCallback(() => {
		const cropper = cropperRef.current?.cropper;
		if (!cropper) return;

		const canvas = cropper.getCroppedCanvas();
		if (canvas && canvas.width > 0 && canvas.height > 0) {
			const croppedData = canvas.toDataURL('image/png');
			onCrop(croppedData);
		}
	}, [onCrop]);

	const handleClear = () => {
		onChange(null);
		onCrop(null);
		setIsNewUpload(false);
		setIsEditing(false);
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	};

	const handleReady = useCallback(() => {
		if (isNewUpload) {
			handleCrop();
			setIsNewUpload(false);
		}
	}, [isNewUpload, handleCrop]);

	const handleEditClick = () => {
		setIsEditing(true);
	};

	const showCropper = isEditing || !croppedImage || isNewUpload;
	const displayImage = showCropper ? image : croppedImage;

	return (
		<Stack className={`${Styles.rootStackWrapper} ${cssClasse}`} direction="row" alignItems="center">
			<input
				type="file"
				accept="image/jpeg,image/png"
				style={{ display: 'none' }}
				ref={fileInputRef}
				onChange={handleFileChange}
			/>
			{displayImage ? (
				<Stack className={Styles.addImagesWrapper} direction="row" justifyContent="center" alignItems="center">
					{showCropper ? (
						<>
							<Cropper
								ref={cropperRef}
								className={Styles.showImage}
								src={typeof image === 'string' ? image : ''}
								cropBoxResizable={false}
								initialAspectRatio={36 / 25}
								minCropBoxWidth={360}
								minCropBoxHeight={250}
								minCanvasWidth={360}
								minCanvasHeight={250}
								minContainerWidth={360}
								minContainerHeight={250}
								dragMode="move"
								viewMode={3}
								ready={handleReady}
								cropend={handleCrop}
							/>
							<Box className={Styles.closeButtonWrapper} onClick={handleClear} data-testid="clear-button">
								<HighlightOffIcon sx={{ fontSize: 32 }} htmlColor="black" aria-hidden="true" />
							</Box>
						</>
					) : (
						<>
							<Box
								className={Styles.showImage}
								sx={{ position: 'relative', cursor: 'pointer' }}
								onClick={handleEditClick}
							>
								<Image
									loading="eager"
									width={360}
									height={250}
									src={typeof croppedImage === 'string' ? croppedImage : ''}
									alt={t.common.croppedPreview}
									style={{ width: '100%', height: '100%', objectFit: 'cover' }}
								/>
								<Box
									sx={{
										position: 'absolute',
										top: 0,
										left: 0,
										right: 0,
										bottom: 0,
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										background: 'rgba(0,0,0,0.5)',
										opacity: 0,
										transition: 'opacity 0.2s',
										'&:hover': { opacity: 1 },
									}}
								>
									<span style={{ color: 'white', fontSize: '14px' }}>{t.common.clickToEditCrop}</span>
								</Box>
							</Box>
							<Box className={Styles.closeButtonWrapper} onClick={handleClear}>
								<HighlightOffIcon sx={{ fontSize: 32 }} htmlColor="black" aria-hidden="true" />
							</Box>
						</>
					)}
				</Stack>
			) : (
				<SquareImageInputFile onImageUpload={handleImageUploadClick} />
			)}
		</Stack>
	);
};

export default CustomSquareImageUploading;
