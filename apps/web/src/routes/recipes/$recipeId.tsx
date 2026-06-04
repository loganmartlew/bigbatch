import { Outlet, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/recipes/$recipeId')({
  component: RecipeLayout,
});

function RecipeLayout() {
  return <Outlet />;
}
