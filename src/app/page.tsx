import { HsCodeAnalyzer } from "@/components/hs-code-analyzer";
import { Send } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow flex flex-col items-center justify-center p-4 sm:p-8 md:p-12">
        <HsCodeAnalyzer />
      </main>
      <footer className="w-full text-center p-4">
        <Link 
          href="https://t.me/msyaifulbhr" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
        >
          <Send className="h-4 w-4" />
          <span>Dibuat oleh Syaiful Bahri</span>
        </Link>
      </footer>
    </div>
  );
}
