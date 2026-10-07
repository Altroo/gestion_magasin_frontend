'use client';
import { type ChangeEvent } from 'react';
import { Box } from '@mui/material';
import TextField, { type TextFieldProps } from '@mui/material/TextField';
import AiAssistantControl from '@/components/shared/aiAssistantControl/aiAssistantControl';
import { isAiTextField } from '@/utils/aiTextFields';

type Props = TextFieldProps & { ai?: boolean };

const AiTextField = ({ ai, ...props }: Props) => {
	const fieldName = props.name || props.id || '';
	const input = props.slotProps?.input;
	const htmlInput = props.slotProps?.htmlInput;
	const readOnly =
		(typeof input === 'object' && input.readOnly) ||
		(typeof htmlInput === 'object' && 'readOnly' in htmlInput && htmlInput.readOnly);
	const maxLength =
		typeof htmlInput === 'object' && 'maxLength' in htmlInput ? Number(htmlInput.maxLength) || undefined : undefined;
	const show =
		!props.select &&
		!props.disabled &&
		!readOnly &&
		typeof props.value === 'string' &&
		!!props.onChange &&
		ai !== false &&
		(props.type === undefined || props.type === 'text' || props.type === 'textarea') &&
		(ai === true || isAiTextField(fieldName, props.type || 'text'));
	if (!show) return <TextField {...props} />;
	return (
		<Box sx={{ width: props.fullWidth ? '100%' : undefined, flex: props.fullWidth ? 1 : undefined }}>
			<TextField {...props} />
			<AiAssistantControl
				value={props.value as string}
				context="form"
				maxLength={maxLength}
				onApply={(value) =>
					props.onChange?.({
						target: { name: props.name || props.id || '', id: props.id || '', value },
						currentTarget: { name: props.name || props.id || '', id: props.id || '', value },
					} as ChangeEvent<HTMLInputElement>)
				}
			/>
		</Box>
	);
};
export default AiTextField;
