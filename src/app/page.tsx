import { HsCodeAnalyzer } from "@/components/hs-code-analyzer";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow flex flex-col items-center justify-center p-4 sm:p-8 md:p-12">
        <HsCodeAnalyzer />
      </main>
      <footer className="w-full text-center p-4 text-muted-foreground text-sm">
        © {new Date().getFullYear()} Dibuat oleh{" "}
        <Link href="https://t.me/msyaifulbhr" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
          Syaiful Bahri
        </Link>
      </footer>
    </div>
  );
}
