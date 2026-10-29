// components/loaders/CardSkeleton.tsx

export default function CardSkeleton() {
  return (
    <div className="w-full p-5 rounded-2xl border-2 border-base-300 bg-base-100 shadow-sm space-y-4">
      {/* Header Area */}
      <div className="flex items-center gap-4">
        <div className="skeleton h-12 w-12 shrink-0 rounded-xl bg-base-300"></div>
        <div className="flex flex-col gap-2 w-full">
          <div className="skeleton h-6 w-1/3 bg-base-300"></div>
          <div className="skeleton h-5 w-1/2 opacity-50 bg-base-300"></div>
        </div>
      </div>

      {/* Body Content */}
      <div className="space-y-2">
        <div className="skeleton h-5 w-full bg-base-300"></div>
        <div className="skeleton h-5 w-full bg-base-300"></div>
        <div className="skeleton h-5 w-3/4 bg-base-300 opacity-60"></div>
      </div>

      {/* Footer/Actions */}
      <div className="pt-2 flex justify-end gap-2">
        <div className="skeleton h-8 w-20 rounded-lg bg-base-300"></div>
        <div className="skeleton h-8 w-20 rounded-lg bg-base-300"></div>
      </div>
    </div>
  );
}