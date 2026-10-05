import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { InstitutionalView } from '@/features/marketplace/components/institutional-view';
import { getInstitutionalPage, institutionalSlugs } from '@/features/marketplace/institutional';

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return institutionalSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getInstitutionalPage(slug);
  if (!page) return { title: 'Página não encontrada' };
  return { title: page.title, description: page.description };
}

export default async function InstitutionalPage({ params }: PageProps) {
  const { slug } = await params;
  const page = getInstitutionalPage(slug);
  if (!page) notFound();

  return <InstitutionalView title={page.title} blocks={page.blocks} />;
}
