import { describe, expect, it } from 'vitest';
import {
  getPasswordStrengthDetails,
  getPasswordStrengthValidationMessage,
} from './password.js';

describe('getPasswordStrengthDetails', () => {
  it('reports visible strength details for common weak passwords', () => {
    expect(getPasswordStrengthDetails('password1')).toMatchObject({
      score: 0,
      label: 'Very weak',
      isStrongEnough: false,
      validationMessage: 'This is a very common password',
    });
  });

  it('reports strong passwords as acceptable', () => {
    expect(getPasswordStrengthDetails('CedarPantry27-Strong')).toMatchObject({
      label: 'Strong',
      isStrongEnough: true,
      validationMessage: null,
    });
  });
});

describe('getPasswordStrengthValidationMessage', () => {
  it('rejects common passwords that pass basic length checks', () => {
    expect(getPasswordStrengthValidationMessage('password1')).toBe(
      'This is a very common password',
    );
  });

  it('accepts stronger passwords', () => {
    expect(
      getPasswordStrengthValidationMessage('CedarPantry27-Strong'),
    ).toBeNull();
  });
});
