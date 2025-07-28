
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Wand2, ThumbsUp, ThumbsDown } from "lucide-react";

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
  AlertDialogTrigger,
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
    // Logic to save the positive feedback can be added here in the future
    console.log("Feedback: Approved", { productName: form.getValues("productName"), hsCode: result?.hsCodeAndDescription });
    toast({
      title: "Terima Kasih!",
      description: "Umpan balik Anda membantu kami.",
    });
    setFeedbackGiven(true);
  };
  
  const handleDisapprove = () => {
    setShowFeedbackDialog(true);
  }

  const handleFeedbackSubmit = () => {
    // Logic to save the corrective feedback can be added here
    console.log("Feedback: Disapproved", { productName: form.getValues("productName"), wrongHsCode: result?.hsCodeAndDescription, correctHsCode });
    toast({
        title: "Terima Kasih Atas Koreksinya!",
        description: `Kami telah mencatat bahwa kode yang benar adalah ${correctHsCode}.`,
    });
    setFeedbackGiven(true);
    setShowFeedbackDialog(false);
  };


  return (
    <Card className="w-full max-w-2xl shadow-2xl rounded-2xl">
      <CardHeader>
        <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
                <Wand2 className="h-6 w-6 text-primary"/>
            </div>
            <div className="flex flex-col">
                <CardTitle className="text-2xl font-headline">Cari Kode HS</CardTitle>
                <CardDescription className="mt-1">
                  Masukkan nama barang untuk mengklasifikasikannya
                </CardDescription>
            </div>
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
                  <FormLabel>Nama Barang</FormLabel>
                  <FormControl>
                    <Input placeholder="misalnya, sapi hidup, komputer portabel, atau termometer" {...field} />
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
      {isLoading && !result && (
         <CardFooter>
            <div className="w-full flex flex-col items-center justify-center text-center p-8 space-y-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                <p className="text-muted-foreground">AI sedang berpikir...</p>
            </div>
         </CardFooter>
      )}
      {result && (
        <>
          <Separator className="my-0"/>
          <CardFooter className="flex flex-col items-start gap-4 pt-6">
              <h3 className="text-xl font-semibold font-headline">Hasil Klasifikasi</h3>
              <div className="w-full space-y-4 rounded-lg p-4">
                  <div>
                      <h4 className="font-semibold text-primary">Analisis</h4>
                      <p className="text-muted-foreground mt-1">{result.analysisText}</p>
                  </div>
                  <Separator/>
                   <div>
                      <h4 className="font-semibold text-primary">Kategori Cocok</h4>
                      <p className="font-bold text-muted-foreground mt-1">{result.hsCodeAndDescription}</p>
                  </div>
              </div>
              {!feedbackGiven && (
                <div className="w-full flex justify-end items-center gap-4 px-4">
                    <span className="text-sm text-muted-foreground">Apakah hasil ini sesuai?</span>
                    <Button variant="ghost" size="icon" onClick={handleApprove}>
                        <ThumbsUp className="h-5 w-5 text-green-500"/>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleDisapprove}>
                        <ThumbsDown className="h-5 w-5 text-red-500"/>
                    </Button>
                </div>
              )}
          </CardFooter>
        </>
      )}
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
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleFeedbackSubmit} disabled={!correctHsCode}>Kirim</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
