import { useState, useRef, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/supabaseClient';
import { Mic, ArrowRight, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const questions = [
  'What did you work on today?',
  'What was the impact?',
  'What did you learn?',
  'Any questions or next steps?',
];

type AppContext = { session: any };

export const InputPage = () => {
  const { session } = useOutletContext<AppContext>();
  const navigate = useNavigate();

  const [answers, setAnswers] = useState(Array(questions.length).fill(''));
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [maxReachedQuestion, setMaxReachedQuestion] = useState(0);
  const [status, setStatus] = useState<'idle' | 'submitting'>('idle');
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isLastQuestion = currentQuestion === questions.length - 1;
  const isCurrentAnswerEmpty = !answers[currentQuestion].trim();

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 240)}px`;
    }
    textareaRef.current?.focus();
  }, [currentQuestion, answers]);

  const updateAnswer = (value: string) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = value;
    setAnswers(newAnswers);
  };

  const handleNextOrSubmit = () => {
    if (!isLastQuestion) {
      const nextQuestionIndex = currentQuestion + 1;
      setCurrentQuestion(nextQuestionIndex);
      if (nextQuestionIndex > maxReachedQuestion) {
        setMaxReachedQuestion(nextQuestionIndex);
      }
    } else {
      handleSubmit();
    }
  };

  const handleDotClick = (index: number) => {
    if (index <= maxReachedQuestion) {
      setCurrentQuestion(index);
    }
  };

  const handleSubmit = async () => {
    if (!session?.user) {
      setError('You must be logged in.');
      return;
    }
    setStatus('submitting');
    setError('');

    const formData = {
      whatIdid: answers[0],
      impact: answers[1],
      learned: answers[2],
      questionsNext: answers[3],
    };

    const combinedContent = `✅ What I did\n${formData.whatIdid || 'N/A'}\n\n🎯 Impact\n${formData.impact || 'N/A'}\n\n🧠 Learned\n${formData.learned || 'N/A'}\n\n❓ Questions / Next\n${formData.questionsNext || 'N/A'}`;

    try {
      const { error: insertError } = await supabase
        .from('entries')
        .insert([{ user_id: session.user.id, content: combinedContent }]);
      if (insertError) throw insertError;

      const res = await fetch('http://localhost:8000/compile-weekly-log/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: session.user.id }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to compile log');
      }

      navigate('/history');
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
      setStatus('idle');
    }
  };

  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center px-4">
      <div className="mb-6 flex w-full max-w-2xl flex-col items-center text-center">
        <div className="mb-2 text-4xl font-bold">Stride</div>
        <p className="mb-6 text-sm text-muted-foreground">
          Take the next step.
        </p>
        <div className="flex items-center justify-center gap-4">
          {questions.map((_, i) => {
            const isUnlocked = i <= maxReachedQuestion;
            return (
              <div
                key={i}
                onClick={() => handleDotClick(i)}
                className={cn(
                  'flex items-center gap-1',
                  // --- FIX: Changed cursor-not-allowed to cursor-default ---
                  isUnlocked ? 'cursor-pointer' : 'cursor-default'
                )}
              >
                {i !== 0 && (
                  <div
                    className={cn(
                      'h-px w-10',
                      isUnlocked
                        ? 'bg-muted-foreground/30'
                        : 'bg-muted-foreground/10'
                    )}
                  />
                )}
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full transition-all',
                    i === currentQuestion
                      ? 'bg-white'
                      : isUnlocked
                        ? 'bg-muted-foreground/50'
                        : 'bg-muted-foreground/20'
                  )}
                />
              </div>
            );
          })}
        </div>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </div>

      <div className="w-full max-w-2xl rounded-xl bg-card p-4">
        <p className="mb-2 text-sm text-muted-foreground">
          {questions[currentQuestion]}
        </p>
        <Textarea
          ref={textareaRef}
          className="max-h-[240px] min-h-[48px] w-full resize-none overflow-y-auto border-none bg-transparent p-0 text-base text-foreground placeholder:text-muted-foreground/80 focus-visible:ring-0"
          placeholder="Type your response..."
          value={answers[currentQuestion]}
          onChange={(e) => updateAnswer(e.target.value)}
          rows={1}
          autoFocus
        />
        <div className="mt-3 flex items-center justify-end gap-3">
          <Mic className="h-5 w-5 text-muted-foreground hover:text-white" />
          {/* --- FIX: Updated button logic and icon classNames --- */}
          <button
            onClick={handleNextOrSubmit}
            disabled={isCurrentAnswerEmpty || status === 'submitting'}
            className="disabled:cursor-default"
          >
            {status === 'submitting' ? (
              <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
            ) : isLastQuestion ? (
              <Send
                className={cn(
                  'h-5 w-5 transition-colors',
                  isCurrentAnswerEmpty ? 'text-blue-400/50' : 'text-blue-400'
                )}
              />
            ) : (
              <ArrowRight
                className={cn(
                  'h-5 w-5 transition-colors',
                  isCurrentAnswerEmpty
                    ? 'text-muted-foreground/50'
                    : 'text-white'
                )}
              />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
