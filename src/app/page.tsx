import { PromptGenerator } from '@/components/prompt-generator/prompt-generator';
import {
  BookOpen,
  FileText,
  Languages,
  Lightbulb,
  Sparkles,
  Wand2,
} from 'lucide-react';

export default function WritingPromptsPage() {
  return (
    <div className="flex flex-col">
      <div className="bg-muted/30">
        {/* Hero Section with H1 */}
        <section className="container mx-auto px-4 pt-12 md:pt-16 pb-4 md:pb-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">
              Free Writing Prompt Generator
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Instantly generate creative writing prompts tailored to your genre, style, and audience. Whether you need story starters, essay topics, or creative exercises, our AI-powered tool helps you overcome writer&apos;s block and spark your imagination.
            </p>
          </div>
        </section>

        {/* Prompt Generator Tool */}
        <section className="container mx-auto px-4 pb-8">
          <PromptGenerator
            hideHeader={true}
          />
        </section>

        {/* Section: Overcome Writer's Block */}
        <section className="container mx-auto px-4 py-16 md:py-20">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Lightbulb className="size-6 text-primary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Overcome Writer&apos;s Block Instantly
              </h2>
            </div>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Writer&apos;s block can strike at any time, leaving even the most experienced authors staring at a blank page. Our AI-powered writing prompt generator provides instant inspiration with carefully crafted prompts that challenge your creativity and push your writing to new heights. Each prompt is designed to spark unique storylines, develop complex characters, and explore compelling themes across every genre.
            </p>
          </div>
        </section>

        {/* Section: Story Starters */}
        <section className="container mx-auto px-4 py-16 md:py-20 border-t border-border/50">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <BookOpen className="size-6 text-primary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Story Starters for Every Genre
              </h2>
            </div>
            <p className="text-muted-foreground text-lg leading-relaxed mb-12">
              From epic fantasy quests to gripping psychological thrillers, our generator creates tailored prompts for any genre. Each prompt includes detailed setting descriptions, character sketches, and plot hooks to help you dive straight into your story.
            </p>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-background rounded-xl p-6 shadow-sm border border-border/50">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="size-5 text-primary" />
                  <h3 className="text-xl font-semibold text-foreground">
                    Fantasy &amp; Science Fiction
                  </h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Explore magical worlds, distant galaxies, and alternate realities. Generate prompts featuring epic quests, alien encounters, time travel paradoxes, and mythical creatures that will transport your readers to extraordinary realms.
                </p>
              </div>

              <div className="bg-background rounded-xl p-6 shadow-sm border border-border/50">
                <div className="flex items-center gap-2 mb-3">
                  <Wand2 className="size-5 text-primary" />
                  <h3 className="text-xl font-semibold text-foreground">
                    Thriller &amp; Mystery
                  </h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Create suspenseful narratives filled with unexpected twists. Get prompts for detective stories, psychological thrillers, crime fiction, and espionage tales that will keep your readers on the edge of their seats.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section: How to Use */}
        <section className="container mx-auto px-4 py-16 md:py-20 border-t border-border/50">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="size-6 text-primary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                How to Use Our Writing Prompt Generator
              </h2>
            </div>
            <p className="text-muted-foreground text-lg leading-relaxed mb-10">
              Getting started is simple. Follow these four easy steps to generate the perfect writing prompt for your next project.
            </p>

            <div className="grid gap-6 mb-10">
              {[
                {
                  title: 'Choose Your Genre or Style',
                  description: 'Select from our preset templates including Epic Fantasy, Sci-Fi Adventure, Thriller & Mystery, Romance & Drama, Horror & Dark Fiction, Business Email, Academic Paper, Product Documentation, Sales Copy, or Social Media Post.',
                },
                {
                  title: 'Customize Your Preferences',
                  description: 'Fine-tune your prompt by adjusting style, tone, length, audience, and purpose options to match your writing goals.',
                },
                {
                  title: 'Enter Your Topic or Idea',
                  description: 'Type in a brief description of what you want to write about, or use our AI Inspiration feature to generate creative ideas.',
                },
                {
                  title: 'Generate and Refine',
                  description: 'Click generate to get your customized writing prompt. Use AI Edit to refine, translate to other languages, or generate full text content from your prompt.',
                },
              ].map((step, index) => (
                <div
                  key={index}
                  className="flex gap-4 bg-background rounded-xl p-6 shadow-sm border border-border/50"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">
                      {step.title}
                    </h4>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-primary/5 rounded-xl p-6 border border-primary/10">
              <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Lightbulb className="size-5 text-primary" />
                Pro Tips
              </h4>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  Start with a broad topic and use the enhancement options to narrow down your prompt for more specific results.
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  Try different genre presets for the same topic to discover unique angles and perspectives you might not have considered.
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  Use the AI Edit feature to refine your generated prompt — add more detail, change the tone, or adjust the complexity level.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section: Why Choose Us */}
        <section className="container mx-auto px-4 py-16 md:py-20 border-t border-border/50">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="size-6 text-primary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Why Choose Our Writing Prompt Generator?
              </h2>
            </div>
            <p className="text-muted-foreground text-lg leading-relaxed mb-10">
              Our tool stands out with advanced AI technology, deep customization options, and a user-friendly interface designed for writers of all levels.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  key: 'aiPowered',
                  icon: Wand2,
                  title: 'AI-Powered Intelligence',
                  description: 'Powered by advanced AI models that understand narrative structure, character development, and genre conventions to generate truly useful writing prompts.',
                },
                {
                  key: 'customization',
                  icon: Lightbulb,
                  title: 'Deep Customization',
                  description: 'Fine-tune every aspect of your prompt with genre-specific options for style, tone, length, audience, and purpose. Each preset comes with its own specialized settings.',
                },
                {
                  key: 'multilingual',
                  icon: Languages,
                  title: 'Multi-Language Support',
                  description: 'Generate and translate writing prompts in multiple languages. Perfect for multilingual writers or those looking to practice writing in a foreign language.',
                },
                {
                  key: 'templates',
                  icon: FileText,
                  title: 'Rich Template Library',
                  description: 'Choose from 10 carefully designed preset templates covering fiction genres, business writing, academic papers, marketing copy, and social media content.',
                },
              ].map(({ key, icon: Icon, title, description }) => (
                <div
                  key={key}
                  className="bg-background rounded-xl p-6 shadow-sm border border-border/50"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="size-5 text-primary" />
                    </div>
                    <h4 className="font-semibold text-foreground">{title}</h4>
                  </div>
                  <p className="text-muted-foreground">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
