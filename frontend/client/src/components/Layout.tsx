import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { supabase } from '@/supabaseClient';
import { Sidebar } from '@/components/Sidebar';
import { LoginPage } from '@/pages/LoginPage';

export const Layout = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

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
    return <div className="min-h-screen bg-background" />;
  }

  if (!session) {
    return <LoginPage onGoogleLogin={handleGoogleLogin} />;
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar user={session.user} onLogout={handleLogout} />
      <main className="flex flex-1 items-center justify-center">
        <Outlet context={{ session }} />
      </main>
    </div>
  );
};
