import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { supabase } from '@/supabaseClient';
import { Sidebar } from '@/components/Sidebar';
import { LoginPage } from '@/pages/LoginPage';
import { TooltipProvider } from '@/components/ui/tooltip'; // Import the provider

export const Layout = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for an active session initially
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for changes in authentication state
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false); // No need to set loading to true here
    });

    // Cleanup subscription on unmount
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  };

  if (loading) {
    // Show a blank screen while determining auth state to prevent flickering
    return <div className="min-h-screen bg-background" />;
  }

  if (!session) {
    return <LoginPage onGoogleLogin={handleGoogleLogin} />;
  }

  return (
    <TooltipProvider>
      <div className="grid min-h-screen w-full sm:grid-cols-[80px_1fr]">
        <Sidebar session={session} onLogout={handleLogout} />
        <main className="col-start-1 flex flex-1 items-center justify-center pt-0 sm:col-start-2 sm:pt-0">
          <Outlet context={{ session }} />
        </main>
      </div>
    </TooltipProvider>
  );
};
