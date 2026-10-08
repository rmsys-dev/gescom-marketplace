import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown, MessageCircle } from 'lucide-react';

import type { InstitutionalBlock } from '@/features/marketplace/institutional';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';

function Block({ block }: { block: InstitutionalBlock }) {
  if (block.kind === 'h2') {
    return (
      <h2
        id={block.id}
        className="scroll-mt-[calc(var(--store-header-h,4rem)+0.75rem)] pt-2 text-lg font-semibold tracking-tight"
      >
        {block.text}
      </h2>
    );
  }

  if (block.kind === 'lead') {
    return (
      <p className="text-base leading-relaxed text-foreground/90 sm:text-[1.05rem] sm:leading-relaxed">
        {block.text}
      </p>
    );
  }

  if (block.kind === 'list') {
    return (
      <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }

  if (block.kind === 'facts') {
    return (
      <dl className="grid gap-4 border-y border-border/80 py-5 sm:grid-cols-2">
        {block.items.map((item) => (
          <div key={item.label} className="space-y-1">
            <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {item.label}
            </dt>
            <dd className="text-sm font-semibold tracking-tight text-foreground">{item.value}</dd>
          </div>
        ))}
      </dl>
    );
  }

  if (block.kind === 'highlights') {
    return (
      <ul className="grid gap-5 sm:grid-cols-2">
        {block.items.map((item) => (
          <li key={item.title} className="space-y-1.5 border-l-2 border-primary/35 pl-3">
            <p className="text-sm font-semibold tracking-tight text-foreground">{item.title}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">{item.text}</p>
          </li>
        ))}
      </ul>
    );
  }

  if (block.kind === 'faq') {
    return (
      <div className="overflow-hidden rounded-xl border border-border/80">
        {block.items.map((item) => (
          <details
            key={item.question}
            className="group border-b border-border/80 last:border-b-0"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-sm font-semibold tracking-tight text-foreground outline-none transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 [&::-webkit-details-marker]:hidden">
              <span>{item.question}</span>
              <ChevronDown
                className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <p className="px-4 pb-4 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
          </details>
        ))}
      </div>
    );
  }

  if (block.kind === 'cta') {
    return (
      <aside className="mt-2 space-y-3 rounded-2xl bg-primary/5 px-5 py-5 ring-1 ring-primary/15 sm:px-6">
        <div className="space-y-1.5">
          <p className="text-sm font-semibold tracking-tight text-foreground">
            Ainda precisa de ajuda?
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">{block.text}</p>
        </div>
        <Button type="button" size="lg" className="w-full sm:w-auto" tooltip={false}>
          <MessageCircle data-icon="inline-start" aria-hidden />
          {block.label}
        </Button>
      </aside>
    );
  }

  return <p className="text-sm leading-relaxed text-muted-foreground">{block.text}</p>;
}

export function InstitutionalView({
  title,
  blocks,
  presentation = 'article',
  eyebrow,
  demoNotice = false,
}: {
  title: string;
  blocks: InstitutionalBlock[];
  presentation?: 'article' | 'brand';
  eyebrow?: string;
  demoNotice?: boolean;
}) {
  const isBrand = presentation === 'brand';
  const contentBlocks = isBrand ? blocks.filter((block) => block.kind !== 'lead') : blocks;
  const lead = isBrand ? blocks.find((block) => block.kind === 'lead') : undefined;

  return (
    <article className={cn('mx-auto space-y-4 pb-8', isBrand ? 'max-w-3xl space-y-6' : 'max-w-2xl')}>
      {isBrand ? (
        <header className="relative overflow-hidden rounded-2xl bg-primary px-5 py-7 text-primary-foreground sm:px-8 sm:py-9">
          <div className="pointer-events-none absolute -top-16 -left-14 size-48 rounded-full bg-secondary/35" />
          <div className="pointer-events-none absolute right-[-12%] bottom-[-28%] size-56 rounded-full bg-white/10" />
          <div className="relative space-y-5">
            <Link
              href="/"
              aria-label="Gescom"
              className="inline-flex rounded-xl bg-white px-4 py-3 outline-offset-4"
            >
              <Image
                src="/enterprise-logo-horizontal.png"
                alt="Gescom"
                width={2000}
                height={470}
                priority
                className="h-8 w-auto sm:h-9"
              />
            </Link>
            <div className="space-y-2">
              {eyebrow ? (
                <p className="text-sm font-medium text-primary-foreground/75">{eyebrow}</p>
              ) : null}
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
              {lead && lead.kind === 'lead' ? (
                <p className="max-w-2xl text-sm leading-relaxed text-primary-foreground/85 sm:text-base">
                  {lead.text}
                </p>
              ) : null}
            </div>
          </div>
        </header>
      ) : (
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      )}

      {demoNotice ? (
        <p className="rounded-xl border border-border/80 bg-secondary/40 px-4 py-3 text-xs leading-relaxed text-muted-foreground sm:text-sm">
          O checkout desta vitrine é demonstrativo: as orientações abaixo descrevem a prática
          esperada de uma loja online Gescom; nesta experiência a cobrança e a entrega físicas
          não são processadas.
        </p>
      ) : null}

      {contentBlocks.map((block, index) => (
        <Block key={index} block={block} />
      ))}
    </article>
  );
}
