'use client';

import React, { useState } from 'react';
import Styles from '@/styles/dashboard/settings/settings.module.sass';
import { Box, Stack, useMediaQuery, useTheme } from '@mui/material';
import { useFormik } from 'formik';
import { profilSchema } from '@/utils/formValidationSchemas';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import { textInputTheme, customDropdownTheme } from '@/utils/themes';
import CustomDropDownSelect from '@/components/formikElements/customDropDownSelect/customDropDownSelect';
import { genderItemsList } from '@/utils/rawData';
import { useAppDispatch, useToast, useLanguage } from '@/utils/hooks';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import { setFormikAutoErrors } from '@/utils/helpers';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import type { SessionProps } from '@/types/_initTypes';
import { useGetProfilQuery, useEditProfilMutation } from '@/store/services/account';
import { useInitAccessToken } from '@/contexts/InitContext';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { accountEditProfilAction } from '@/store/actions/accountActions';
import CustomSquareImageUploading from '@/components/formikElements/customSquareImageUploading/customSquareImageUploading';
import { Edit as EditIcon, Groups as GroupsIcon, Person as PersonIcon } from '@mui/icons-material';

const inputTheme = textInputTheme();

type formikContentType = {
	token: string | undefined;
};

const FormikContent: React.FC<formikContentType> = (props: formikContentType) => {
	const { token } = props;
	const { onSuccess, onError } = useToast();
	const { t } = useLanguage();
	const { data: profilData, isLoading: isProfilLoading } = useGetProfilQuery(undefined, { skip: !token });
	const [editProfil, { isLoading: isEditLoading }] = useEditProfilMutation();
	const dispatch = useAppDispatch();
	const [isPending, setIsPending] = useState(false);

	const formik = useFormik({
		initialValues: {
			first_name: profilData?.first_name ?? '',
			last_name: profilData?.last_name ?? '',
			gender: profilData?.gender ?? '',
			avatar: profilData?.avatar ?? '',
			avatar_cropped: profilData?.avatar_cropped ?? '',
			globalError: '',
		},
		enableReinitialize: true,
		validateOnMount: true,
		validationSchema: toFormikValidationSchema(profilSchema),
		onSubmit: async (data, { setFieldError }) => {
			setIsPending(true);
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { globalError, ...payload } = data;
			try {
				const response = await editProfil({ data: payload }).unwrap();
				if (response) {
					dispatch(accountEditProfilAction(response));
					onSuccess(t.settings.updateSuccess);
				}
			} catch (e) {
				onError(t.settings.updateError);
				setFormikAutoErrors({ e, setFieldError });
			} finally {
				setIsPending(false);
			}
		},
	});

	return (
		<Stack
			direction="column"
			spacing={2}
			className={`${Styles.flexRootStack}`}
			sx={{
				alignItems: 'center',
				mt: '32px',
			}}
		>
			{(isEditLoading || isPending || isProfilLoading) && (
				<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
			)}
			<h2 className={Styles.pageTitle}>{t.settings.profile}</h2>
			<form className={Styles.form} onSubmit={(e) => e.preventDefault()}>
				<Stack
					direction="column"
					spacing={2}
					sx={{
						justifyContent: 'center',
						alignItems: 'center',
					}}
				>
					<CustomSquareImageUploading
						cssClasse={Styles.centerAvatar}
						image={formik.values.avatar}
						croppedImage={formik.values.avatar_cropped}
						onChange={(img) => formik.setFieldValue('avatar', img)}
						onCrop={(cropped) => formik.setFieldValue('avatar_cropped', cropped)}
					/>
					<CustomTextInput
						id="first_name"
						type="text"
						value={formik.values.first_name}
						onChange={formik.handleChange('first_name')}
						onBlur={formik.handleBlur('first_name')}
						helperText={formik.touched.first_name ? formik.errors.first_name : ''}
						error={formik.touched.first_name && Boolean(formik.errors.first_name)}
						fullWidth={true}
						size="small"
						label={t.users.lastName}
						placeholder={t.users.lastName}
						theme={inputTheme}
						startIcon={<PersonIcon fontSize="small" />}
						cssClass={Styles.maxInputWidth}
					/>
					<CustomTextInput
						id="last_name"
						type="text"
						value={formik.values.last_name}
						onChange={formik.handleChange('last_name')}
						onBlur={formik.handleBlur('last_name')}
						helperText={formik.touched.last_name ? formik.errors.last_name : ''}
						error={formik.touched.last_name && Boolean(formik.errors.last_name)}
						fullWidth={true}
						size="small"
						label={t.users.firstName}
						placeholder={t.users.firstName}
						theme={inputTheme}
						startIcon={<PersonIcon fontSize="small" />}
						cssClass={Styles.maxInputWidth}
					/>
					<CustomDropDownSelect
						size="small"
						id="gender"
						label={t.users.gender}
						items={genderItemsList(t)}
						theme={customDropdownTheme()}
						onChange={(e) => formik.setFieldValue('gender', e.target.value)}
						value={formik.values.gender}
						startIcon={<GroupsIcon fontSize="small" />}
						cssClass={Styles.maxInputWidth}
					/>
					<PrimaryLoadingButton
						buttonText={t.common.update}
						active={!isPending}
						onClick={formik.handleSubmit}
						cssClass={`${Styles.maxWidth} ${Styles.mobileButton} ${Styles.submitButton}`}
						type="submit"
						startIcon={<EditIcon />}
						loading={isPending}
					/>
				</Stack>
			</form>
		</Stack>
	);
};

const EditProfilClient: React.FC<SessionProps> = (props: SessionProps) => {
	const { session } = props;
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('md'));
	const token = useInitAccessToken(session);
	const { t } = useLanguage();

	return (
		<Stack direction="column" sx={{ position: 'relative' }}>
			<NavigationBar title={t.settings.editProfile}>
				<main className={`${Styles.main} ${Styles.fixMobile}`}>
					<Box
						sx={{
							width: '100%',
							display: 'flex',
							justifyContent: isMobile ? 'center' : 'flex-start',
							alignItems: 'flex-start',
						}}
					>
						<Box sx={{ width: '100%' }}>
							<FormikContent token={token} />
						</Box>
					</Box>
				</main>
			</NavigationBar>
		</Stack>
	);
};

export default EditProfilClient;
