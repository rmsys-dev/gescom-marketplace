'use client';

import { BadgePercent, CreditCard, LayoutGrid, Star, Truck, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { useLayoutEffect, useRef, useState } from 'react';

import { cn } from '@/shared/lib/utils';

const PROMOS: {
  href: string;
  kicker: string;
  title: string;
  note: string;
  icon: LucideIcon;
  panel: string;
}[] = [
  {
    href: '/busca?frete=gratis',
    kicker: 'Frete grátis',
    title: 'Em compras a partir de R$ 199',
    note: 'Em todo o catálogo',
    icon: Truck,
    panel: 'bg-primary',
  },
  {
    href: '/busca?ordem=menor-preco',
    kicker: 'Ofertas',
    title: 'Preços menores nesta semana',
    note: 'Produtos selecionados',
    icon: BadgePercent,
    panel: 'bg-accent',
  },
  {
    href: '/categorias',
    kicker: 'Categorias',
    title: 'Encontre por grupo',
    note: 'Eletrônicos, casa, moda e mais',
    icon: LayoutGrid,
    panel: 'bg-secondary-solid',
  },
  {
    href: '/busca',
    kicker: 'Parcelamento',
    title: 'Em até 3x sem juros',
    note: 'No cartão, em anúncios elegíveis',
    icon: CreditCard,
    panel: 'bg-primary-active',
  },
  {
    href: '/busca?ordem=avaliacao',
    kicker: 'Bem avaliados',
    title: 'Os produtos com melhor nota',
    note: 'Escolhidos por quem comprou',
    icon: Star,
    panel: 'bg-primary',
  },
];

const HOLD_MS = 10_000;
const SLIDE_MS = 240;
const COUNT = PROMOS.length;

function withClones<T>(items: readonly T[]) {
  const first = items[0];
  const last = items[items.length - 1];
  if (!first || !last) return [...items];
  return [last, ...items, first];
}

const SLIDES = withClones(PROMOS);

function realIndex(extended: number) {
  if (extended <= 0) return COUNT - 1;
  if (extended >= COUNT + 1) return 0;
  return extended - 1;
}

export function PromoCarousel() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(1);
  const animRef = useRef<{ from: number; to: number; start: number; duration: number } | null>(
    null,
  );
  const holdUntilRef = useRef(0);
  const draggingRef = useRef(false);
  const pendingRef = useRef<{ x: number; y: number; index: number; pointerId: number } | null>(
    null,
  );
  const velocityRef = useRef(0);
  const lastSampleRef = useRef({ x: 0, t: 0 });
  const movedRef = useRef(0);
  const suppressClickRef = useRef(false);
  const [active, setActive] = useState(0);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reduced = motion.matches;
    const onMotion = () => {
      reduced = motion.matches;
    };
    motion.addEventListener('change', onMotion);

    const paint = () => {
      const width = viewport.clientWidth;
      if (width <= 0) return;
      for (const child of track.children) {
        if (child instanceof HTMLElement) child.style.width = `${width}px`;
      }
      track.style.transform = `translate3d(${-indexRef.current * width}px,0,0)`;
    };

    const publish = (extended: number) => {
      const next = realIndex(extended);
      setActive((current) => (current === next ? current : next));
    };

    const settle = (extended: number) => {
      let next = extended;
      if (next >= COUNT + 1) next = 1;
      else if (next <= 0) next = COUNT;
      indexRef.current = next;
      publish(next);
      paint();
    };

    holdUntilRef.current = performance.now() + HOLD_MS;
    paint();

    let frame = 0;
    const tick = (now: number) => {
      if (!draggingRef.current && !document.hidden) {
        const anim = animRef.current;
        if (anim) {
          const span = Math.max(anim.duration, 1);
          const t = Math.min(1, (now - anim.start) / span);
          const eased = 1 - (1 - t) ** 3;
          indexRef.current = anim.from + (anim.to - anim.from) * eased;
          if (t >= 1) {
            animRef.current = null;
            settle(anim.to);
            holdUntilRef.current = now + HOLD_MS;
          }
        } else if (!reduced && now >= holdUntilRef.current) {
          animRef.current = {
            from: indexRef.current,
            to: Math.round(indexRef.current) + 1,
            start: now,
            duration: SLIDE_MS,
          };
        }
      }
      paint();
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    const onDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      pendingRef.current = {
        x: event.clientX,
        y: event.clientY,
        index: indexRef.current,
        pointerId: event.pointerId,
      };
      lastSampleRef.current = { x: event.clientX, t: performance.now() };
      velocityRef.current = 0;
      movedRef.current = 0;
    };

    const onMove = (event: PointerEvent) => {
      const pending = pendingRef.current;
      if (!pending || pending.pointerId !== event.pointerId) return;
      const dx = event.clientX - pending.x;
      const dy = event.clientY - pending.y;
      const width = viewport.clientWidth || 1;

      if (!draggingRef.current) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        if (Math.abs(dy) > Math.abs(dx)) {
          pendingRef.current = null;
          return;
        }
        draggingRef.current = true;
        animRef.current = null;
        viewport.setPointerCapture(event.pointerId);
      }

      const now = performance.now();
      const sampleDx = event.clientX - lastSampleRef.current.x;
      const sampleDt = now - lastSampleRef.current.t;
      if (sampleDt > 0) velocityRef.current = sampleDx / sampleDt;
      lastSampleRef.current = { x: event.clientX, t: now };
      movedRef.current = Math.abs(dx);
      indexRef.current = pending.index - dx / width;
    };

    const onUp = (event: PointerEvent) => {
      const pending = pendingRef.current;
      if (pending && pending.pointerId !== event.pointerId) return;
      pendingRef.current = null;
      if (!draggingRef.current) return;
      draggingRef.current = false;
      if (movedRef.current > 6) suppressClickRef.current = true;

      const current = indexRef.current;
      const velocity = velocityRef.current;
      let target = Math.round(current);
      if (velocity <= -0.45) target = Math.ceil(current);
      else if (velocity >= 0.45) target = Math.floor(current);
      target = Math.max(0, Math.min(COUNT + 1, target));

      const duration = reduced ? 0 : SLIDE_MS;
      animRef.current = {
        from: current,
        to: target,
        start: performance.now(),
        duration,
      };
    };

    viewport.addEventListener('pointerdown', onDown);
    viewport.addEventListener('pointermove', onMove);
    viewport.addEventListener('pointerup', onUp);
    viewport.addEventListener('pointercancel', onUp);

    return () => {
      cancelAnimationFrame(frame);
      motion.removeEventListener('change', onMotion);
      viewport.removeEventListener('pointerdown', onDown);
      viewport.removeEventListener('pointermove', onMove);
      viewport.removeEventListener('pointerup', onUp);
      viewport.removeEventListener('pointercancel', onUp);
    };
  }, []);

  return (
    <section aria-label="Promoções" className="bg-background">
      <div className="w-full">
        <div
          ref={viewportRef}
          className="cursor-grab touch-pan-y overflow-hidden py-3 select-none active:cursor-grabbing"
          data-lenis-prevent-touch
          onClickCapture={(event) => {
            if (!suppressClickRef.current) return;
            event.preventDefault();
            event.stopPropagation();
            suppressClickRef.current = false;
          }}
        >
          <div ref={trackRef} className="flex w-max will-change-transform">
            {SLIDES.map((promo, index) => {
              const clone = index === 0 || index === SLIDES.length - 1;
              const real = clone ? -1 : index - 1;
              const Icon = promo.icon;
              const hidden = clone || real !== active;
              return (
                <div
                  key={`${promo.href}-${index}`}
                  className="w-full shrink-0 px-4"
                  aria-hidden={hidden}
                >
                  <Link
                    href={promo.href}
                    tabIndex={hidden ? -1 : undefined}
                    className="flex h-44 overflow-hidden rounded-2xl bg-card ring-1 ring-border md:h-52"
                  >
                    <span className="flex min-w-0 flex-1 flex-col justify-center px-5 py-4 md:px-8">
                      <span className="text-xs font-semibold tracking-wide text-primary uppercase">
                        {promo.kicker}
                      </span>
                      <span className="mt-1 max-w-md text-[1.65rem] leading-[1.1] font-bold tracking-tight text-foreground md:text-4xl">
                        {promo.title}
                      </span>
                      <span className="mt-2 text-sm text-muted-foreground">{promo.note}</span>
                    </span>
                    <span
                      className={cn(
                        'flex w-[34%] shrink-0 items-center justify-center text-primary-foreground md:w-[32%]',
                        promo.panel,
                      )}
                    >
                      <Icon className="size-16 md:size-20" aria-hidden />
                    </span>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
