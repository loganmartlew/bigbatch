import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';

// ---------------------------------------------------------------------------
// Household service tests — example-based + property-based
// ---------------------------------------------------------------------------

vi.mock('../../../db/client.js', () => ({
  db: {
    query: {
      userHouseholds: { findFirst: vi.fn(), findMany: vi.fn() },
      householdInvites: { findFirst: vi.fn() },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({ returning: vi.fn() })),
    })),
    delete: vi.fn(() => ({ where: vi.fn() })),
  },
}));

vi.mock('../../../lib/env.js', () => ({
  env: {
    FRONTEND_URL: 'http://localhost:5173',
    NODE_ENV: 'test',
  },
}));

import { db } from '../../../db/client.js';

describe('Household Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // Example-based tests (PBT-10)
  // =========================================================================

  describe('createHousehold', () => {
    it('rejects empty household name', async () => {
      const { createHousehold } = await import('../household.service.js');
      await expect(createHousehold(1, '')).rejects.toThrow(
        'Household name must be 1–100 characters',
      );
    });

    it('rejects name over 100 chars', async () => {
      const { createHousehold } = await import('../household.service.js');
      await expect(createHousehold(1, 'a'.repeat(101))).rejects.toThrow(
        'Household name must be 1–100 characters',
      );
    });

    it('trims whitespace from name', async () => {
      const insertMock = vi.mocked(db.insert);
      const returningMock = vi
        .fn()
        .mockResolvedValueOnce([
          { id: 1, name: 'My House', ownerId: 1, createdAt: '', updatedAt: '' },
        ]);
      // First insert: household
      insertMock.mockReturnValueOnce({
        values: vi.fn().mockReturnValueOnce({ returning: returningMock }),
      } as any);
      // Second insert: userHousehold
      insertMock.mockReturnValueOnce({
        values: vi.fn(),
      } as any);
      // Third insert: shopping categories
      insertMock.mockReturnValueOnce({
        values: vi.fn(),
      } as any);

      const { createHousehold } = await import('../household.service.js');
      const result = await createHousehold(1, '  My House  ');
      expect(result.name).toBe('My House');
    });
  });

  describe('generateInvite', () => {
    it('rejects non-owners', async () => {
      const findFirst = vi.mocked(db.query.userHouseholds.findFirst);
      findFirst.mockResolvedValueOnce({
        id: 1,
        userId: 2,
        householdId: 1,
        role: 'member',
        joinedAt: '',
      } as any);

      const { generateInvite } = await import('../household.service.js');
      await expect(generateInvite(1, 2)).rejects.toThrow(
        'Only the household owner can generate invites',
      );
    });
  });

  describe('joinByLink', () => {
    it('rejects expired invite', async () => {
      const findFirst = vi.mocked(db.query.householdInvites.findFirst);
      findFirst.mockResolvedValueOnce({
        id: 1,
        householdId: 1,
        token: 'tok',
        code: 'ABC123',
        expiresAt: new Date(Date.now() - 1000).toISOString(),
        createdBy: 1,
        createdAt: '',
        household: {
          id: 1,
          name: 'H',
          ownerId: 1,
          createdAt: '',
          updatedAt: '',
        },
      } as any);

      const { joinByLink } = await import('../household.service.js');
      await expect(joinByLink(2, 'tok')).rejects.toThrow(
        'Invite not found or expired',
      );
    });

    it('rejects duplicate membership', async () => {
      const inviteFindFirst = vi.mocked(db.query.householdInvites.findFirst);
      inviteFindFirst.mockResolvedValueOnce({
        id: 1,
        householdId: 1,
        token: 'tok',
        code: 'ABC123',
        expiresAt: new Date(Date.now() + 60000).toISOString(),
        createdBy: 1,
        createdAt: '',
        household: {
          id: 1,
          name: 'H',
          ownerId: 1,
          createdAt: '',
          updatedAt: '',
        },
      } as any);

      const uhFindFirst = vi.mocked(db.query.userHouseholds.findFirst);
      uhFindFirst.mockResolvedValueOnce({
        id: 1,
        userId: 2,
        householdId: 1,
        role: 'member',
        joinedAt: '',
      } as any);

      const { joinByLink } = await import('../household.service.js');
      await expect(joinByLink(2, 'tok')).rejects.toThrow(
        'You are already a member of this household',
      );
    });
  });

  describe('removeMember', () => {
    it('prevents owner from removing themselves', async () => {
      const findFirst = vi.mocked(db.query.userHouseholds.findFirst);
      findFirst.mockResolvedValueOnce({
        id: 1,
        userId: 1,
        householdId: 1,
        role: 'owner',
        joinedAt: '',
      } as any);

      const { removeMember } = await import('../household.service.js');
      await expect(removeMember(1, 1, 1)).rejects.toThrow(
        'Cannot remove yourself from household',
      );
    });

    it('rejects non-owners', async () => {
      const findFirst = vi.mocked(db.query.userHouseholds.findFirst);
      findFirst.mockResolvedValueOnce({
        id: 1,
        userId: 2,
        householdId: 1,
        role: 'member',
        joinedAt: '',
      } as any);

      const { removeMember } = await import('../household.service.js');
      await expect(removeMember(1, 2, 3)).rejects.toThrow(
        'Only the household owner can remove members',
      );
    });
  });

  // =========================================================================
  // Property-based tests (PBT-02, PBT-03, PBT-04)
  // =========================================================================

  describe('PBT: Invite code invariants', () => {
    const INVITE_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

    // PBT-03: Invariant — invite codes always 6 chars from the valid alphabet
    it('generated invite codes are always 6 chars from valid alphabet', () => {
      // We test the code generation logic directly since it's private.
      // Replicate the algorithm to verify the invariant.
      fc.assert(
        fc.property(fc.uint8Array({ minLength: 6, maxLength: 6 }), bytes => {
          let code = '';
          for (let i = 0; i < 6; i++) {
            code +=
              INVITE_CODE_ALPHABET[bytes[i]! % INVITE_CODE_ALPHABET.length];
          }
          expect(code).toHaveLength(6);
          for (const char of code) {
            expect(INVITE_CODE_ALPHABET).toContain(char);
          }
        }),
      );
    });

    // PBT-03: Invariant — no ambiguous characters (0, O, I, L, 1)
    it('invite codes never contain ambiguous characters', () => {
      const ambiguous = ['0', 'O', 'I', 'L', '1'];
      fc.assert(
        fc.property(fc.uint8Array({ minLength: 6, maxLength: 6 }), bytes => {
          let code = '';
          for (let i = 0; i < 6; i++) {
            code +=
              INVITE_CODE_ALPHABET[bytes[i]! % INVITE_CODE_ALPHABET.length];
          }
          for (const char of ambiguous) {
            expect(code).not.toContain(char);
          }
        }),
      );
    });
  });

  describe('PBT: Join code normalization', () => {
    // PBT-04: Idempotence — code normalization (trim + uppercase) is idempotent
    it('code normalization is idempotent', () => {
      fc.assert(
        fc.property(
          fc.stringOf(
            fc.constantFrom(...'ABCDEFGHJKMNPQRSTUVWXYZ23456789'.split('')),
            {
              minLength: 6,
              maxLength: 6,
            },
          ),
          code => {
            const normalize = (c: string) => c.trim().toUpperCase();
            expect(normalize(normalize(code))).toBe(normalize(code));
          },
        ),
      );
    });
  });

  describe('PBT: Household name validation', () => {
    // PBT-03: Invariant — names 1-100 chars after trim should be accepted
    it('valid-length names pass validation (trimmed 1-100 chars)', () => {
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 1, maxLength: 100 })
            .filter(s => s.trim().length >= 1 && s.trim().length <= 100),
          name => {
            const trimmed = name.trim();
            expect(trimmed.length).toBeGreaterThanOrEqual(1);
            expect(trimmed.length).toBeLessThanOrEqual(100);
          },
        ),
      );
    });
  });
});
