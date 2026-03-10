'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQ_ITEMS = [
  {
    question: 'What is GenreGenie?',
    answer:
      'GenreGenie is a free AI-powered writing prompt generator that creates customized writing prompts across multiple genres. It helps writers overcome creative blocks by generating unique story ideas, character concepts, and plot hooks tailored to your preferred genre and style.',
  },
  {
    question: 'Is GenreGenie free to use?',
    answer:
      'Yes! GenreGenie offers a free plan with 15 daily credits. You can generate writing prompts, translate them, and use AI editing features. For more daily credits and advanced models, you can upgrade to our Basic or Pro plans.',
  },
  {
    question: 'What genres does the writing prompt generator support?',
    answer:
      'GenreGenie supports a wide range of genres including Epic Fantasy, Sci-Fi Adventure, Thriller & Mystery, Romance & Drama, Horror & Dark Fiction, Business Email, Academic Paper, Product Documentation, Sales Copy, and Social Media Post. Each genre comes with specialized customization options.',
  },
  {
    question: 'Can I generate full text content from a writing prompt?',
    answer:
      'Yes! After generating a writing prompt, you can use the "Generate Content" feature to create full text based on your prompt. You can also continue generating more content or use AI Edit to refine the output.',
  },
  {
    question: 'Does GenreGenie support multiple languages?',
    answer:
      'Yes, GenreGenie supports multi-language translation. You can generate writing prompts in English and translate them into other languages, or use the translation feature to work with prompts in your preferred language.',
  },
  {
    question: 'What AI models power GenreGenie?',
    answer:
      'GenreGenie uses advanced AI language models to generate high-quality writing prompts. Free and Basic plan users get access to standard models, while Pro plan users can use advanced models for higher quality and longer outputs.',
  },
  {
    question: 'How do credits work?',
    answer:
      'Each AI action (generating prompts, translating, editing, etc.) costs a certain number of credits. Daily credits refresh every day based on your plan. You can also purchase credit packs that never expire and are used after your daily credits run out.',
  },
  {
    question: 'Can I save my generated prompts and content?',
    answer:
      'Yes! All your generated prompts and content are automatically saved to your account. You can view, copy, and manage them from the Dashboard under "My Works".',
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {FAQ_ITEMS.map((item, index) => (
        <div
          key={index}
          className="bg-background rounded-xl border border-border/50 overflow-hidden"
        >
          <button
            className="w-full flex items-center justify-between px-6 py-4 text-left"
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
          >
            <span className="font-medium text-foreground pr-4">{item.question}</span>
            <ChevronDown
              className={`size-5 text-muted-foreground shrink-0 transition-transform duration-200 ${
                openIndex === index ? 'rotate-180' : ''
              }`}
            />
          </button>
          {openIndex === index && (
            <div className="px-6 pb-4">
              <p className="text-muted-foreground leading-relaxed">{item.answer}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
