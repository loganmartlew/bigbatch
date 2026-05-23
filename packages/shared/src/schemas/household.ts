import { Type, type Static } from '@sinclair/typebox';

export const CreateHouseholdSchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 100 }),
});
export type CreateHouseholdInput = Static<typeof CreateHouseholdSchema>;

export const JoinByLinkSchema = Type.Object({
  token: Type.String({ minLength: 1 }),
});
export type JoinByLinkInput = Static<typeof JoinByLinkSchema>;

export const JoinByCodeSchema = Type.Object({
  code: Type.String({ minLength: 6, maxLength: 6 }),
});
export type JoinByCodeInput = Static<typeof JoinByCodeSchema>;
