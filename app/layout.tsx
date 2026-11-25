import type { Metadata } from "next";
import { Oswald, Plus_Jakarta_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/theme-toggle";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

// condensed font para sa hero headline
const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "RaceLink", template: "%s · RaceLink" },
  description: "Race registration for runners, organizers and the organizations that host races in Metro Manila and nearby.",
};

export default function RootLayout({ children, auth }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${jakarta.variable} ${oswald.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          {children}
          {auth}
          <Toaster richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
