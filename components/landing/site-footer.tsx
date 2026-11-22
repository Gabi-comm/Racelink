import { Mail } from "lucide-react";
import { Logo } from "@/components/brand/logo";

const EMAIL = "racelinkcc@gmail.com";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-brand-deep text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between">
        <Logo tone="dark" className="h-8 self-start md:self-auto" />
        <a
          href={`mailto:${EMAIL}`}
          className="inline-flex items-center gap-2 self-start rounded-md text-[13px] text-white/80 transition-colors outline-none hover:text-white focus-visible:ring-3 focus-visible:ring-white/40 md:self-auto"
        >
          <Mail className="size-4" aria-hidden />
          {EMAIL}
        </a>
      </div>
    </footer>
  );
}
