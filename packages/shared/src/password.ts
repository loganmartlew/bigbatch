import zxcvbn from 'zxcvbn';

export const MIN_PASSWORD_STRENGTH_SCORE = 2;

const PASSWORD_STRENGTH_LABELS = [
  'Very weak',
  'Weak',
  'Fair',
  'Good',
  'Strong',
] as const;

export interface PasswordStrengthDetails {
  score: number;
  label: (typeof PASSWORD_STRENGTH_LABELS)[number];
  isStrongEnough: boolean;
  validationMessage: string | null;
}

export function getPasswordStrengthDetails(
  password: string,
): PasswordStrengthDetails {
  const strength = zxcvbn(password);
  const isStrongEnough = strength.score >= MIN_PASSWORD_STRENGTH_SCORE;

  return {
    score: strength.score,
    label: PASSWORD_STRENGTH_LABELS[strength.score],
    isStrongEnough,
    validationMessage: isStrongEnough
      ? null
      : strength.feedback.warning ||
        strength.feedback.suggestions.join(' ') ||
        'Password is too weak',
  };
}

export function getPasswordStrengthValidationMessage(
  password: string,
): string | null {
  return getPasswordStrengthDetails(password).validationMessage;
}
