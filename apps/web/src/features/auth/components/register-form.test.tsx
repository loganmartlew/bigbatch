import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const registerMock = vi.fn();
const navigateMock = vi.fn();

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

vi.mock('../../../lib/auth-context', () => ({
  useAuth: () => ({
    isLoading: false,
    register: registerMock,
  }),
}));

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    ...props
  }: {
    children: React.ReactNode;
    to?: string;
  }) => (
    <a href={typeof to === 'string' ? to : '#'} {...props}>
      {children}
    </a>
  ),
  useNavigate: () => navigateMock,
}));

import { RegisterForm } from './register-form';

async function fillRequiredFields(password: string) {
  const user = userEvent.setup();

  render(
    <MantineProvider>
      <RegisterForm />
    </MantineProvider>,
  );

  await user.type(screen.getByLabelText('First name'), 'Test');
  await user.type(screen.getByLabelText('Last name'), 'User');
  await user.type(screen.getByLabelText('Email'), 'test@example.com');
  await user.type(screen.getByLabelText('Password'), password);

  return user;
}

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a visible weak-password state and disables submission', async () => {
    await fillRequiredFields('password1');

    expect(
      screen.getByText('Password strength: Very weak'),
    ).toBeInTheDocument();
    expect(screen.getAllByText('This is a very common password')).toHaveLength(
      2,
    );
    expect(
      screen.getByRole('button', { name: 'Create account' }),
    ).toBeDisabled();
  });

  it('shows when the password is strong enough and enables submission', async () => {
    await fillRequiredFields('CedarPantry27-Strong');

    expect(screen.getByText('Password strength: Strong')).toBeInTheDocument();
    expect(
      screen.getByText('Strong enough to create your account.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Create account' }),
    ).toBeEnabled();
  });
});
