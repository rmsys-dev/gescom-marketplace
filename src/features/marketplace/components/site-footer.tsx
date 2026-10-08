'use client';

import Image from 'next/image';
import Link from 'next/link';

import { CONTACT_HREF, FOOTER_COLUMNS, LEGAL_LINKS } from '@/features/marketplace/footer-links';
import { COMPANY } from '@/features/marketplace/institutional';
import { cn } from '@/shared/lib/utils';

const footerLinkClass =
  'text-sm leading-snug text-secondary-foreground/80 outline-offset-4 hover:text-secondary-foreground hover:underline focus-visible:text-secondary-foreground focus-visible:underline';

const legalLinkClass =
  'text-xs leading-5 text-white/80 outline-offset-4 hover:text-white hover:underline focus-visible:text-white focus-visible:underline';

export function footerReserveClass(pathname: string, hasMobileNav: boolean) {
  if (pathname === '/checkout') return 'pb-28';
  if (!hasMobileNav) return undefined;
  if (pathname.startsWith('/produto/')) return 'pb-footer-product';
  return 'pb-footer';
}

export function SiteFooter({ className }: { className?: string }) {
  const year = new Date().getFullYear();

  return (
    <footer className={cn('bg-primary text-primary-foreground', className)}>

      <div className="bg-secondary text-secondary-foreground border-t border-primary/15">
        <div className="mx-auto grid w-full max-w-5xl gap-8 px-6 py-10 sm:grid-cols-2 md:grid-cols-3 md:gap-10 md:py-12">
          {FOOTER_COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="text-base font-bold text-secondary-foreground">{column.title}</h2>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={footerLinkClass}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="border-t border-primary/15">
          <div className="flex flex-wrap items-center justify-center gap-4 px-6 py-8">
            <Link href="/" aria-label="Gescom" className="inline-flex outline-offset-4">
              <Image
                src="/enterprise-logo-horizontal.png"
                alt=""
                width={2000}
                height={470}
                className="h-8 w-auto"
              />
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-6 py-8 text-center text-xs leading-5 text-primary-foreground bg-primary/30">
        <nav aria-label="Informações legais" className="flex flex-wrap items-center justify-center">
          {LEGAL_LINKS.map((link, index) => (
            <span key={link.href} className="inline-flex items-center">
              {index > 0 ? (
                <span className="mx-2 text-primary-foreground/40" aria-hidden>
                  |
                </span>
              ) : null}
              <Link href={link.href} className={legalLinkClass}>
                {link.label}
              </Link>

            </span>
          ))}
        </nav>
        <p>
          © {year} {COMPANY.owner}. Todos os direitos reservados.
        </p>
        <p className="my-4">
          {COMPANY.product} | CNPJ {COMPANY.cnpj}
        </p>
        <p>
          <Link href={CONTACT_HREF} className={legalLinkClass}>
            Fale conosco
          </Link>
        </p>
        <p className="max-w-xl text-primary-foreground/60 mt-4">
          Formas de pagamento aceitas: Pix, cartão de crédito, cartão de débito e boleto.
        </p>
      </div>
    </footer>
  );
}
