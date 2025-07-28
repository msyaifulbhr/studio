"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Wand2 } from "lucide-react";

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
import { useToast } from "@/hooks/use-toast";
import { classifyProduct, type ClassifyProductOutput } from "@/ai/flows/classify-product";

const formSchema = z.object({
  productName: z.string().min(2, {
    message: "Product name must be at least 2 characters.",
  }),
});

export function HsCodeAnalyzer() {
  const [result, setResult] = useState<ClassifyProductOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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
    try {
      const classificationResult = await classifyProduct(values);
      setResult(classificationResult);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to classify the product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl shadow-2xl rounded-2xl">
      <CardHeader>
        <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
                <Wand2 className="h-6 w-6 text-primary"/>
            </div>
            <div className="flex flex-col">
                <CardTitle className="text-2xl font-headline">HS Code Analyzer</CardTitle>
                <CardDescription className="mt-1">
                  Enter a product name to classify it using AI.
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
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., live cattle, portable computer, or thermometer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-base py-6 rounded-lg">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Analyze"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      {isLoading && !result && (
         <CardFooter>
            <div className="w-full flex flex-col items-center justify-center text-center p-8 space-y-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                <p className="text-muted-foreground">AI is thinking...</p>
            </div>
         </CardFooter>
      )}
      {result && (
        <>
          <Separator className="my-0"/>
          <CardFooter className="flex flex-col items-start gap-4 pt-6">
              <h3 className="text-xl font-semibold font-headline">Classification Result</h3>
              <div className="w-full space-y-4 rounded-lg border bg-muted/20 p-4">
                  <div>
                      <h4 className="font-semibold text-primary">Analysis</h4>
                      <p className="text-muted-foreground mt-1">{result.analysisText}</p>
                  </div>
                  <Separator/>
                   <div className="flex justify-between items-center">
                      <h4 className="font-semibold text-primary">HS Code</h4>
                      <p className="font-mono text-lg text-primary bg-primary/10 px-3 py-1 rounded-md">{result.hsCode}</p>
                  </div>
                  <Separator/>
                   <div>
                      <h4 className="font-semibold text-primary">Category Description</h4>
                      <p className="text-muted-foreground mt-1">{result.categoryDescription}</p>
                  </div>
              </div>
          </CardFooter>
        </>
      )}
    </Card>
  );
}
