import dynamic from 'next/dynamic';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import {
  BookOpen,
  Briefcase,
  FileText,
  GraduationCap,
  Heart,
  HelpCircle,
  Info,
  Languages,
  Lightbulb,
  Mail,
  Megaphone,
  Skull,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { FaqSection } from '@/components/faq-section';

const PromptGenerator = dynamic(
  () => import('@/components/prompt-generator/prompt-generator').then(mod => mod.PromptGenerator),
);

export default function WritingPromptsPage() {
  return (
    <>
      <head>
        <link rel="canonical" href="https://genregenie.top/" />
      </head>
      <div className="flex flex-col">
        <main className="bg-muted/30 bg-[url('/images/background.webp')] bg-cover bg-center bg-no-repeat bg-fixed">
        <Navbar />

        {/* Hero Section with H1 */}
        <section className="container mx-auto px-4 pt-6 md:pt-10 pb-4 md:pb-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">
              GenreGenie – Your Professional AI Writing Prompt Generator
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              GenreGenie is a free AI writing prompt generator for creative writing prompts across any genre. Use this random writing prompt generator for short story prompts, novel ideas, or writing exercises — overcome writer&apos;s block and spark your imagination instantly.
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
                Overcome Writer&apos;s Block with Creative Writing Prompts
              </h2>
            </div>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Writer&apos;s block can strike at any time, leaving even the most experienced authors staring at a blank page. Our AI-powered writing prompt generator provides instant inspiration with carefully crafted creative writing prompts that challenge your creativity and push your writing to new heights. Use this random prompt generator to spark unique storylines, develop complex characters, and explore compelling themes. GenreGenie&apos;s writing prompt generator delivers fresh short story prompts and story ideas every time you need them.
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
                Explore Diverse Creative Writing Prompts
              </h2>
            </div>
            <p className="text-muted-foreground text-lg leading-relaxed mb-12">
              From epic fantasy quests to gripping psychological thrillers, our story prompt generator creates tailored writing prompts for any genre. This short story prompt generator includes detailed setting descriptions, character sketches, and plot hooks to help you dive straight into your story with creative writing prompts designed for your chosen genre.
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

              <div className="bg-background rounded-xl p-6 shadow-sm border border-border/50">
                <div className="flex items-center gap-2 mb-3">
                  <Heart className="size-5 text-primary" />
                  <h3 className="text-xl font-semibold text-foreground">
                    Romance &amp; Drama
                  </h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Craft heartfelt love stories and emotionally charged dramas. Get writing prompts for meet-cutes, forbidden romances, family sagas, and coming-of-age tales that resonate with readers on a deeply personal level.
                </p>
              </div>

              <div className="bg-background rounded-xl p-6 shadow-sm border border-border/50">
                <div className="flex items-center gap-2 mb-3">
                  <Skull className="size-5 text-primary" />
                  <h3 className="text-xl font-semibold text-foreground">
                    Horror &amp; Dark Fiction
                  </h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Unleash your darkest imagination with chilling writing prompts. Generate story ideas featuring haunted locations, supernatural entities, psychological horror, and cosmic dread that will leave your readers sleeping with the lights on.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* Section: Business Writing Prompts */}
        <section className="container mx-auto px-4 py-16 md:py-20 border-t border-border/50">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Briefcase className="size-6 text-primary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Business &amp; Professional Writing Prompt Generator
              </h2>
            </div>
            <p className="text-muted-foreground text-lg leading-relaxed mb-12">
              Go beyond fiction with our writing prompt generator for professional and business content. Generate tailored writing prompts for emails, academic papers, marketing copy, and more — helping you craft polished, effective business communications every time.
            </p>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-background rounded-xl p-6 shadow-sm border border-border/50">
                <div className="flex items-center gap-2 mb-3">
                  <Mail className="size-5 text-primary" />
                  <h3 className="text-xl font-semibold text-foreground">
                    Business Email Prompts
                  </h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Generate writing prompts for professional emails including cold outreach, follow-ups, client communications, and internal memos. Our writing prompt generator helps you strike the right tone for every business email scenario.
                </p>
              </div>

              <div className="bg-background rounded-xl p-6 shadow-sm border border-border/50">
                <div className="flex items-center gap-2 mb-3">
                  <GraduationCap className="size-5 text-primary" />
                  <h3 className="text-xl font-semibold text-foreground">
                    Academic Paper Prompts
                  </h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Get writing prompts for research papers, essays, thesis statements, and literature reviews. This prompt generator for writing helps students and researchers develop compelling academic arguments and structure their papers effectively.
                </p>
              </div>

              <div className="bg-background rounded-xl p-6 shadow-sm border border-border/50">
                <div className="flex items-center gap-2 mb-3">
                  <Megaphone className="size-5 text-primary" />
                  <h3 className="text-xl font-semibold text-foreground">
                    Sales Copy &amp; Marketing Prompts
                  </h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Create persuasive writing prompts for landing pages, ad copy, product descriptions, and social media campaigns. Our writing prompt generator delivers conversion-focused prompts that drive results for your marketing content.
                </p>
              </div>

              <div className="bg-background rounded-xl p-6 shadow-sm border border-border/50">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="size-5 text-primary" />
                  <h3 className="text-xl font-semibold text-foreground">
                    Product Documentation Prompts
                  </h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Generate writing prompts for user guides, API documentation, release notes, and technical manuals. Our prompt generator for writing helps you produce clear, structured documentation that your users will actually want to read.
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
              Getting started with this writing prompt generator is simple. Follow these four easy steps to generate the perfect random writing prompt for your next creative writing project.
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
                    <h3 className="font-semibold text-foreground mb-2">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-primary/5 rounded-xl p-6 border border-primary/10">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Lightbulb className="size-5 text-primary" />
                Pro Tips
              </h3>
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
        <section id="features" className="container mx-auto px-4 py-16 md:py-20 border-t border-border/50">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="size-6 text-primary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Why Choose Our AI Writing Prompt Generator?
              </h2>
            </div>
            <p className="text-muted-foreground text-lg leading-relaxed mb-10">
              GenreGenie&apos;s AI writing prompt generator stands out with advanced AI technology, deep customization options, and a user-friendly interface designed for writers of all levels. As a random prompt generator built for creative writing, it delivers unique writing prompts every time.
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
                    <h3 className="font-semibold text-foreground">{title}</h3>
                  </div>
                  <p className="text-muted-foreground">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section: FAQ */}
        <section id="faq" className="container mx-auto px-4 py-16 md:py-20 border-t border-border/50">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <HelpCircle className="size-6 text-primary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Frequently Asked Questions
              </h2>
            </div>
            <p className="text-muted-foreground text-lg leading-relaxed mb-10">
              Everything you need to know about GenreGenie&apos;s AI writing prompt generator.
            </p>
            <FaqSection />
          </div>
        </section>

        {/* Section: About GenreGenie Writing Prompt Generator */}
        <section id="about" className="container mx-auto px-4 py-16 md:py-20 border-t border-border/50">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Info className="size-6 text-primary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                About GenreGenie Writing Prompt Generator
              </h2>
            </div>
            <p className="text-muted-foreground text-lg leading-relaxed">
              As a leading writing prompt generator, GenreGenie is designed to be the only writing prompt generator you need. Whether you&apos;re looking for an AI writing prompt generator for a novel or a random writing prompt generator for daily practice, our tool delivers. This writing prompt generator supports multiple genres, making it the most versatile writing prompt generator online. Every writing prompt generator result is tailored to your style. Experience the power of our writing prompt generator and see why writers prefer this writing prompt generator for endless inspiration. From creative writing prompts to short story prompt ideas, GenreGenie&apos;s prompt generator for writing covers it all.
            </p>
          </div>
        </section>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </>
  );
}
