import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function NotFound() {
  const [language, setLanguage] = useState<'tr' | 'en'>(() => localStorage.getItem('agt_life_language') === 'en' ? 'en' : 'tr');
  useEffect(() => { const onLanguage = () => setLanguage(localStorage.getItem('agt_life_language') === 'en' ? 'en' : 'tr'); window.addEventListener('agt-life-language-change', onLanguage); return () => window.removeEventListener('agt-life-language-change', onLanguage); }, []);
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">
              {language === 'en' ? '404 Page Not Found' : '404 Sayfa Bulunamadı'}
            </h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            {language === 'en' ? 'Did you forget to add the page to the router?' : 'Bu sayfayı yönlendiriciye eklemeyi unuttun mu?'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
