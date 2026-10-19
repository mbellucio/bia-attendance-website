type SiteBannerProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function SiteBanner({ eyebrow, title, description }: SiteBannerProps) {
  return (
    <section className="w-full self-stretch border border-white/10 bg-[linear-gradient(110deg,#171b18_0%,#202820_64%,#293229_100%)] px-5 py-8 sm:px-7 sm:py-10 md:py-12">
      <p className="mb-3 text-[9px] font-semibold uppercase tracking-[.19em] text-[#b6c781] sm:text-[10px]">{eyebrow}</p>
      <h1 className="m-0 text-[clamp(42px,5.2vw,72px)] font-medium leading-none tracking-[-.065em] text-[#f6f4e9]">{title}</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-[#c4c8bd]">{description}</p>
    </section>
  );
}
