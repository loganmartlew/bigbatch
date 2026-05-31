import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Group, Stack, Text } from '@mantine/core';
import { IconCamera } from '@tabler/icons-react';

interface BarcodeScannerProps {
  onDetect: (barcode: string) => void;
}

export function BarcodeScanner({ onDetect }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startScanning = async () => {
    setError(null);

    // Check if BarcodeDetector is available
    if (!('BarcodeDetector' in window)) {
      setError(
        'Barcode scanning is not supported in this browser. Please enter the barcode manually.',
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setScanning(true);

      const detector = new (window as any).BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'upc_a'],
      });

      const detect = async () => {
        if (!videoRef.current || !scanning) return;

        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes.length > 0) {
            const barcode = barcodes[0].rawValue;
            stopScanning();
            onDetect(barcode);
            return;
          }
        } catch {
          // Detection failed this frame, retry
        }

        if (streamRef.current) {
          requestAnimationFrame(detect);
        }
      };

      detect();
    } catch (err) {
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setError('Camera access required for barcode scanning.');
      } else {
        setError('Failed to access camera.');
      }
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  if (error) {
    return (
      <Alert color='orange' variant='light'>
        {error}
      </Alert>
    );
  }

  if (!scanning) {
    return (
      <Group justify='center' py='md'>
        <Button
          leftSection={<IconCamera size={16} />}
          variant='light'
          onClick={startScanning}
        >
          Start Camera
        </Button>
      </Group>
    );
  }

  return (
    <Stack gap='xs'>
      <video
        ref={videoRef}
        style={{ width: '100%', maxHeight: 300, borderRadius: 8 }}
        muted
        playsInline
      />
      <Group justify='space-between'>
        <Text size='xs' c='dimmed'>
          Point camera at a barcode...
        </Text>
        <Button size='xs' variant='subtle' onClick={stopScanning}>
          Stop
        </Button>
      </Group>
    </Stack>
  );
}
