import React from 'react';
import ReactMarkdown from 'react-markdown';

// A simple utility to format 'YYYY-MM-DD' to a more readable format
const formatDate = (dateString: string) => {
  // Add 'T00:00:00' to avoid timezone-related "off-by-one-day" errors
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

interface LogDisplayProps {
  log: {
    week_start: string;
    markdown_blob: string;
  } | null;
}

export const LogDisplay = ({ log }: LogDisplayProps) => {
  if (!log) {
    return (
      <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/50 p-8 text-center">
        <h3 className="text-lg font-semibold text-foreground">
          No Log Selected
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Please select a week from the list to view its compiled entry.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold">
        Weekly Log for {formatDate(log.week_start)}
      </h2>

      {/* 
        FIX: Removed the `text-primary-foreground` class.
        This allows the `prose-invert` class to correctly apply
        its own set of varied text colors for the dark background.
      */}
      <div className="prose prose-invert max-w-none rounded-lg bg-primary p-6">
        <ReactMarkdown
          components={{
            // Optional: These overrides are good for ensuring consistency.
            h2: ({ node, ...props }) => (
              <h2 className="text-primary-foreground" {...props} />
            ),
            strong: ({ node, ...props }) => (
              <strong className="text-primary-foreground/90" {...props} />
            ),
          }}
        >
          {log.markdown_blob}
        </ReactMarkdown>
      </div>
    </div>
  );
};
