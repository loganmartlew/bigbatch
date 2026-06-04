import { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Alert, Center, Loader, Text } from '@mantine/core';
import {
  useDeleteRecipe,
  useRecipe,
  useUpdateRecipe,
} from '../../features/recipes/api';
import { ConfirmDeleteRecipeModal } from '../../features/recipes/components/confirm-delete-recipe-modal';
import {
  buildUpdateRecipeInput,
  RecipeForm,
  recipeDetailToFormValues,
} from '../../features/recipes/components/recipe-form';

export const Route = createFileRoute('/recipes/$recipeId/edit')({
  component: EditRecipePage,
});

function EditRecipePage() {
  const { recipeId } = Route.useParams();
  const id = Number(recipeId);
  const navigate = useNavigate();
  const { data: recipe, isLoading } = useRecipe(id);
  const updateRecipe = useUpdateRecipe(id);
  const deleteMutation = useDeleteRecipe();
  const [deleteOpened, setDeleteOpened] = useState(false);

  if (isLoading) {
    return (
      <Center py='xl'>
        <Loader />
      </Center>
    );
  }

  if (!recipe) {
    return <Text>Recipe not found</Text>;
  }

  const updateError =
    updateRecipe.error instanceof Error
      ? updateRecipe.error.message
      : updateRecipe.isError
        ? 'Failed to update recipe.'
        : null;

  const handleDelete = () => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        setDeleteOpened(false);
        navigate({ to: '/recipes' });
      },
    });
  };

  return (
    <>
      {deleteMutation.error instanceof Error ? (
        <Alert color='red' title='Could not delete recipe' mb='md'>
          {deleteMutation.error.message}
        </Alert>
      ) : null}

      <RecipeForm
        title='Edit Recipe'
        submitLabel='Save Changes'
        initialValues={recipeDetailToFormValues(recipe)}
        errorMessage={updateError}
        isSubmitting={updateRecipe.isPending}
        deleteAction={{ onClick: () => setDeleteOpened(true) }}
        onCancel={() =>
          navigate({ to: '/recipes/$recipeId', params: { recipeId } })
        }
        onSubmit={values => {
          updateRecipe.mutate(buildUpdateRecipeInput(values), {
            onSuccess: () => {
              navigate({ to: '/recipes/$recipeId', params: { recipeId } });
            },
          });
        }}
      />

      <ConfirmDeleteRecipeModal
        opened={deleteOpened}
        recipeName={recipe.name}
        loading={deleteMutation.isPending}
        onClose={() => setDeleteOpened(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}
