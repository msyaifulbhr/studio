
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Wand2, BookCopy, LayoutGrid, List, AlertTriangle, ThumbsUp, ThumbsDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { classifyProduct, type ClassifyProductOutput } from "@/ai/flows/classify-product";
import { saveCorrection } from "@/ai/flows/save-correction";
import { HsCodeViewer } from "./hs-code-viewer";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";


const formSchema = z.object({
  productName: z.string().min(2, {
    message: "Nama barang harus minimal 2 karakter.",
  }),
});

interface ResultWithOriginal extends ClassifyProductOutput {
    originalProductName: string;
}

export function HsCodeAnalyzer() {
  const [results, setResults] = useState<ResultWithOriginal[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [showApiKeyWarning, setShowApiKeyWarning] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [rateLimitCooldown, setRateLimitCooldown] = useState(0);

  useEffect(() => {
    setIsClient(true);
    const keyIsSet = process.env.NEXT_PUBLIC_API_KEY_CONFIGURED === 'true';
    if (!keyIsSet) {
       setShowApiKeyWarning(true);
    }
  }, []);

  useEffect(() => {
    if (rateLimitCooldown > 0) {
      const timer = setTimeout(() => {
        setRateLimitCooldown(rateLimitCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [rateLimitCooldown]);


  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productName: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResults(null);
    
    const productNames = values.productName.split(';').map(name => name.trim()).filter(name => name.length > 1);

    if (productNames.length === 0) {
        setIsLoading(false);
        toast({
            title: "Input tidak valid",
            description: "Silakan masukkan setidaknya satu nama barang yang valid.",
            variant: "destructive",
        });
        return;
    }

    try {
      const classificationPromises = productNames.map(name => 
        classifyProduct({ productName: name }).then(result => ({
            ...result,
            originalProductName: name,
        }))
      );

      const classificationResults = await Promise.all(classificationPromises);
      setResults(classificationResults);

    } catch (error: any) {
        console.error(error);
        if (error.message && (error.message.includes("429 Too Many Requests") || error.message.includes("You exceeded your current quota"))) {
            toast({
                title: "Batas Penggunaan Tercapai",
                description: "Anda telah melebihi kuota permintaan API. Silakan coba lagi sebentar.",
                variant: "destructive",
            });
            setRateLimitCooldown(60); 
        } else {
            toast({
                title: "Kesalahan",
                description: "Gagal mengklasifikasikan satu atau lebih produk. Silakan coba lagi.",
                variant: "destructive",
            });
        }
    } finally {
      setIsLoading(false);
    }
  }

  const handleFeedback = async (productName: string, correctHsCode: string, feedback: 'agree' | 'disagree') => {
    try {
      await saveCorrection({ productName, correctHsCode, feedback });
      toast({
        title: "Umpan Balik Terkirim",
        description: "Terima kasih atas masukan Anda!",
      });
    } catch (error) {
      console.error("Failed to save correction:", error);
      toast({
        title: "Gagal Menyimpan Umpan Balik",
        description: "Terjadi kesalahan saat menyimpan masukan Anda. Silakan coba lagi.",
        variant: "destructive",
      });
    }
  };


  const isButtonDisabled = isLoading || rateLimitCooldown > 0;

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-8">
        <HsCodeViewer open={isViewerOpen} onOpenChange={setIsViewerOpen} />
        
        {isClient && showApiKeyWarning && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>API Key Belum Dikonfigurasi</AlertTitle>
            <AlertDescription>
              Aplikasi ini tampaknya menggunakan kuota gratis. Untuk menghindari batasan, harap atur `GEMINI_API_KEY` Anda di file `.env`. Lihat `README.md` untuk detailnya.
            </AlertDescription>
          </Alert>
        )}

        <Card className="shadow-lg rounded-2xl">
            <CardHeader>
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg">
                            <Wand2 className="h-8 w-8 text-primary"/>
                        </div>
                        <div>
                            <CardTitle className="text-3xl font-headline">Cari Kode HS</CardTitle>
                            <CardDescription className="mt-1">Masukkan satu atau lebih nama barang (pisahkan dengan titik koma) untuk diklasifikasikan</CardDescription>
                        </div>
                    </div>
                     <Button variant="outline" onClick={() => setIsViewerOpen(true)}>
                        <BookCopy className="mr-2 h-4 w-4" />
                        Lihat Daftar Kode
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                    control={form.control}
                    name="productName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="text-base">Nama Barang</FormLabel>
                        <FormControl>
                            <Input className="py-6 text-base" placeholder="misalnya, sapi hidup; komputer" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <div className="flex flex-col items-center">
                        {rateLimitCooldown > 0 && (
                            <div className="text-destructive text-sm mb-2">
                                Batas penggunaan tercapai. Coba lagi dalam {rateLimitCooldown} detik.
                            </div>
                        )}
                        <Button type="submit" disabled={isButtonDisabled} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-base py-6 rounded-lg">
                        {isLoading ? (
                            <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Menganalisis...
                            </>
                        ) : (
                            "Cari Kode"
                        )}
                        </Button>
                    </div>
                </form>
            </Form>
            </CardContent>
        </Card>

        {isLoading && (
            <div className="flex flex-col items-center justify-center text-center p-8 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary"/>
            <p className="text-lg font-medium">AI sedang menganalisis beberapa barang...</p>
            <p className="text-muted-foreground">Mohon tunggu sebentar.</p>
            </div>
        )}

        {results && !isLoading && results.length > 0 && (
          <div className="space-y-4 mt-4">
              {results.map((item, index) => {
                  const hsCode = item.hsCodeAndDescription.split(' - ')[0];
                  return (
                      <Card key={index} className="shadow-lg rounded-2xl animate-in fade-in-50">
                          <CardHeader>
                              <CardTitle className="text-xl font-headline">
                                  Hasil Klasifikasi untuk: <span className="font-bold text-primary">{item.originalProductName}</span>
                              </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-6">
                              <div>
                                  <h4 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">Analisis AI</h4>
                                  <p className="text-foreground/80 mt-2">{item.analysisText}</p>
                              </div>
                              <Separator/>
                              <div>
                                  <h4 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">Rekomendasi Kategori</h4>
                                  <p className="text-lg font-bold text-foreground/80 mt-2">{item.hsCodeAndDescription}</p>
                              </div>
                          </CardContent>
                          <CardFooter className="flex justify-end gap-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="outline" size="icon" onClick={() => handleFeedback(item.originalProductName, hsCode, 'agree')}>
                                        <ThumbsUp className="h-4 w-4 text-green-500"/>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Setuju dengan hasil ini</p>
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                     <Button variant="outline" size="icon" onClick={() => handleFeedback(item.originalProductName, hsCode, 'disagree')}>
                                        <ThumbsDown className="h-4 w-4 text-red-500"/>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Tidak setuju dengan hasil ini</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                          </CardFooter>
                      </Card>
                  )
              })}
          </div>
        )}
    </div>
  );
}
