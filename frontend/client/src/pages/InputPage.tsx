import { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/supabaseClient';

// Define a type for the context for better type safety
type AppContext = { session: any };

const questions = [
  {
    icon: '✅',
    label: 'What did you work on today?',
    placeholder: 'Fixed onboarding bug, wrote preview script...',
    key: 'whatIdid',
  },
  {
    icon: '🎯',
    label: 'What was the impact?',
    placeholder: 'Saved 2 hours for devs, sped up PR reviews...',
    key: 'impact',
  },
  {
    icon: '🧠',
    label: 'What did you learn?',
    placeholder: 'Feature flags, debugging build errors...',
    key: 'learned',
  },
  {
    icon: '❓',
    label: 'Any questions or next steps?',
    placeholder: 'Should I own onboarding? Explore CI tools?',
    key: 'questionsNext',
  },
];

export const InputPage = () => {
  const { session } = useOutletContext<AppContext>();
  const navigate = useNavigate();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [formData, setFormData] = useState({
    whatIdid: '',
    impact: '',
    learned: '',
    questionsNext: '',
  });
  const [status, setStatus] = useState<'idle' | 'submitting'>('idle');
  const [error, setError] = useState('');

  const current = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const isCurrentAnswerEmpty =
    !formData[current.key as keyof typeof formData].trim();

  const handleSubmit = async () => {
    if (!session?.user) {
      setError('You must be logged in to submit an entry.');
      return;
    }

    setStatus('submitting');
    setError('');

    const combinedContent = questions
      .map(
        (q) =>
          `${q.icon} ${q.label}\n${formData[q.key as keyof typeof formData] || 'N/A'}`
      )
      .join('\n\n');

    try {
      // Step 1: Save the raw entry
      const { error: dailyEntryError } = await supabase
        .from('entries')
        .insert([
          { user_id: session.user.id, content: combinedContent.trim() },
        ]);
      if (dailyEntryError) throw dailyEntryError;

      // Step 2: Trigger the backend compilation
      const response = await fetch(
        'http://localhost:8000/compile-weekly-log/',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: session.user.id }),
        }
      );

      // This block handles server errors (e.g., 500, 404) where a connection was made
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || 'The server responded with an error.'
        );
      }

      // Step 3: Navigate on success
      navigate('/history');
    } catch (err: any) {
      // --- NEW, USER-FRIENDLY ERROR HANDLING ---
      // This block handles network errors where no connection could be made
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        setError(
          'Cannot connect to the compilation service. Please check your connection or try again later.'
        );
      } else {
        // Handle other errors (from Supabase, or the server error thrown above)
        setError(err.message || 'An unknown error occurred.');
      }
      setStatus('idle');
      // --- END NEW HANDLING ---
    }
  };

  const handleNextOrSubmit = () => {
    if (!isLastQuestion) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleSubmit();
    }
  };

  return (
    <div className="w-full max-w-xl space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-semibold">
          {current.icon} {current.label}
        </h1>
      </div>

      <Textarea
        className="min-h-[120px] rounded-xl border-gray-100 bg-white p-4 text-base hover:border-gray-400 focus-visible:border-gray-400 focus-visible:ring-2 focus-visible:ring-offset-1"
        placeholder={current.placeholder}
        value={formData[current.key as keyof typeof formData]}
        onChange={(e) =>
          setFormData({ ...formData, [current.key]: e.target.value })
        }
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            if (!isCurrentAnswerEmpty) {
              handleNextOrSubmit();
            }
          }
        }}
      />

      <Button
        onClick={handleNextOrSubmit}
        className="w-full text-base"
        disabled={isCurrentAnswerEmpty || status === 'submitting'}
      >
        {status === 'submitting'
          ? 'Saving & Compiling...'
          : isLastQuestion
            ? 'Submit Log'
            : 'Next'}
      </Button>

      {error && (
        <p className="mt-2 text-center text-sm text-destructive">{error}</p>
      )}
    </div>
  );
};
