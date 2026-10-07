import { LockKeyhole, Smartphone, Store, ChevronLeft, type LucideIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/shared/components/ui/button';

const POINTS: { icon: LucideIcon; text: string }[] = [
  { icon: Store, text: 'Vitrine, busca e filtros no mesmo lugar.' },
  { icon: Smartphone, text: 'Conta e pedidos salvos neste navegador.' },
  { icon: LockKeyhole, text: 'A senha só valida o formulário, sem servidor.' },
];

export function AuthShell({ backHref, children }: { backHref: string; children: React.ReactNode }) {
  return (
    <div
      data-auth-screen
      className="flex h-dvh max-h-dvh overflow-hidden bg-card pt-[env(safe-area-inset-top)]"
    >
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-card focus:px-3 focus:py-2 focus:shadow-card"
      >
        Pular para o conteúdo
      </a>
      <aside className="relative hidden w-[min(44%,40rem)] shrink-0 flex-col justify-between overflow-hidden bg-primary px-12 py-14 text-primary-foreground lg:flex">
        <div className="pointer-events-none absolute -top-24 -left-20 size-72 rounded-full bg-secondary/35" />
        <div className="pointer-events-none absolute right-[-18%] bottom-[-12%] size-80 rounded-full bg-white/10" />
        <Link href="/" className="relative inline-flex w-fit rounded-2xl bg-white px-4 py-3">
          <Image
            src="/enterprise-logo-horizontal.png"
            alt="Gescom"
            width={2000}
            height={470}
            priority
            className="h-10 w-auto"
          />
        </Link>
        <div className="relative max-w-md space-y-8">
          <h2 className="font-poppins text-5xl leading-tight font-semibold tracking-tight">
            A vitrine fica neste aparelho.
          </h2>
          <ul className="space-y-5">
            {POINTS.map((point) => (
              <li key={point.text} className="flex items-start gap-3 text-base leading-snug">
                <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-white/12">
                  <point.icon className="size-5" aria-hidden />
                </span>
                <span className="pt-2 text-primary-foreground/90">{point.text}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-primary-foreground/70">Gescom Marketplace</p>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="relative flex h-14 shrink-0 items-center px-2 sm:px-4">
          <Button asChild variant="ghost" className="h-10 gap-1 px-2" tooltip={false}>
            <Link href={backHref} aria-label="Voltar">
              <ChevronLeft />
              <span className="hidden sm:inline">Voltar</span>
            </Link>
          </Button>
          <Link
            href="/"
            aria-label="Gescom"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 lg:hidden"
          >
            <Image
              src="/enterprise-logo-horizontal.png"
              alt=""
              width={2000}
              height={470}
              priority
              className="h-7 w-auto"
            />
          </Link>
        </header>
        <main id="conteudo" data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-10">
            <div className="w-full max-w-lg lg:max-w-2xl">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
