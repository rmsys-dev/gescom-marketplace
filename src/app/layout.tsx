import type { Metadata, Viewport } from 'next';

import 'lenis/dist/lenis.css';
import './globals.css';
import { QueryProvider } from '@/shared/components/providers/clients/query-client-provider';
import { SmoothScroll } from '@/shared/components/providers/clients/smooth-scroll';
import { TooltipProvider } from '@/shared/components/ui/tooltip';
import { cn } from '@/shared/lib/utils';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: {
    default: 'Gescom Marketplace',
    template: '%s | Gescom',
  },
  description:
    'Loja para comprar produtos. A vitrine e os pedidos ficam neste aparelho.',
  applicationName: 'Gescom Marketplace',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#28617e', // igual a --primary em globals.css
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={cn('antialiased', 'font-poppins')}>
      <body>
        <SmoothScroll>
          <QueryProvider>
            <TooltipProvider>
              {children}
              <Toaster richColors position="top-center" theme="light" />
            </TooltipProvider>
          </QueryProvider>
        </SmoothScroll>
      </body>
    </html>
  );
}
