import { useNavigate } from 'react-router-dom';
import TStoreTutorial from '../store/TStoreTutorial';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/useAuthStore';

export default function TutorialPage() {
  const navigate = useNavigate();
  const user = useAuthStore.getState().user;

  const handleComplete = async () => {
    if (user?.id) {
      await supabase
        .from('profiles')
        .update({ tutorial_completed: true })
        .eq('id', user.id);
    }
    navigate('/hazloapp', { replace: true });
  };

  return <TStoreTutorial onComplete={handleComplete} />;
}