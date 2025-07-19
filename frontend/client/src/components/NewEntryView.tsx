import { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Mic, ArrowRight, Send } from 'lucide-react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '@/supabaseClient';

const questions = [
  'What did you work on today?',
  'What was the impact?',
  'What did you learn?',
  'Any questions or next steps?',
];

const questionKeys = ['whatIdid', 'impact', 'learned', 'questionsNext'];

type AppContext = { session: any };

export const NewEntryView = () => {
  const { session } = useOutletContext<AppContext>();
  const navigate = useNavigate();

  const [answers, setAnswers] = useState(Array(questions.length).fill(''));
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [status, setStatus] = useState<'idle' | 'submitting'>('idle');
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleSubmit();
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

      // Reset form and navigate
      setAnswers(Array(questions.length).fill(''));
      setCurrentQuestion(0);
      navigate(0); // This is a trick to force a re-render/re-fetch on the history page if the user goes there next.
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setStatus('idle');
    }
  };

  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center px-4">
      <div className="mb-6 flex w-full max-w-2xl flex-col items-center text-center">
        <div className="mb-4 flex items-center justify-center gap-4">
          {questions.map((_, i) => (
            <div
              key={i}
              onClick={() => setCurrentQuestion(i)}
              className="flex cursor-pointer items-center gap-1"
            >
              {i !== 0 && <div className="h-px w-8 bg-muted-foreground/30" />}
              <span
                className={`h-2 w-2 rounded-full transition-all ${i === currentQuestion ? 'bg-white' : 'bg-muted-foreground/50'}`}
              />
            </div>
          ))}
        </div>
        <div className="text-2xl font-semibold">Stride</div>
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
          <button
            onClick={handleNext}
            disabled={
              !answers[currentQuestion].trim() || status === 'submitting'
            }
          >
            {currentQuestion === questions.length - 1 ? (
              <Send className="h-5 w-5 cursor-pointer text-blue-400 hover:text-blue-300" />
            ) : (
              <ArrowRight className="h-5 w-5 cursor-pointer text-muted-foreground hover:text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
