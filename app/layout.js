import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/ThemeProvider";
import { LangProvider } from "@/components/context/LangProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Bug Interpreter",
  description: "Well Come to Bug Interpreter, just paste you error, console image, and get your perfect result",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <LangProvider>
            {children}
          </LangProvider>
        </Providers>

      </body>
    </html>
  );
}

