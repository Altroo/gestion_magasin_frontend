import { createTheme } from '@mui/material/styles';
import { hexToRGB } from './helpers';

export const FORM_FIELD_HEIGHT = 44;
export const FORM_FIELD_RADIUS = '16px';

export const CustomTheme = (primaryColor: string | undefined = undefined) => {
	let rippleColor = '#0D070B';
	if (primaryColor) {
		if (primaryColor !== '#FFFFFF') {
			rippleColor = hexToRGB(primaryColor, 0.5);
		} else {
			rippleColor = hexToRGB(rippleColor, 0.5);
		}
	}
	/*
	$mobile : (max-width: 767px)'
	$tablette : (min-width: 768px) and (max-width: 991px)'
	$tablette : (max-width: 991px)'
	$desktop : (min-width: 992px)'
	$large : (min-width: 1200px) and (max-width: 1919px)'
	$wide : (min-width: 1920px)'
	 */
	return createTheme({
		palette: {
			primary: {
				main: rippleColor,
			},
			success: {
				main: 'rgb(129, 199, 132)',
			},
			error: {
				main: 'rgb(229, 115, 115)',
			},
		},
		breakpoints: {
			values: {
				xs: 0,
				sm: 600,
				md: 992,
				lg: 1200,
				xl: 1536,
			},
		},
		typography: {
			fontFamily: 'Poppins',
		},
	});
};

export const getDefaultTheme = (primaryColor: string | undefined = undefined) => {
	const defaultColor = '#0274D7';
	if (primaryColor) {
		return CustomTheme(primaryColor);
	} else {
		return CustomTheme(defaultColor);
	}
};

export const textInputTheme = (primaryColor: string | undefined = undefined) => {
	const defaultTheme = getDefaultTheme(primaryColor);
	const blueColor = '#0274d7';

	return createTheme({
		...defaultTheme,
		components: {
			MuiInputBase: {
				styleOverrides: {
					root: {
						'&.MuiInputBase-sizeSmall:not(.MuiInputBase-multiline)': {
							minHeight: FORM_FIELD_HEIGHT,
							height: FORM_FIELD_HEIGHT,
						},
						'& fieldset': {
							borderRadius: FORM_FIELD_RADIUS,
							border: '1px solid #A3A3AD',
						},
						'& fieldset > legend': {
							fontFamily: 'Poppins',
							fontSize: '14px',
						},
					},
					input: {
						fontFamily: 'Poppins',
						fontSize: '19px',
						caretColor: blueColor,
					},
				},
			},
			MuiFormControl: {
				styleOverrides: {
					root: {
						'& .MuiFormLabel-root': {
							fontFamily: 'Poppins',
							fontSize: '19px',
							color: '#A3A3AD',
						},
						'& .MuiFormLabel-root.Mui-focused': {
							fontFamily: 'Poppins',
							fontSize: '19px',
							color: blueColor,
						},
					},
				},
			},
		},
	});
};

export const navigationBarTheme = (primaryColor: string | undefined = undefined) => {
	const defaultTheme = getDefaultTheme(primaryColor);
	return createTheme({
		...defaultTheme,
		components: {
			MuiAppBar: {
				styleOverrides: {
					root: {
						backgroundColor: 'white',
						color: '#0D070B',
						boxShadow: '0px 0px 24px rgba(13, 7, 11, 0.2)',
					},
				},
			},
			MuiAccordionSummary: {
				styleOverrides: {
					content: {
						fontSize: '15px',
					},
				},
			},
			MuiListItemText: {
				styleOverrides: {
					primary: {
						fontSize: '15px',
					},
				},
			},
			MuiListItemButton: {
				styleOverrides: {
					root: {
						fontSize: '15px',
					},
				},
			},
		},
	});
};

export const customDropdownTheme = (primaryColor: string | undefined = undefined) => {
	const defaultTheme = getDefaultTheme(primaryColor);
	const blueColor = '#0274d7';

	return createTheme({
		...defaultTheme,
		components: {
			MuiAutocomplete: {
				styleOverrides: {
					root: {
						'& .MuiOutlinedInput-root': {
							borderRadius: FORM_FIELD_RADIUS,
							minHeight: FORM_FIELD_HEIGHT,
							fontFamily: 'Poppins',
							fontSize: '16px',
							paddingTop: 0,
							paddingBottom: 0,
							'& fieldset': {
								borderRadius: FORM_FIELD_RADIUS,
								borderColor: '#A3A3AD',
							},
							'&:hover fieldset': {
								borderColor: blueColor,
							},
							'&.Mui-focused fieldset': {
								borderColor: blueColor,
							},
						},
						'& .MuiAutocomplete-input': {
							fontFamily: 'Poppins',
							fontSize: '16px',
							caretColor: blueColor,
							paddingTop: '0 !important',
							paddingBottom: '0 !important',
						},
						'& .MuiAutocomplete-inputRoot[class*="MuiOutlinedInput-root"]': {
							minHeight: FORM_FIELD_HEIGHT,
							paddingTop: 0,
							paddingBottom: 0,
						},
						'& .MuiAutocomplete-inputRoot[class*="MuiOutlinedInput-root"][class*="MuiInputBase-sizeSmall"]': {
							height: FORM_FIELD_HEIGHT,
							minHeight: FORM_FIELD_HEIGHT,
						},
					},
					paper: {
						borderRadius: FORM_FIELD_RADIUS,
						border: `1px solid ${blueColor}`,
						boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.1)',
						marginTop: '4px',
					},
					option: {
						fontFamily: 'Poppins',
						fontSize: '16px',
					},
				},
			},
			MuiInputBase: {
				styleOverrides: {
					root: {
						'&.MuiInputBase-sizeSmall:not(.MuiInputBase-multiline)': {
							minHeight: FORM_FIELD_HEIGHT,
							height: FORM_FIELD_HEIGHT,
						},
						'& fieldset': {
							borderRadius: FORM_FIELD_RADIUS,
							border: '1px solid #A3A3AD',
						},
						'& fieldset > legend': {
							fontFamily: 'Poppins',
							fontSize: '14px',
						},
					},
					input: {
						fontFamily: 'Poppins',
						fontSize: '19px',
						caretColor: blueColor,
					},
				},
			},
			MuiFormControl: {
				styleOverrides: {
					root: {
						'& .MuiFormLabel-root': {
							fontFamily: 'Poppins',
							fontSize: '16px',
							color: '#A3A3AD',
						},
						'& .MuiFormLabel-root.Mui-focused': {
							fontFamily: 'Poppins',
							fontSize: '19px',
							color: blueColor,
						},
					},
				},
			},
			MuiMenuItem: {
				styleOverrides: {
					gutters: {
						fontFamily: 'Poppins',
						fontSize: '16px',
						paddingTop: '10px',
						paddingBottom: '10px',
					},
				},
			},
			MuiPaper: {
				styleOverrides: {
					root: {
						border: `1px solid ${blueColor}`,
						borderBottomLeftRadius: '21px',
						borderBottomRightRadius: '21px',
					},
				},
			},
		},
	});
};

export const codeTextInputTheme = (error: boolean | undefined) => {
	const validColor = '#07CBAD';
	const defaultTheme = getDefaultTheme(validColor);
	let borderColor = '#D9D9DD';
	if (error) {
		borderColor = '#E12D3D';
	}
	return createTheme({
		...defaultTheme,
		components: {
			MuiInputBase: {
				styleOverrides: {
					root: {
						'& fieldset': {
							borderTop: '2px solid',
							borderRight: '2px solid',
							borderLeft: '2px solid',
							borderBottom: `2px solid ${borderColor}`,
						},
					},
					input: {
						textAlign: 'center',
						fontFamily: 'Poppins',
						fontSize: '42px',
						caretColor: validColor,
					},
				},
			},
			MuiOutlinedInput: {
				styleOverrides: {
					notchedOutline: {
						borderRadius: '0px !important',
						borderTop: '2px solid transparent !important',
						borderRight: '2px solid transparent !important',
						borderLeft: '2px solid transparent !important',
						borderBottom: `2px solid ${borderColor}`,
					},
				},
			},
		},
	});
};

export const chipSelectFilterTheme = (primaryColor: string | undefined = undefined) => {
	const defaultTheme = getDefaultTheme(primaryColor);
	const blueColor = '#0274d7';

	return createTheme({
		...defaultTheme,
		components: {
			MuiAutocomplete: {
				styleOverrides: {
					root: {
						'& .MuiOutlinedInput-root': {
							backgroundColor: '#FFFFFF',
							borderRadius: '16px',
							fontFamily: 'Poppins',
							fontSize: '14px',
							'& fieldset': {
								borderColor: '#A3A3AD',
								borderWidth: '1px',
								borderRadius: '16px',
							},
							'&:hover fieldset': {
								borderColor: blueColor,
							},
							'&.Mui-focused fieldset': {
								borderColor: blueColor,
								borderWidth: '2px',
							},
						},
					},
					inputRoot: {
						flexWrap: 'wrap',
					},
					paper: {
						borderRadius: '16px',
						boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.1)',
						marginTop: '4px',
					},
					option: {
						fontFamily: 'Poppins',
						fontSize: '14px',
					},
				},
			},
			MuiInputBase: {
				styleOverrides: {
					input: {
						fontFamily: 'Poppins',
						fontSize: '14px',
						caretColor: blueColor,
					},
				},
			},
			MuiChip: {
				styleOverrides: {
					root: {
						fontFamily: 'Poppins',
						fontSize: '12px',
						borderRadius: '8px',
					},
				},
			},
			MuiFormLabel: {
				styleOverrides: {
					root: {
						fontFamily: 'Poppins',
						fontSize: '14px',
						color: '#A3A3AD',
						'&.Mui-focused': {
							color: blueColor,
						},
					},
				},
			},
		},
	});
};

export const customToastTheme = (primaryColor: string | undefined = undefined) => {
	const defaultTheme = getDefaultTheme(primaryColor);
	return createTheme({
		...defaultTheme,
		components: {
			MuiSnackbar: {
				styleOverrides: {
					root: {
						width: '20%',
						backgroundColor: 'white',
						borderRadius: '20px',
						position: 'absolute',
						margin: '0 auto',
					},
				},
			},
			MuiPaper: {
				styleOverrides: {
					root: {
						borderRadius: '20px',
						boxShadow: '0px 0px 24px rgba(13, 7, 11, 0.1)',
						'&.MuiAlert-outlinedWarning': {
							border: '1px solid rgba(255, 45, 61, 0.2)',
						},
						'&.MuiAlert-outlinedSuccess': {
							border: '1px solid rgba(7, 203, 173, 0.2)',
						},
						'&.MuiAlert-outlinedError': {
							border: '1px solid rgba(255, 45, 61, 0.2)',
						},
						'&.MuiAlert-outlinedInfo': {
							border: '1px solid rgba(2, 116, 215, 0.2)',
						},
					},
				},
			},
		},
	});
};

export const gridInputTheme = (primaryColor: string | undefined = undefined) => {
	const defaultTheme = getDefaultTheme(primaryColor);
	const blueColor = '#0274d7';
	return createTheme({
		...defaultTheme,
		components: {
			MuiInputBase: {
				styleOverrides: {
					root: {
						'& fieldset > legend': {
							fontFamily: 'Poppins',
							fontSize: '0.875rem',
						},
					},
					input: {
						fontFamily: 'Poppins',
						fontSize: '0.875rem',
						caretColor: blueColor,
					},
				},
			},
			MuiFormControl: {
				styleOverrides: {
					root: {
						'& .MuiFormLabel-root': {
							fontFamily: 'Poppins',
							fontSize: '0.875rem',
							color: '#A3A3AD',
						},
						'& .MuiFormLabel-root.Mui-focused': {
							fontFamily: 'Poppins',
							fontSize: '0.875rem',
							color: blueColor,
						},
					},
				},
			},
		},
	});
};

export const customGridDropdownTheme = (primaryColor: string | undefined = undefined) => {
	const defaultTheme = getDefaultTheme(primaryColor);
	const blueColor = '#0274d7';
	return createTheme({
		...defaultTheme,
		components: {
			MuiInputBase: {
				styleOverrides: {
					root: {
						'&:not(.Mui-error) fieldset': {
							border: 'none',
						},
						'& fieldset > legend': {
							fontFamily: 'Poppins',
							fontSize: '0.875rem',
						},
					},
					input: {
						fontFamily: 'Poppins',
						fontSize: '0.875rem',
						caretColor: blueColor,
					},
				},
			},
			MuiFormControl: {
				styleOverrides: {
					root: {
						'& .MuiFormLabel-root': {
							fontFamily: 'Poppins',
							fontSize: '0.875rem',
							color: '#A3A3AD',
						},
						'& .MuiFormLabel-root.Mui-focused': {
							fontFamily: 'Poppins',
							fontSize: '0.875rem',
							color: blueColor,
						},
					},
				},
			},
			MuiMenuItem: {
				styleOverrides: {
					gutters: {
						fontFamily: 'Poppins',
						fontSize: '0.875rem',
						paddingTop: '10px',
						paddingBottom: '10px',
					},
				},
			},
			MuiPaper: {
				styleOverrides: {
					root: {
						border: `1px solid ${blueColor}`,
						borderBottomLeftRadius: '21px',
						borderBottomRightRadius: '21px',
					},
				},
			},
		},
	});
};
