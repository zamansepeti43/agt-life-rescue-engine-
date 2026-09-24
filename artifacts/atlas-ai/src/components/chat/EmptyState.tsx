import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { BookOpen, Map, PenLine, Scale, type LucideIcon } from 'lucide-react';

interface Props {
  onSuggestion: (text: string) => void;
}

const SUGGESTIONS: Array<{ label: string; text: string; icon: LucideIcon }> = [
  { label: 'Karar Analizi', text: 'iPhone mı Samsung mı almalıyım? Fotoğraf çok önemli.', icon: Scale },
  { label: 'Öğrenme', text: 'Yapay zeka nedir ve nasıl çalışır? Hiç bilmiyorum.', icon: BookOpen },
  { label: 'Planlama', text: '6 ayda Python öğrenmek istiyorum, plan yap.', icon: Map },
  { label: 'Yazı', text: 'Yöneticime terfi talebimi içeren bir e-posta yaz.', icon: PenLine },
];

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
} satisfies Record<string, unknown>;

const item = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
} satisfies Record<string, unknown>;

export function EmptyState({ onSuggestion }: Props) {
  const [language, setLanguage] = useState<'tr' | 'en'>(() => localStorage.getItem('agt_life_language') === 'en' ? 'en' : 'tr');
  useEffect(() => { const onLanguage = () => setLanguage(localStorage.getItem('agt_life_language') === 'en' ? 'en' : 'tr'); window.addEventListener('agt-life-language-change', onLanguage); return () => window.removeEventListener('agt-life-language-change', onLanguage); }, []);
  const suggestions = language === 'en' ? [
    { label: 'Decision Analysis', text: 'Should I buy an iPhone or Samsung? Photography is very important.', icon: Scale },
    { label: 'Learning', text: 'What is artificial intelligence and how does it work? I know nothing about it.', icon: BookOpen },
    { label: 'Planning', text: 'I want to learn Python in 6 months. Make me a plan.', icon: Map },
    { label: 'Writing', text: 'Write an email to my manager asking for a promotion.', icon: PenLine },
  ] : SUGGESTIONS;
  const chips = language === 'en' ? ['Decision Analysis', 'Learning', 'Planning', 'Research', 'Writing', 'Problem Solving'] : ['Karar Analizi', 'Öğrenme', 'Planlama', 'Araştırma', 'Yazı', 'Problem Çözümü'];
  return (
    <div className="flex min-h-full w-full flex-col items-center justify-start py-5 md:justify-center md:px-4 md:py-10">
      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        className="w-full space-y-6 text-center md:max-w-2xl md:space-y-8"
      >
        {/* Logo */}
        <motion.div variants={item}>
          <h1 className="mb-2 font-serif text-[2.625rem] font-bold leading-none md:mb-3 md:text-6xl">
            <span className="text-foreground">Atlas</span>{' '}
            <span
              className="text-primary"
              style={{ textShadow: '0 0 40px hsl(var(--primary) / 0.35)' }}
            >
              AI
            </span>
          </h1>
          <p className="text-base font-light text-muted-foreground md:tracking-wide">
            {language === 'en' ? 'An intelligent advisor for every decision' : 'Her karar için akıllı bir danışman'}
          </p>
        </motion.div>

        {/* Capability chips */}
        <motion.div variants={item} className="hidden flex-wrap items-center justify-center gap-2 sm:flex">
          {chips.map((cap) => (
            <span
              key={cap}
              className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground/60"
            >
              {cap}
            </span>
          ))}
        </motion.div>

        {/* Suggestions */}
        <motion.div variants={item} className="grid w-full gap-3 md:grid-cols-2">
          {suggestions.map((suggestion) => {
            const Icon = suggestion.icon;
            return (
            <motion.button
              key={suggestion.label}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSuggestion(suggestion.text)}
              className="group min-h-24 w-full rounded-xl border border-border bg-card px-4 py-4 text-left transition-all duration-200 hover:border-primary/40 md:min-h-0 md:rounded-2xl md:px-5"
              data-testid={`suggestion-${suggestion.label}`}
            >
              <div className="mb-2 flex items-center gap-2">
                <Icon className="h-5 w-5 text-primary md:h-4 md:w-4" aria-hidden="true" />
                <span className="text-sm font-semibold uppercase tracking-widest text-primary md:text-xs">
                  {suggestion.label}
                </span>
              </div>
              <p className="text-[15px] leading-relaxed text-muted-foreground transition-colors group-hover:text-foreground md:text-sm">
                {suggestion.text}
              </p>
            </motion.button>
            );
          })}
        </motion.div>
      </motion.div>
    </div>
  );
}
