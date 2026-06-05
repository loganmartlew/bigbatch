import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ShoppingSwipeRow } from './shopping-swipe-row';

const vibrateMock = vi.fn();

function mockPointerEnvironment(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

function renderSwipeRow() {
  const onLeftAction = vi.fn();
  const onRightAction = vi.fn();

  render(
    <MantineProvider>
      <ShoppingSwipeRow
        leftActionLabel='Have it'
        onLeftAction={onLeftAction}
        rightActionLabel='Delete'
        onRightAction={onRightAction}
      >
        <div>Milk</div>
      </ShoppingSwipeRow>
    </MantineProvider>,
  );

  return {
    gestureSurface: screen.getByTestId('shopping-swipe-row-content'),
    onLeftAction,
    onRightAction,
  };
}

describe('ShoppingSwipeRow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPointerEnvironment(true);

    Object.defineProperty(window.navigator, 'vibrate', {
      configurable: true,
      writable: true,
      value: vibrateMock,
    });
  });

  it('commits the left action on a full right swipe with haptic feedback', () => {
    const { gestureSurface, onLeftAction, onRightAction } = renderSwipeRow();

    fireEvent.touchStart(gestureSurface, { touches: [{ clientX: 0 }] });
    fireEvent.touchMove(gestureSurface, { touches: [{ clientX: 150 }] });
    fireEvent.touchEnd(gestureSurface);

    expect(vibrateMock).toHaveBeenCalledWith(12);
    expect(onLeftAction).toHaveBeenCalledTimes(1);
    expect(onRightAction).not.toHaveBeenCalled();
  });

  it('commits the right action on a full left swipe without an extra tap', () => {
    const { gestureSurface, onLeftAction, onRightAction } = renderSwipeRow();

    fireEvent.touchStart(gestureSurface, { touches: [{ clientX: 200 }] });
    fireEvent.touchMove(gestureSurface, { touches: [{ clientX: 24 }] });
    fireEvent.touchEnd(gestureSurface);

    expect(vibrateMock).toHaveBeenCalledWith(12);
    expect(onRightAction).toHaveBeenCalledTimes(1);
    expect(onLeftAction).not.toHaveBeenCalled();
  });

  it('keeps the row open below the commit threshold', () => {
    const { gestureSurface, onLeftAction, onRightAction } = renderSwipeRow();

    fireEvent.touchStart(gestureSurface, { touches: [{ clientX: 0 }] });
    fireEvent.touchMove(gestureSurface, { touches: [{ clientX: 84 }] });
    fireEvent.touchEnd(gestureSurface);

    expect(vibrateMock).not.toHaveBeenCalled();
    expect(onLeftAction).not.toHaveBeenCalled();
    expect(onRightAction).not.toHaveBeenCalled();
  });
});
