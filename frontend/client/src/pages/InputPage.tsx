import { useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/supabaseClient"; 

// Define a type for the context for better type safety
type AppContext = { session: any };

export const InputPage = () => {
  const { session } = useOutletContext<AppContext>();
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [formData, setFormData] = useState({
    whatIdid: '',
    impact: '',
    learned: '',
    questionsNext: '',
  });
  const [status, setStatus] = useState<'idle' | 'submitting'>('idle');
  const [error, setError] = useState('');

  const questions = [
    { key: 'whatIdid', prompt: 'What did you work on today?' },
    { key: 'impact', prompt: 'What impact did it have?' },
    { key: 'learned', prompt: 'Did you learn anything new or useful?' },
    { key: 'questionsNext', prompt: 'Any questions or next steps?' },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };
  
  const handleSubmitEntry = async () => {
    if (!session?.user) {
      setError('Not logged in.');
      return;
    }

    setStatus('submitting');
    setError('');

    const combinedContent = `
✅ What I did:
${formData.whatIdid || 'N/A'}
🎯 Impact:
${formData.impact || 'N/A'}
🧠 Learned:
${formData.learned || 'N/A'}
❓ Questions / Next:
${formData.questionsNext || 'N/A'}
    `.trim();

    try {
      // First save the raw entry
      const { error: dailyEntryError } = await supabase.from('entries').insert([{ user_id: session.user.id, content: combinedContent }]);
      if (dailyEntryError) throw dailyEntryError;

      // Then trigger the compilation
      const response = await fetch('http://localhost:8000/compile-weekly-log/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: session.user.id }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to compile log.');
      }
      
      // On success, navigate to the history page to see the result
      navigate('/history');

    } catch (error: any) {
      setError(error.message);
      setStatus('idle');
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    // CORRECTED: Removed the outer centering div, as the Layout now handles it.
    <div className="w-full max-w-2xl flex flex-col items-center text-center">
      <h1 className="text-4xl font-semibold text-foreground mb-12">
        {currentQuestion.prompt}
      </h1>
      <Textarea
        name={currentQuestion.key}
        value={formData[currentQuestion.key as keyof typeof formData]}
        onChange={handleInputChange}
        className="text-lg bg-card border-2 border-border focus-visible:ring-primary min-h-[140px] resize-none"
        placeholder="Log your progress..."
      />
      <div className="mt-8">
        {isLastQuestion ? (
          <Button size="lg" onClick={handleSubmitEntry} disabled={status === 'submitting'}>
            {status === 'submitting' ? 'Saving Your Stride...' : 'Complete Entry'}
          </Button>
        ) : (
          <Button variant="outline" size="lg" onClick={handleNextQuestion}>
            Next →
          </Button>
        )}
      </div>
      {error && <p className="mt-4 text-destructive">{error}</p>}
    </div>
  );
};