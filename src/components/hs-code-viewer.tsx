
"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import hsCodesData from "@/data/hs-codes.json";

type HsCode = {
  code: string;
  description: string;
};

interface HsCodeViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HsCodeViewer({ open, onOpenChange }: HsCodeViewerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = useMemo(() => {
    return hsCodesData.filter(
      (item) =>
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, itemsPerPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1); // Reset to first page
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Daftar Kode HS</DialogTitle>
          <DialogDescription>
            Cari atau jelajahi daftar lengkap Kode HS yang tersedia.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            placeholder="Cari berdasarkan kode atau deskripsi..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
          />
        </div>
        <div className="flex-grow relative">
            <ScrollArea className="absolute inset-0">
                <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                        <TableHead className="w-[150px]">Kode HS</TableHead>
                        <TableHead>Deskripsi</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {paginatedData.map((item) => (
                        <TableRow key={item.code}>
                        <TableCell className="font-medium">{item.code}</TableCell>
                        <TableCell>{item.description}</TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
            </ScrollArea>
        </div>
        <DialogFooter className="pt-4 sm:justify-between border-t mt-auto">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Item per halaman:</span>
            <Select value={String(itemsPerPage)} onValueChange={handleItemsPerPageChange}>
                <SelectTrigger className="w-[80px]">
                    <SelectValue placeholder={itemsPerPage} />
                </SelectTrigger>
                <SelectContent>
                    {[10, 25, 50, 100].map(val => (
                         <SelectItem key={val} value={String(val)}>{val}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Sebelumnya
            </Button>
            <span className="text-sm text-muted-foreground">
              Halaman {currentPage} dari {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Berikutnya
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    