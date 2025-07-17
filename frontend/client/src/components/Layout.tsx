import { useEffect, useState } from "react";
import { Outlet, Link, NavLink } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import { Logo } from "@/components/Logo";
import { BookLogo } from "@/components/BookLogo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

  if (loading) {
    return <div className="min-h-screen bg-background" />; // Blank screen while loading
  }

  if (!session) {
    // Centered Login Page
    const handleGoogleLogin = async () => {
      await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin }});
    };
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4 p-8">
          <Logo />
          <h1 className="text-2xl font-semibold text-foreground">Welcome to Stride</h1>
          <p className="text-muted-foreground">Log your progress, build your case.</p>
          <Button onClick={handleGoogleLogin} size="lg" className="mt-4">
            Sign In with Google
          </Button>
        </div>
      </div>
    );
  }

  // Main App Layout with Sidebar
  return (
    // CORRECTED: Use CSS Grid for the main layout
    <div className="grid min-h-screen w-full sm:grid-cols-[256px_1fr]">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-background sm:flex">
        <nav className="flex flex-col items-start gap-4 px-4 py-6">
          <Link to="/" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary mb-4">
            <Logo />
            <span className="text-lg font-bold text-foreground">Stride</span>
          </Link>
          <NavLink to="/history" className={({isActive}) => cn("flex w-full items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary", isActive && "bg-muted text-primary")}>
            <BookLogo className="h-5 w-5" />
            History
          </NavLink>
        </nav>
        {/* User profile section at the bottom */}
        <div className="mt-auto p-4 border-t">
            <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                    <AvatarImage src={session.user?.identities?.[0]?.identity_data?.avatar_url || session.user?.user_metadata?.avatar_url} alt={session.user?.email} />
                    <AvatarFallback>{session.user?.email?.[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col text-sm">
                    <span className="font-medium text-foreground truncate">{session.user?.user_metadata?.full_name || session.user?.email}</span>
                    <Button variant="link" className="h-auto p-0 justify-start text-muted-foreground" onClick={handleLogout}>Logout</Button>
                </div>
            </div>
        </div>
      </aside>
      
      {/* Main Content */}
      {/* The main content area no longer needs padding as the grid handles positioning */}
      <main className="flex flex-1 items-center justify-center p-4 sm:p-6 col-start-1 sm:col-start-2">
          <Outlet context={{ session }} />
      </main>
    </div>
  );
};