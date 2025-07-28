
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Wand2, ThumbsUp, ThumbsDown, BookCopy } from "lucide-react";

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
import { saveCorrection } from "@/ai/flows/save-correction";
import hsCodesData from "@/data/hs-codes.json";
import { HsCodeViewer } from "./hs-code-viewer";


const formSchema = z.object({
  productName: z.string().min(2, {
    message: "Nama barang harus minimal 2 karakter.",
  }),
});

interface ResultWithOriginal extends ClassifyProductOutput {
    originalProductName: string;
    feedbackGiven?: boolean;
}

export function HsCodeAnalyzer() {
  const [results, setResults] = useState<ResultWithOriginal[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [correctHsCode, setCorrectHsCode] = useState('');
  const [currentItemForFeedback, setCurrentItemForFeedback] = useState<ResultWithOriginal | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

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

    } catch (error) {
      console.error(error);
      toast({
        title: "Kesalahan",
        description: "Gagal mengklasifikasikan satu atau lebih produk. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleApprove = async (item: ResultWithOriginal) => {
    try {
      await saveCorrection({
        productName: item.originalProductName,
        correctHsCode: item.hsCodeAndDescription.split(' - ')[0],
      });
      toast({
        title: "Terima Kasih!",
        description: `Umpan balik untuk "${item.originalProductName}" telah disimpan.`,
      });
    } catch (error) {
      console.error("Failed to save correction:", error);
      toast({
        title: "Kesalahan",
        description: "Gagal menyimpan umpan balik. Silakan coba lagi.",
        variant: "destructive",
      });
    }
    
    setResults(prev => 
        prev!.map(r => r.originalProductName === item.originalProductName ? { ...r, feedbackGiven: true } : r)
    );
  };
  
  const handleDisapprove = (item: ResultWithOriginal) => {
    setCurrentItemForFeedback(item);
    setShowFeedbackDialog(true);
  }

  const handleFeedbackSubmit = async () => {
    if (!currentItemForFeedback) return;

    try {
        await saveCorrection({
            productName: currentItemForFeedback.originalProductName,
            correctHsCode: correctHsCode
        });

        const correctedCodeEntry = hsCodesData.find(item => item.code === correctHsCode);
        const correctedDescription = correctedCodeEntry ? correctedCodeEntry.description : 'Deskripsi tidak ditemukan';
        
        setResults(prev => 
            prev!.map(r => {
                if (r.originalProductName === currentItemForFeedback.originalProductName) {
                    return {
                        ...r,
                        hsCodeAndDescription: `${correctHsCode} - ${correctedDescription}`,
                        feedbackGiven: true,
                    };
                }
                return r;
            })
        );

        toast({
            title: "Terima Kasih Atas Koreksinya!",
            description: `Kami telah mencatat bahwa kode yang benar untuk "${currentItemForFeedback.originalProductName}" adalah ${correctHsCode}.`,
        });
        
        setShowFeedbackDialog(false);
        setCorrectHsCode('');
        setCurrentItemForFeedback(null);

    } catch (error) {
        console.error("Failed to save correction:", error);
        toast({
          title: "Kesalahan",
          description: "Gagal menyimpan koreksi Anda. Silakan coba lagi.",
          variant: "destructive",
        });
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-8">
        <HsCodeViewer open={isViewerOpen} onOpenChange={setIsViewerOpen} />
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

        {isLoading && (
            <div className="flex flex-col items-center justify-center text-center p-8 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary"/>
            <p className="text-lg font-medium">AI sedang menganalisis beberapa barang...</p>
            <p className="text-muted-foreground">Mohon tunggu sebentar.</p>
            </div>
        )}

        {results && !isLoading && (
            <div className="space-y-4">
                {results.map((item, index) => (
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
                        <CardFooter>
                            {!item.feedbackGiven ? (
                            <div className="w-full flex flex-col sm:flex-row justify-center items-center gap-4 py-4 border-t">
                                <span className="text-sm font-medium text-muted-foreground">Apakah hasil ini sesuai?</span>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="lg" onClick={() => handleApprove(item)} className="gap-2">
                                        <ThumbsUp className="h-5 w-5 text-green-500"/>
                                        <span>Setuju</span>
                                    </Button>
                                    <Button variant="outline" size="lg" onClick={() => handleDisapprove(item)} className="gap-2">
                                        <ThumbsDown className="h-5 w-5 text-red-500"/>
                                        <span>Tidak Setuju</span>
                                    </Button>
                                </div>
                            </div>
                            ) : (
                                <div className="w-full text-center text-green-600 font-medium py-4 border-t">
                                    <p>Terima kasih atas masukan Anda!</p>
                                </div>
                            )}
                        </CardFooter>
                    </Card>
                ))}
            </div>
        )}
        
        <AlertDialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Bantu kami belajar</AlertDialogTitle>
                <AlertDialogDescription>
                Hasil untuk <span className="font-semibold">{currentItemForFeedback?.originalProductName}</span> tidak sesuai. Mohon masukkan Kode HS yang benar.
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

    

    