"use client";

const shimmer =
  "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent";

export default function ActivityDetailSkeleton() {
  return (
    <div>
      <div className={`h-[70vh] min-h-[500px] bg-stone-200 ${shimmer}`} />

      <div className="bg-brand-warm py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`h-24 bg-white/60 rounded-xl ${shimmer}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10">
            <div className="space-y-4">
              <div className={`h-6 bg-stone-200 rounded-full w-full ${shimmer}`} />
              <div className={`h-6 bg-stone-200 rounded-full w-5/6 ${shimmer}`} />
              <div className={`h-6 bg-stone-200 rounded-full w-3/4 ${shimmer}`} />
              <div className="pt-4 space-y-3">
                <div className={`h-4 bg-stone-100 rounded-full w-full ${shimmer}`} />
                <div className={`h-4 bg-stone-100 rounded-full w-full ${shimmer}`} />
                <div className={`h-4 bg-stone-100 rounded-full w-4/5 ${shimmer}`} />
              </div>
            </div>
            <div className={`h-[400px] bg-stone-200 rounded-2xl ${shimmer}`} />
          </div>
        </div>
      </div>

      <div className="bg-brand-cream py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`h-8 bg-stone-200 rounded-full w-32 mb-6 ${shimmer}`} />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className={`col-span-2 row-span-2 h-[400px] bg-stone-200 rounded-xl ${shimmer}`} />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`h-[200px] bg-stone-200 rounded-xl ${shimmer}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
