import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useCreateRecipe } from '../../features/recipes/api';
import {
  buildCreateRecipeInput,
  emptyRecipeFormValues,
  RecipeForm,
} from '../../features/recipes/components/recipe-form';

export const Route = createFileRoute('/recipes/new')({
  component: NewRecipePage,
});

function NewRecipePage() {
  const navigate = useNavigate();
  const createRecipe = useCreateRecipe();

  const errorMessage =
    createRecipe.error instanceof Error
      ? createRecipe.error.message
      : createRecipe.isError
        ? 'Failed to create recipe.'
        : null;

  return (
    <RecipeForm
      title='New Recipe'
      submitLabel='Create Recipe'
      initialValues={emptyRecipeFormValues}
      errorMessage={errorMessage}
      isSubmitting={createRecipe.isPending}
      onCancel={() => navigate({ to: '/recipes' })}
      onSubmit={values => {
        createRecipe.mutate(buildCreateRecipeInput(values), {
          onSuccess: data => {
            navigate({
              to: '/recipes/$recipeId',
              params: { recipeId: String(data.id) },
            });
          },
        });
      }}
    />
  );
}
