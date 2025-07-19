import { useState, useEffect, useMemo, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/supabaseClient';
import { ArrowLeft, Download, Filter } from 'lucide-react';

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
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [sortOpen, setSortOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Create a ref for the sort menu dropdown element
  const sortMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      if (!session?.user) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('compiled_logs')
          .select('*')
          .eq('user_id', session.user.id)
          .order('week_start', { ascending: false });

        if (error) throw error;
        setLogs(data || []);
      } catch (error) {
        console.error('Error fetching logs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [session]);

  // Add an effect to handle clicks outside the sort menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // If the menu is open and the click is not inside the menu ref, close it
      if (
        sortMenuRef.current &&
        !sortMenuRef.current.contains(event.target as Node)
      ) {
        setSortOpen(false);
      }
    };

    // Add the event listener when the dropdown is open
    if (sortOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Cleanup: remove the event listener when the component unmounts or dropdown closes
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sortOpen]); // This effect re-runs whenever the 'sortOpen' state changes

  // Memoize the sorted logs to avoid re-sorting on every render
  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => {
      const dateA = new Date(a.week_start).getTime();
      const dateB = new Date(b.week_start).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [logs, sortOrder]);

  const handleDownload = (content: string, date: string) => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stride-log-${date}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --- RENDER LOGIC ---

  if (loading) {
    return (
      <div className="w-full max-w-2xl px-4 text-center">
        <h2 className="mb-4 text-2xl font-semibold">Past Entries</h2>
        <p className="text-muted-foreground">Loading your history...</p>
      </div>
    );
  }

  // Renders the detailed view of a single log
  if (selectedLog) {
    return (
      <div className="relative w-full max-w-2xl rounded-xl bg-card p-6 animate-in fade-in">
        <div className="mb-4 flex items-start justify-between">
          <button
            onClick={() => setSelectedLog(null)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() =>
              handleDownload(selectedLog.markdown_blob, selectedLog.week_start)
            }
            className="text-muted-foreground hover:text-foreground"
          >
            <Download className="h-5 w-5" />
          </button>
        </div>
        <div className="prose prose-invert max-w-none rounded-lg bg-secondary p-6">
          <ReactMarkdown>{selectedLog.markdown_blob}</ReactMarkdown>
        </div>
      </div>
    );
  }

  // Renders the main list view of all logs
  return (
    <div className="w-full max-w-2xl px-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Past Entries</h2>
        <div className="relative">
          <button
            onClick={() => setSortOpen(!sortOpen)}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm hover:bg-white/5"
          >
            <Filter className="h-4 w-4" /> Sort
          </button>
          {sortOpen && (
            <div
              ref={sortMenuRef}
              className="absolute right-0 z-10 mt-2 w-40 rounded-lg border border-border bg-card text-sm shadow-lg animate-in fade-in zoom-in-95"
            >
              <div
                onClick={() => {
                  setSortOrder('desc');
                  setSortOpen(false);
                }}
                className="cursor-pointer px-3 py-2 hover:bg-white/5"
              >
                Newest First
              </div>
              <div
                onClick={() => {
                  setSortOrder('asc');
                  setSortOpen(false);
                }}
                className="cursor-pointer px-3 py-2 hover:bg-white/5"
              >
                Oldest First
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-2">
        {sortedLogs.length > 0 ? (
          sortedLogs.map((log) => (
            <div
              key={log.id}
              className="cursor-pointer rounded-xl bg-card p-4 transition animate-in fade-in hover:bg-white/5"
              onClick={() => setSelectedLog(log)}
            >
              <p className="mb-1 text-sm text-muted-foreground">
                {log.week_start}
              </p>
              <p className="line-clamp-2 text-sm text-foreground">
                {log.markdown_blob
                  .replace(/(\*\*|##|✅|🎯|🧠|❓)/g, '')
                  .replace(/\s+/g, ' ')
                  .trim()}
              </p>
            </div>
          ))
        ) : (
          <p className="py-8 text-center text-muted-foreground">
            No past entries found.
          </p>
        )}
      </div>
    </div>
  );
};
