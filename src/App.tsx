import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { useConvexAuth } from "convex/react";
import { MovieAlerts } from "./components/MovieAlerts";

export default function App() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <main className="container mx-auto p-4 min-h-screen bg-gray-50">
      {!isAuthenticated ? (
        <div className="max-w-md mx-auto mt-20">
          <h1 className="text-4xl font-bold text-center mb-8">Movie Alert System</h1>
          <SignInForm />
        </div>
      ) : (
        <div>
          <div className="flex justify-end mb-8">
            <SignOutButton />
          </div>
          <MovieAlerts />
        </div>
      )}
    </main>
  );
}
