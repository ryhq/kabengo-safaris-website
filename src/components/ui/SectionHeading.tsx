interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  align?: "center" | "left";
}

export default function SectionHeading({ title, subtitle, align = "center" }: SectionHeadingProps) {
  return (
    <div className={`mb-12 ${align === "center" ? "text-center" : "text-left"}`}>
      <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4 font-serif">
        {title}
      </h2>
      <div
        className={`w-20 h-1 bg-brand-brown rounded-full mb-4 ${
          align === "center" ? "mx-auto" : ""
        }`}
      />
      {subtitle && (
        <p className="text-lg text-stone-600 max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  );
}
