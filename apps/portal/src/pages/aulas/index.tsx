import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function AulasPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    // Redirect to new list page preserving query params
    const turmaId = searchParams.get('turmaId');
    navigate(`/aulas/list${turmaId ? `?turmaId=${turmaId}` : ''}`, { replace: true });
  }, [navigate, searchParams]);
  
  return null;
}
