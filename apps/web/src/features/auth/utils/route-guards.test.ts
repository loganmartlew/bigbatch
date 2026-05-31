import { describe, expect, it } from 'vitest';
import type { RouterAppContext } from '../../../lib/router-context';
import {
  getPostAuthDestination,
  redirectAuthenticatedUser,
  requireActiveHousehold,
  requireAuthenticatedUser,
  requireHouseholdSetup,
} from './route-guards';

function createContext(overrides?: {
  auth?: Partial<RouterAppContext['auth']>;
  household?: Partial<RouterAppContext['household']>;
}): RouterAppContext {
  return {
    auth: {
      households: [],
      isAuthenticated: false,
      isLoading: false,
      ...overrides?.auth,
    },
    household: {
      activeHouseholdId: null,
      ...overrides?.household,
    },
  };
}

function catchThrown(callback: () => void) {
  try {
    callback();
    return null;
  } catch (error) {
    return error;
  }
}

describe('route guards', () => {
  it('sends users without a selected household to onboarding', () => {
    expect(
      getPostAuthDestination(
        createContext({
          auth: {
            isAuthenticated: true,
          },
        }),
      ),
    ).toBe('/onboarding');
  });

  it('sends users with a selected household home', () => {
    expect(
      getPostAuthDestination(
        createContext({
          auth: {
            households: [{ id: 1, name: 'Home', role: 'owner' }],
            isAuthenticated: true,
          },
          household: {
            activeHouseholdId: 1,
          },
        }),
      ),
    ).toBe('/');
  });

  it('redirects authenticated users away from public routes', () => {
    expect(
      catchThrown(() =>
        redirectAuthenticatedUser(
          createContext({
            auth: {
              isAuthenticated: true,
            },
          }),
        ),
      ),
    ).not.toBeNull();
  });

  it('requires authentication for protected routes', () => {
    expect(
      catchThrown(() =>
        requireAuthenticatedUser({
          context: createContext(),
          location: { href: '/settings/household' },
        }),
      ),
    ).not.toBeNull();
  });

  it('allows protected routes while auth is still bootstrapping', () => {
    expect(
      catchThrown(() =>
        requireAuthenticatedUser({
          context: createContext({
            auth: {
              isLoading: true,
            },
          }),
          location: { href: '/settings/household' },
        }),
      ),
    ).toBeNull();
  });

  it('requires an active household for household settings', () => {
    expect(
      catchThrown(() =>
        requireActiveHousehold({
          context: createContext({
            auth: {
              isAuthenticated: true,
            },
          }),
          location: { href: '/settings/household' },
        }),
      ),
    ).not.toBeNull();
  });

  it('allows onboarding when the user still needs a household', () => {
    expect(
      catchThrown(() =>
        requireHouseholdSetup({
          context: createContext({
            auth: {
              isAuthenticated: true,
            },
          }),
          location: { href: '/onboarding' },
        }),
      ),
    ).toBeNull();
  });
});
