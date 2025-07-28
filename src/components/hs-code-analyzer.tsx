
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Wand2, ThumbsUp, ThumbsDown, Search } from "lucide-react";

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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { classifyProduct, type ClassifyProductOutput } from "@/ai/flows/classify-product";

const formSchema = z.object({
  productName: z.string().min(2, {
    message: "Nama barang harus minimal 2 karakter.",
  }),
});

export function HsCodeAnalyzer() {
  const [result, setResult] = useState<ClassifyProductOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [correctHsCode, setCorrectHsCode] = useState('');
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productName: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    setFeedbackGiven(false);
    try {
      const classificationResult = await classifyProduct(values);
      setResult(classificationResult);
    } catch (error) {
      console.error(error);
      toast({
        title: "Kesalahan",
        description: "Gagal mengklasifikasikan produk. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleApprove = () => {
    console.log("Feedback: Approved", { productName: form.getValues("productName"), hsCode: result?.hsCodeAndDescription });
    toast({
      title: "Terima Kasih!",
      description: "Umpan balik Anda membantu kami menjadi lebih baik.",
    });
    setFeedbackGiven(true);
  };
  
  const handleDisapprove = () => {
    setShowFeedbackDialog(true);
  }

  const handleFeedbackSubmit = () => {
    console.log("Feedback: Disapproved", { productName: form.getValues("productName"), wrongHsCode: result?.hsCodeAndDescription, correctHsCode });
    toast({
        title: "Terima Kasih Atas Koreksinya!",
        description: `Kami telah mencatat bahwa kode yang benar adalah ${correctHsCode}.`,
    });
    setFeedbackGiven(true);
    setShowFeedbackDialog(false);
    setCorrectHsCode('');
  };

  const renderResultContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary"/>
          <p className="text-lg font-medium">AI sedang berpikir...</p>
          <p className="text-muted-foreground">Mohon tunggu sebentar selagi kami menganalisis produk Anda.</p>
        </div>
      );
    }

    if (result) {
      return (
        <Card className="h-full shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle className="text-xl font-headline">Hasil Klasifikasi</CardTitle>
            <CardDescription>Berikut adalah rekomendasi kategori untuk "{form.getValues("productName")}".</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
                <h4 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">Analisis AI</h4>
                <p className="text-foreground/80 mt-2">{result.analysisText}</p>
            </div>
            <Separator/>
             <div>
                <h4 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">Rekomendasi Kategori</h4>
                <p className="text-lg font-bold text-foreground mt-2">{result.hsCodeAndDescription}</p>
            </div>
          </CardContent>
          <CardFooter>
            {!feedbackGiven && (
              <div className="w-full flex flex-col sm:flex-row justify-center items-center gap-4 py-4 border-t">
                  <span className="text-sm font-medium text-muted-foreground">Apakah hasil ini sesuai?</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="lg" onClick={handleApprove} className="gap-2">
                        <ThumbsUp className="h-5 w-5 text-green-500"/>
                        <span>Setuju</span>
                    </Button>
                    <Button variant="outline" size="lg" onClick={handleDisapprove} className="gap-2">
                        <ThumbsDown className="h-5 w-5 text-red-500"/>
                        <span>Tidak Setuju</span>
                    </Button>
                  </div>
              </div>
            )}
            {feedbackGiven && (
                <div className="w-full text-center text-green-600 font-medium py-4 border-t">
                    <p>Terima kasih atas masukan Anda!</p>
                </div>
            )}
          </CardFooter>
        </Card>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
        <div className="p-4 bg-primary/10 rounded-full">
            <Search className="h-10 w-10 text-primary" />
        </div>
        <p className="text-lg font-medium">Menunggu Pencarian</p>
        <p className="text-muted-foreground max-w-xs">Masukkan nama barang atau jasa di sebelah kiri untuk memulai proses klasifikasi Kode HS.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 p-4">
        {/* Kolom Kiri: Input */}
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                    <Wand2 className="h-8 w-8 text-primary"/>
                </div>
                <div>
                    <h1 className="text-3xl font-bold font-headline">Cari Kode HS</h1>
                    <p className="text-muted-foreground mt-1">Masukkan nama barang untuk mengklasifikasikannya</p>
                </div>
            </div>
            <Card className="shadow-lg rounded-2xl">
                <CardContent className="pt-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                        control={form.control}
                        name="productName"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="text-base">Nama Barang atau Jasa</FormLabel>
                            <FormControl>
                                <Input className="py-6 text-base" placeholder="misalnya, sapi hidup, komputer, atau jasa konsultasi" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <Button type="submit" disabled={isLoading} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-base py-6 rounded-lg">
                        {isLoading ? (
                            <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Menganalisis...
                            </>
                        ) : (
                            "Cari Kode"
                        )}
                        </Button>
                    </form>
                </Form>
                </CardContent>
            </Card>
        </div>

        {/* Kolom Kanan: Hasil */}
        <aside className="bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl border-2 border-dashed">
            {renderResultContent()}
        </aside>

        {/* Dialog untuk umpan balik 'Tidak Setuju' */}
       <AlertDialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bantu kami belajar</AlertDialogTitle>
            <AlertDialogDescription>
              Jika hasil klasifikasi tidak sesuai, mohon masukkan Kode HS yang benar. Ini akan sangat membantu kami meningkatkan akurasi AI.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input 
              placeholder="Masukkan Kode HS yang benar (contoh: 010200)"
              value={correctHsCode}
              onChange={(e) => setCorrectHsCode(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCorrectHsCode('')}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleFeedbackSubmit} disabled={!correctHsCode || correctHsCode.length < 6}>Kirim</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
