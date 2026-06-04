import { getT } from '@/utils/helpers';

/** Dynamic validation messages resolved at validation time via getT(). */
export const INPUT_REQUIRED = () => getT().validation.required;
export const SHORT_INPUT_REQUIRED = () => getT().validation.shortRequired;
export const INPUT_MIN = (char: number) => getT().validation.minLength(char);
export const INPUT_MAX = (char: number) => getT().validation.maxLength(char);
export const MINI_INPUT_EMAIL = () => getT().validation.emailInvalid;
export const INPUT_PASSWORD_MIN = (char: number) => getT().validation.passwordMinLength(char);
