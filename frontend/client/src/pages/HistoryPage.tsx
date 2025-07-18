import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/supabaseClient';
import { cn } from '@/lib/utils';
import { LogDisplay } from '@/components/LogDisplay';
// Note: We are no longer importing mock data here

// Define a type for the context for better type safety
type AppContext = { session: any };

// Define the shape of a log from your `compiled_logs` table
interface CompiledLog {
  id: string;
  user_id: string;
  week_start: string;
  markdown_blob: string;
  created_at: string;
}

export const HistoryPage = () => {
  const { session } = useOutletContext<AppContext>();
  const [logs, setLogs] = useState<CompiledLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<CompiledLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      if (!session?.user) {
        setLoading(false);
        setError('You must be logged in to view history.');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('compiled_logs')
          .select('*')
          .eq('user_id', session.user.id)
          .order('week_start', { ascending: false }); // Show most recent first

        if (fetchError) throw fetchError;

        setLogs(data || []);
        // Automatically select the most recent log to display first
        if (data && data.length > 0) {
          setSelectedLog(data[0]);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch logs.');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [session]); // Re-run the effect if the session changes

  const handleSelectLog = (log: CompiledLog) => {
    setSelectedLog(log);
  };

  const renderContent = () => {
    if (loading) {
      return <p className="p-6 text-muted-foreground">Loading history...</p>;
    }

    if (error) {
      return <p className="p-6 text-destructive">Error: {error}</p>;
    }

    if (logs.length === 0) {
      return (
        <p className="p-6 text-muted-foreground">
          No compiled logs found yet. Once you submit an entry, its weekly
          summary will appear here.
        </p>
      );
    }

    return (
      <div className="grid h-full md:grid-cols-[280px_1fr]">
        <aside className="flex flex-col gap-2 border-r bg-muted/20 p-6">
          <h2 className="px-3 text-lg font-semibold">Weeks</h2>
          <nav className="flex flex-col gap-1">
            {logs.map((log) => (
              <button
                key={log.id}
                onClick={() => handleSelectLog(log)}
                className={cn(
                  'w-full rounded-md px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-primary',
                  selectedLog?.id === log.id && 'bg-primary/10 text-primary'
                )}
              >
                Week of {log.week_start}
              </button>
            ))}
          </nav>
        </aside>
        <main className="p-6">
          <LogDisplay log={selectedLog} />
        </main>
      </div>
    );
  };

  return (
    <div className="h-full w-full">
      <div className="border-b p-6">
        <h1 className="text-3xl font-bold">Weekly Log History</h1>
      </div>
      {renderContent()}
    </div>
  );
};
