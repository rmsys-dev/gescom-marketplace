export default function Loading() {
  return (
    <div className="min-h-dvh bg-background" aria-busy="true" aria-live="polite">
      <div className="mx-auto w-full space-y-4 px-4 pt-6">
        <div className="h-11 rounded-full bg-muted" />
        <div className="grid grid-cols-2 gap-3">
          <div className="aspect-square rounded-2xl bg-muted" />
          <div className="aspect-square rounded-2xl bg-muted" />
        </div>
      </div>
    </div>
  );
}
