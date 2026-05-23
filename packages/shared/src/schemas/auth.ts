import { Type, type Static } from '@sinclair/typebox';

export const RegisterSchema = Type.Object({
  email: Type.String({ format: 'email', maxLength: 254 }),
  password: Type.String({ minLength: 8 }),
  firstName: Type.String({ minLength: 1, maxLength: 50 }),
  lastName: Type.String({ minLength: 1, maxLength: 50 }),
});
export type RegisterInput = Static<typeof RegisterSchema>;

export const LoginSchema = Type.Object({
  email: Type.String({ format: 'email' }),
  password: Type.String({ minLength: 1 }),
});
export type LoginInput = Static<typeof LoginSchema>;

export const ForgotPasswordSchema = Type.Object({
  email: Type.String({ format: 'email' }),
});
export type ForgotPasswordInput = Static<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = Type.Object({
  token: Type.String({ minLength: 1 }),
  newPassword: Type.String({ minLength: 8 }),
});
export type ResetPasswordInput = Static<typeof ResetPasswordSchema>;
