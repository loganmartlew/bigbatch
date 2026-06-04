import { FormatRegistry, type TSchema } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import type {
  FieldErrors,
  FieldValues,
  Resolver,
  ResolverResult,
} from 'react-hook-form';

FormatRegistry.Set('email', value =>
  /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(value),
);

function toFieldPath(path: string): string {
  return path.replace(/^\//, '').replace(/\//g, '.');
}

export function typeboxResolver<TFieldValues extends FieldValues>(
  schema: TSchema,
): Resolver<TFieldValues> {
  return (values): ResolverResult<TFieldValues> => {
    const validationErrors = [...Value.Errors(schema, values)];

    if (validationErrors.length === 0) {
      return {
        values,
        errors: {},
      };
    }

    const fieldErrors: Record<string, { message: string; type: string }> = {};

    for (const validationError of validationErrors) {
      const fieldPath = toFieldPath(validationError.path);

      if (!fieldPath || fieldErrors[fieldPath]) {
        continue;
      }

      fieldErrors[fieldPath] = {
        message: validationError.message,
        type: 'typebox',
      };
    }

    return {
      values: {},
      errors: fieldErrors as FieldErrors<TFieldValues>,
    };
  };
}
