"use client";

interface SkeletonCardProps {
  variant?: "safari" | "park" | "testimony";
}

export default function SkeletonCard({ variant = "park" }: SkeletonCardProps) {
  const shimmer =
    "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent";

  if (variant === "testimony") {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-100">
        <div className="flex items-center space-x-1 mb-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`w-4 h-4 bg-stone-200 rounded ${shimmer}`} />
          ))}
        </div>
        <div className="space-y-2 mb-4">
          <div className={`h-3 bg-stone-200 rounded-full w-full ${shimmer}`} />
          <div className={`h-3 bg-stone-200 rounded-full w-full ${shimmer}`} />
          <div className={`h-3 bg-stone-200 rounded-full w-3/4 ${shimmer}`} />
        </div>
        <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
          <div>
            <div className={`h-3.5 bg-stone-200 rounded-full w-28 mb-1.5 ${shimmer}`} />
            <div className={`h-2.5 bg-stone-100 rounded-full w-20 ${shimmer}`} />
          </div>
          <div className={`h-3 bg-stone-100 rounded-full w-16 ${shimmer}`} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-stone-100">
      <div className={`h-48 bg-stone-200 ${shimmer}`} />
      <div className="p-6 space-y-3">
        <div className={`h-5 bg-stone-200 rounded-full w-3/4 ${shimmer}`} />
        <div className={`h-3 bg-stone-100 rounded-full w-1/2 ${shimmer}`} />
        {variant === "safari" && (
          <>
            <div className={`h-3 bg-stone-100 rounded-full w-full ${shimmer}`} />
            <div className={`h-3 bg-stone-100 rounded-full w-2/3 ${shimmer}`} />
          </>
        )}
        <div className={`h-3.5 bg-stone-200 rounded-full w-24 mt-2 ${shimmer}`} />
      </div>
    </div>
  );
}
