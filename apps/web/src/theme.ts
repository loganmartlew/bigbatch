import { createTheme } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'orange',
  defaultRadius: 'md',
  defaultGradient: {
    from: 'orange',
    to: 'red',
    deg: 135,
  },
  fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
  headings: {
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
    fontWeight: '700',
  },
});
