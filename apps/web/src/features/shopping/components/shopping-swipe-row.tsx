import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type TouchEvent as ReactTouchEvent,
} from 'react';
import { Box, Button } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';

interface ShoppingSwipeRowProps {
  children: ReactNode;
  leftActionLabel: string;
  onLeftAction: () => void;
  rightActionLabel: string;
  onRightAction: () => void;
  disabled?: boolean;
}

type CommitAction = 'left' | 'right' | null;

const ACTION_WIDTH = 108;
const OPEN_THRESHOLD = 56;
const COMMIT_THRESHOLD = ACTION_WIDTH + 28;
const MAX_SWIPE_DISTANCE = ACTION_WIDTH + 56;
const HAPTIC_DURATION_MS = 12;

function getCommitAction(value: number): CommitAction {
  if (value >= COMMIT_THRESHOLD) {
    return 'left';
  }

  if (value <= -COMMIT_THRESHOLD) {
    return 'right';
  }

  return null;
}

export function ShoppingSwipeRow({
  children,
  leftActionLabel,
  onLeftAction,
  rightActionLabel,
  onRightAction,
  disabled = false,
}: ShoppingSwipeRowProps) {
  const isCoarsePointer = useMediaQuery('(pointer: coarse)');
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef<number | null>(null);
  const startOffsetRef = useRef(0);
  const offsetRef = useRef(0);
  const commitActionRef = useRef<CommitAction>(null);

  const setSwipeOffset = (value: number) => {
    offsetRef.current = value;
    setOffset(value);
  };

  const clampOffset = (value: number) => {
    return Math.max(-MAX_SWIPE_DISTANCE, Math.min(MAX_SWIPE_DISTANCE, value));
  };

  const triggerHapticFeedback = () => {
    navigator.vibrate?.(HAPTIC_DURATION_MS);
  };

  const updateCommitFeedback = (value: number) => {
    const nextCommitAction = getCommitAction(value);

    if (
      nextCommitAction !== null &&
      nextCommitAction !== commitActionRef.current
    ) {
      triggerHapticFeedback();
    }

    commitActionRef.current = nextCommitAction;
  };

  useEffect(() => {
    if (!disabled) {
      return;
    }

    setSwipeOffset(0);
    setIsDragging(false);
    startXRef.current = null;
    startOffsetRef.current = 0;
    commitActionRef.current = null;
  }, [disabled]);

  if (!isCoarsePointer || disabled) {
    return <Box>{children}</Box>;
  }

  const handleTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
    const nextTouch = event.touches[0];
    startXRef.current = nextTouch?.clientX ?? null;
    startOffsetRef.current = offsetRef.current;
    commitActionRef.current = null;
    setIsDragging(true);
  };

  const handleTouchMove = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (startXRef.current == null) {
      return;
    }

    const nextTouch = event.touches[0];
    if (!nextTouch) {
      return;
    }

    const deltaX = nextTouch.clientX - startXRef.current;
    const nextOffset = clampOffset(startOffsetRef.current + deltaX);
    setSwipeOffset(nextOffset);
    updateCommitFeedback(nextOffset);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    startXRef.current = null;
    startOffsetRef.current = 0;

    const currentOffset = offsetRef.current;
    const nextCommitAction = getCommitAction(currentOffset);
    commitActionRef.current = null;

    if (nextCommitAction === 'left') {
      setSwipeOffset(0);
      onLeftAction();
      return;
    }

    if (nextCommitAction === 'right') {
      setSwipeOffset(0);
      onRightAction();
      return;
    }

    if (currentOffset >= OPEN_THRESHOLD) {
      setSwipeOffset(ACTION_WIDTH);
      return;
    }

    if (currentOffset <= -OPEN_THRESHOLD) {
      setSwipeOffset(-ACTION_WIDTH);
      return;
    }

    setSwipeOffset(0);
  };

  const handleLeftAction = () => {
    setSwipeOffset(0);
    onLeftAction();
  };

  const handleRightAction = () => {
    setSwipeOffset(0);
    onRightAction();
  };

  const actionOpacity = Math.min(Math.abs(offset) / OPEN_THRESHOLD, 1);
  const leftActionWidth =
    offset > 0 ? Math.max(Math.abs(offset), ACTION_WIDTH) : 0;
  const rightActionWidth =
    offset < 0 ? Math.max(Math.abs(offset), ACTION_WIDTH) : 0;

  return (
    <Box
      pos='relative'
      style={{
        overflow: 'hidden',
        borderRadius: 'var(--mantine-radius-sm)',
      }}
    >
      <Box
        style={{
          position: 'absolute',
          inset: 0,
        }}
      >
        <Button
          variant='filled'
          color='teal'
          radius='sm'
          onClick={handleLeftAction}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: leftActionWidth,
            opacity: offset > 0 ? actionOpacity : 0,
            pointerEvents: offset > 0 ? 'auto' : 'none',
            transition: isDragging
              ? 'none'
              : 'width 160ms ease, opacity 140ms ease',
          }}
        >
          {leftActionLabel}
        </Button>

        <Button
          variant='filled'
          color='red'
          radius='sm'
          onClick={handleRightAction}
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: rightActionWidth,
            opacity: offset < 0 ? actionOpacity : 0,
            pointerEvents: offset < 0 ? 'auto' : 'none',
            transition: isDragging
              ? 'none'
              : 'width 160ms ease, opacity 140ms ease',
          }}
        >
          {rightActionLabel}
        </Button>
      </Box>

      <Box
        data-testid='shopping-swipe-row-content'
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={{
          touchAction: 'pan-y',
          transform: `translateX(${offset}px)`,
          transition: isDragging
            ? 'none'
            : 'transform 180ms cubic-bezier(0.22, 1, 0.36, 1)',
          position: 'relative',
          zIndex: 1,
          background: 'var(--mantine-color-body)',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
