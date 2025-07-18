import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';

interface LoginPageProps {
  onGoogleLogin: () => void;
}

export const LoginPage = ({ onGoogleLogin }: LoginPageProps) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 p-8">
        <Logo />
        <h1 className="text-2xl font-semibold text-foreground">
          Welcome to Stride
        </h1>
        <p className="text-muted-foreground">
          Log your progress, build your case.
        </p>
        <Button onClick={onGoogleLogin} size="lg" className="mt-4">
          Sign In with Google
        </Button>
      </div>
    </div>
  );
};
