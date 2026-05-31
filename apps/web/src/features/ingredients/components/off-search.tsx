import { useState } from 'react';
import {
  Alert,
  Button,
  Group,
  Loader,
  Paper,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconSearch } from '@tabler/icons-react';
import { useOFFSearch } from '../api';
import { BarcodeScanner } from './barcode-scanner';

interface OFFSearchProps {
  onSelect: (result: {
    name: string;
    calories: number | null;
    protein: number | null;
    carbs: number | null;
    fat: number | null;
  }) => void;
}

export function OpenFoodFactsSearch({ onSelect }: OFFSearchProps) {
  const [mode, setMode] = useState<'search' | 'barcode' | 'scan'>('search');
  const [query, setQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [debouncedQuery] = useDebouncedValue(query, 300);

  const searchQuery = mode === 'search' ? debouncedQuery : '';
  const barcodeQuery = mode === 'barcode' ? barcodeInput : '';
  const activeQuery = searchQuery || barcodeQuery;

  const { data, isLoading, error } = useOFFSearch(activeQuery);

  const handleScanDetect = (barcode: string) => {
    setBarcodeInput(barcode);
    setMode('barcode');
  };

  return (
    <Stack gap='sm'>
      <SegmentedControl
        value={mode}
        onChange={val => setMode(val as 'search' | 'barcode' | 'scan')}
        data={[
          { value: 'search', label: 'Search' },
          { value: 'barcode', label: 'Barcode' },
          { value: 'scan', label: 'Scan' },
        ]}
      />

      {mode === 'search' && (
        <TextInput
          placeholder='Search OpenFoodFacts by name...'
          leftSection={<IconSearch size={16} />}
          value={query}
          onChange={e => setQuery(e.currentTarget.value)}
        />
      )}

      {mode === 'barcode' && (
        <TextInput
          placeholder='Enter barcode number (EAN/UPC)...'
          value={barcodeInput}
          onChange={e => setBarcodeInput(e.currentTarget.value)}
        />
      )}

      {mode === 'scan' && <BarcodeScanner onDetect={handleScanDetect} />}

      {isLoading && (
        <Group justify='center' py='sm'>
          <Loader size='sm' />
          <Text size='sm' c='dimmed'>
            Searching OpenFoodFacts...
          </Text>
        </Group>
      )}

      {error && (
        <Alert color='orange' variant='light'>
          OpenFoodFacts is currently unavailable. You can enter data manually.
        </Alert>
      )}

      {data && data.length > 0 && (
        <Stack gap='xs'>
          {data.map((result, idx) => (
            <Paper key={idx} p='xs' withBorder>
              <Group justify='space-between' wrap='nowrap'>
                <Stack gap={2}>
                  <Text size='sm' fw={500}>
                    {result.name}
                  </Text>
                  <Text size='xs' c='dimmed'>
                    {[
                      result.calories != null &&
                        `${Math.round(result.calories)} kcal`,
                      result.protein != null &&
                        `${Math.round(result.protein)}g P`,
                      result.carbs != null && `${Math.round(result.carbs)}g C`,
                      result.fat != null && `${Math.round(result.fat)}g F`,
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'No nutrition data'}
                  </Text>
                </Stack>
                <Button
                  size='xs'
                  variant='light'
                  onClick={() => onSelect(result)}
                >
                  Use
                </Button>
              </Group>
            </Paper>
          ))}
        </Stack>
      )}

      {data && data.length === 0 && activeQuery.length >= 3 && !isLoading && (
        <Text size='sm' c='dimmed' ta='center'>
          No results found.
        </Text>
      )}
    </Stack>
  );
}
