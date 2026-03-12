// app/dashboard/estoque/ClientInventory.tsx
"use client";

import { useState } from "react";
import { Search, Plus, Package, ArrowUpRight, ArrowDownRight, AlertTriangle, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createProduct, adjustStock } from "@/actions/inventory";
import { toast } from "sonner";

// Tipagens
type Transaction = { id: string; type: "IN" | "OUT"; quantity: number; reason: string | null; createdAt: Date };
type Product = { id: string; name: string; sku: string | null; category: string; costPrice: number; sellingPrice: number; stock: number; minStock: number; imageUrl: string | null; transactions: Transaction[] };

export function ClientInventory({ products }: { products: Product[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [openProductModal, setOpenProductModal] = useState(false);
  const [openAdjustModal, setOpenAdjustModal] = useState<string | null>(null);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const handleCreateProduct = async (formData: FormData) => {
    try {
      await createProduct(formData);
      toast.success("Peça cadastrada com sucesso!");
      setOpenProductModal(false);
    } catch (error) {
      toast.error("Erro ao cadastrar peça.");
    }
  };

  const handleAdjustStock = async (formData: FormData) => {
    try {
      await adjustStock(formData);
      toast.success("Estoque ajustado com sucesso!");
      setOpenAdjustModal(null);
    } catch (error) {
      toast.error("Erro ao ajustar estoque.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input placeholder="Buscar por nome ou código (SKU)..." className="pl-9 bg-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>

        <Dialog open={openProductModal} onOpenChange={setOpenProductModal}>
          <DialogTrigger asChild>
            <Button className="shadow-sm"><Plus className="mr-2 h-4 w-4" /> Nova Peça</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Cadastrar Nova Peça no Estoque</DialogTitle></DialogHeader>
            <form action={handleCreateProduct} className="grid grid-cols-2 gap-4 mt-4">
              <div className="col-span-2 space-y-2">
                <label className="text-sm font-medium">Nome da Peça</label>
                <Input name="name" required placeholder="Ex: Silencioso Traseiro Gol G5" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Código (SKU)</label>
                <Input name="sku" placeholder="Ex: SIL-VW-001" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Categoria</label>
                <Select name="category" defaultValue="Escapamentos">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Escapamentos">Escapamentos</SelectItem>
                    <SelectItem value="Abraçadeiras">Abraçadeiras</SelectItem>
                    <SelectItem value="Ponteiras">Ponteiras</SelectItem>
                    <SelectItem value="Catalisadores">Catalisadores</SelectItem>
                    <SelectItem value="Consumíveis">Consumíveis (Solda, etc)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Preço de Custo (R$)</label>
                <Input name="costPrice" type="number" step="0.01" required placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Preço de Venda (R$)</label>
                <Input name="sellingPrice" type="number" step="0.01" required placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Estoque Inicial</label>
                <Input name="initialStock" type="number" defaultValue="0" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Alerta de Estoque Mínimo</label>
                <Input name="minStock" type="number" defaultValue="3" required />
              </div>
              <div className="col-span-2 space-y-2">
                <label className="text-sm font-medium">URL da Foto (Cole o link da imagem)</label>
                <Input name="imageUrl" placeholder="https://exemplo.com/foto.jpg" />
                <p className="text-xs text-zinc-500">Integração nativa de upload será ativada após a apresentação.</p>
              </div>
              <Button type="submit" className="col-span-2 mt-4">Cadastrar Peça</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="list">Inventário Atual</TabsTrigger>
          <TabsTrigger value="history">Histórico (Auditoria)</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="bg-white border rounded-lg shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-50/50">
                <TableHead className="w-[80px]">Foto</TableHead>
                <TableHead>Peça & Categoria</TableHead>
                <TableHead>Preços (Margem)</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-zinc-500">Nenhuma peça cadastrada.</TableCell></TableRow>
              )}
              {filteredProducts.map((p) => {
                const margin = p.sellingPrice > 0 ? ((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100 : 0;
                const status = p.stock === 0 ? "OUT" : p.stock <= p.minStock ? "LOW" : "OK";

                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className="w-12 h-12 rounded-md object-cover border" />
                      ) : (
                        <div className="w-12 h-12 rounded-md bg-zinc-100 flex items-center justify-center border text-zinc-400"><ImageIcon className="w-5 h-5"/></div>
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-zinc-900">{p.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-zinc-500 font-mono">{p.sku || 'S/N'}</span>
                        <Badge variant="outline" className="text-[10px] h-4">{p.category}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-zinc-900">{formatCurrency(p.sellingPrice)}</p>
                      <p className="text-xs text-green-600 mt-1">{margin.toFixed(0)}% de margem</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">{p.stock}</span>
                        {status === "OUT" && <Badge variant="destructive" className="text-[10px]">Sem Estoque</Badge>}
                        {status === "LOW" && <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-[10px]">Baixo ({p.minStock})</Badge>}
                        {status === "OK" && <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-[10px]">Regular</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog open={openAdjustModal === p.id} onOpenChange={(val) => setOpenAdjustModal(val ? p.id : null)}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">Ajustar</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Ajustar Estoque: {p.name}</DialogTitle></DialogHeader>
                          <form action={handleAdjustStock} className="space-y-4 mt-4">
                            <input type="hidden" name="productId" value={p.id} />
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Tipo de Movimento</label>
                                <Select name="type" required>
                                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="IN">Entrada (+)</SelectItem>
                                    <SelectItem value="OUT">Saída/Baixa (-)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Quantidade</label>
                                <Input name="quantity" type="number" min="1" required />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Motivo / Observação</label>
                              <Input name="reason" placeholder="Ex: Compra NF 1234, Peça danificada..." required />
                            </div>
                            <Button type="submit" className="w-full">Salvar Movimentação</Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TabsContent>

        {/* ABA DE HISTÓRICO */}
        <TabsContent value="history" className="bg-white border rounded-lg shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-50/50">
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Peça</TableHead>
                <TableHead>Qtd</TableHead>
                <TableHead>Motivo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.flatMap(p => p.transactions.map(t => ({ ...t, productName: p.name })))
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="text-zinc-500 text-sm">{new Date(t.createdAt).toLocaleDateString('pt-BR')} às {new Date(t.createdAt).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</TableCell>
                  <TableCell>
                    {t.type === "IN" 
                      ? <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100"><ArrowUpRight className="w-3 h-3 mr-1"/> Entrada</Badge>
                      : <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100"><ArrowDownRight className="w-3 h-3 mr-1"/> Saída</Badge>
                    }
                  </TableCell>
                  <TableCell className="font-medium">{t.productName}</TableCell>
                  <TableCell className="font-bold">{t.quantity}</TableCell>
                  <TableCell className="text-zinc-500">{t.reason || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  );
}