import type { InstitutionalBlock } from '@/features/marketplace/institutional';

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

  if (block.kind === 'list') {
    return (
      <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }

  return <p className="text-sm leading-relaxed text-muted-foreground">{block.text}</p>;
}

export function InstitutionalView({
  title,
  blocks,
}: {
  title: string;
  blocks: InstitutionalBlock[];
}) {
  return (
    <article className="mx-auto max-w-2xl space-y-4 pb-4">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {blocks.map((block, index) => (
        <Block key={index} block={block} />
      ))}
    </article>
  );
}
