import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Islamic Trivia Game - Player Area',
  description: 'Play Islamic trivia games and win THR rewards',
};

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-emerald-50">
      {children}
    </div>
  );
} 