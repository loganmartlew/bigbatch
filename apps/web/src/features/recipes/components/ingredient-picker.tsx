import { useMemo, useState } from 'react';
import {
  Button,
  Combobox,
  Group,
  Input,
  InputBase,
  Stack,
  Text,
  useCombobox,
} from '@mantine/core';

export type IngredientPickerOption = {
  value: string;
  label: string;
};

type IngredientPickerProps = {
  value: string;
  options: IngredientPickerOption[];
  placeholder?: string;
  onChange: (value: string) => void;
  onCreate: () => void;
};

export function IngredientPicker({
  value,
  options,
  placeholder = 'Ingredient',
  onChange,
  onCreate,
}: IngredientPickerProps) {
  const [search, setSearch] = useState('');
  const combobox = useCombobox({
    onDropdownClose: () => {
      combobox.resetSelectedOption();
      setSearch('');
    },
    onDropdownOpen: () => {
      combobox.selectFirstOption();
    },
  });

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return options;
    }

    return options.filter(option => option.label.toLowerCase().includes(query));
  }, [options, search]);

  const selectedOption = options.find(option => option.value === value) ?? null;

  return (
    <Combobox
      store={combobox}
      withinPortal={false}
      onOptionSubmit={selectedValue => {
        onChange(selectedValue);
        combobox.closeDropdown();
      }}
    >
      <Combobox.Target targetType='button'>
        <InputBase
          component='button'
          type='button'
          pointer
          rightSection={<Combobox.Chevron />}
          onClick={() => combobox.toggleDropdown()}
          style={{ flex: 2 }}
        >
          {selectedOption ? (
            selectedOption.label
          ) : (
            <Input.Placeholder>{placeholder}</Input.Placeholder>
          )}
        </InputBase>
      </Combobox.Target>

      <Combobox.Dropdown>
        <Combobox.Search
          value={search}
          onChange={event => setSearch(event.currentTarget.value)}
          placeholder='Search ingredients'
        />

        <Combobox.Options mah={220} style={{ overflowY: 'auto' }}>
          {filteredOptions.length > 0 ? (
            filteredOptions.map(option => (
              <Combobox.Option key={option.value} value={option.value}>
                <Group justify='space-between' wrap='nowrap'>
                  <Text size='sm'>{option.label}</Text>
                </Group>
              </Combobox.Option>
            ))
          ) : (
            <Combobox.Empty>No ingredients found</Combobox.Empty>
          )}
        </Combobox.Options>

        <Stack
          gap='xs'
          p='xs'
          style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}
        >
          <Button
            variant='subtle'
            justify='flex-start'
            onClick={() => {
              combobox.closeDropdown();
              onCreate();
            }}
          >
            + Create new ingredient
          </Button>
        </Stack>
      </Combobox.Dropdown>
    </Combobox>
  );
}
