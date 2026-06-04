import { redirect } from '@tanstack/react-router';
import type { RouterAppContext } from '../../../lib/router-context';

interface RouteGuardArgs {
  context: RouterAppContext;
  location: {
    href: string;
  };
}

export function getPostAuthDestination(context: RouterAppContext) {
  return context.household.activeHouseholdId === null ? '/onboarding' : '/';
}

export function redirectAuthenticatedUser(context: RouterAppContext) {
  if (context.auth.isLoading || !context.auth.isAuthenticated) {
    return;
  }

  throw redirect({
    to: getPostAuthDestination(context),
  });
}

export function requireAuthenticatedUser({
  context,
  location,
}: RouteGuardArgs) {
  if (context.auth.isLoading || context.auth.isAuthenticated) {
    return;
  }

  throw redirect({
    to: '/login',
    search: {
      redirect: location.href,
    },
  });
}

export function requireHouseholdSetup(args: RouteGuardArgs) {
  requireAuthenticatedUser(args);

  if (args.context.auth.isLoading) {
    return;
  }

  if (args.context.household.activeHouseholdId !== null) {
    throw redirect({
      to: '/',
    });
  }
}

export function requireActiveHousehold(args: RouteGuardArgs) {
  requireAuthenticatedUser(args);

  if (args.context.auth.isLoading) {
    return;
  }

  if (args.context.household.activeHouseholdId === null) {
    throw redirect({
      to: '/onboarding',
    });
  }
}
