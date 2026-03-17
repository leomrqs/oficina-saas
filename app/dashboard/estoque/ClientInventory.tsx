// app/dashboard/estoque/ClientInventory.tsx
"use client";

import { useState } from "react";
import { Search, Plus, Minus, ArrowUpRight, ArrowDownRight, Image as ImageIcon, Edit, FileEdit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createProduct, adjustStock, updateProduct } from "@/actions/inventory";
import { toast } from "sonner";

type Transaction = { id: string; type: "IN" | "OUT" | "EDIT"; quantity: number; reason: string | null; createdAt: Date };
type Product = { id: string; name: string; sku: string | null; category: string; costPrice: number; sellingPrice: number; stock: number; minStock: number; imageUrl: string | null; transactions: Transaction[] };

export function ClientInventory({ products }: { products: Product[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [openProductModal, setOpenProductModal] = useState(false);
  const [quickAdjust, setQuickAdjust] = useState<{ product: Product, type: "IN" | "OUT" } | null>(null);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  const [isCustomCategoryCreate, setIsCustomCategoryCreate] = useState(false);
  const [isCustomCategoryEdit, setIsCustomCategoryEdit] = useState(false);

  const defaultCategories = ["Escapamentos", "Abraçadeiras", "Ponteiras", "Catalisadores", "Consumíveis", "Acessórios", "Injeção"];
  const uniqueCategories = Array.from(new Set([...defaultCategories, ...products.map(p => p.category)])).sort();

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const handleCreateProduct = async (formData: FormData) => {
    try {
      await createProduct(formData);
      toast.success("Peça cadastrada com sucesso!");
      setOpenProductModal(false);
    } catch { toast.error("Erro ao cadastrar peça."); }
  };

  const handleAdjustStock = async (formData: FormData) => {
    try {
      await adjustStock(formData);
      toast.success(`Estoque atualizado com sucesso!`);
      setQuickAdjust(null);
    } catch { toast.error("Erro ao ajustar estoque."); }
  };

  const handleUpdateProduct = async (formData: FormData) => {
    try {
      await updateProduct(formData);
      toast.success("Dados da peça atualizados!");
      setEditProduct(null);
    } catch { toast.error("Erro ao atualizar peça."); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input placeholder="Buscar por nome, código (SKU) ou categoria..." className="pl-9 bg-white dark:bg-zinc-900 dark:border-zinc-800 shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>

        <Button className="shadow-sm bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200" onClick={() => setOpenProductModal(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nova Peça
        </Button>

        <Dialog open={openProductModal} onOpenChange={(open) => {
          setOpenProductModal(open);
          if (!open) setIsCustomCategoryCreate(false);
        }}>
          <DialogContent className="max-w-2xl dark:bg-zinc-950 dark:border-zinc-800">
            <DialogHeader><DialogTitle className="dark:text-zinc-100">Cadastrar Nova Peça no Estoque</DialogTitle></DialogHeader>
            <form action={handleCreateProduct} className="grid grid-cols-2 gap-4 mt-4">
              <div className="col-span-2 space-y-2">
                <label className="text-sm font-medium dark:text-zinc-300">Nome da Peça</label>
                <Input name="name" required placeholder="Ex: Silencioso Traseiro Gol G5" className="dark:bg-zinc-900 dark:border-zinc-800" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium dark:text-zinc-300">Código (SKU)</label>
                <Input name="sku" placeholder="Ex: SIL-VW-001" className="dark:bg-zinc-900 dark:border-zinc-800" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium dark:text-zinc-300">Categoria</label>
                  <button 
                    type="button" 
                    onClick={() => setIsCustomCategoryCreate(!isCustomCategoryCreate)} 
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 uppercase tracking-wider transition-colors"
                  >
                    {isCustomCategoryCreate ? "Selecionar Existente" : "+ Nova Categoria"}
                  </button>
                </div>
                {isCustomCategoryCreate ? (
                  <Input name="category" placeholder="Digite a nova categoria..." required autoFocus className="dark:bg-zinc-900 dark:border-zinc-800" />
                ) : (
                  <Select name="category" defaultValue="Escapamentos">
                    <SelectTrigger className="dark:bg-zinc-900 dark:border-zinc-800"><SelectValue /></SelectTrigger>
                    <SelectContent className="dark:bg-zinc-900 dark:border-zinc-800">
                      {uniqueCategories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium dark:text-zinc-300">Preço de Custo (R$)</label>
                <Input name="costPrice" type="number" step="0.01" required placeholder="0.00" className="dark:bg-zinc-900 dark:border-zinc-800" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium dark:text-zinc-300">Preço de Venda (R$)</label>
                <Input name="sellingPrice" type="number" step="0.01" required placeholder="0.00" className="dark:bg-zinc-900 dark:border-zinc-800" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium dark:text-zinc-300">Estoque Inicial</label>
                <Input name="initialStock" type="number" defaultValue="0" required className="dark:bg-zinc-900 dark:border-zinc-800" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium dark:text-zinc-300">Alerta de Estoque Mínimo</label>
                <Input name="minStock" type="number" defaultValue="3" required className="dark:bg-zinc-900 dark:border-zinc-800" />
              </div>
              <div className="col-span-2 space-y-2">
                <label className="text-sm font-medium dark:text-zinc-300">URL da Foto</label>
                <Input name="imageUrl" placeholder="https://exemplo.com/foto.jpg" className="dark:bg-zinc-900 dark:border-zinc-800" />
              </div>
              <Button type="submit" className="col-span-2 mt-4 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">Cadastrar Peça</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6 shadow-sm dark:bg-zinc-900">
          <TabsTrigger value="list" className="dark:data-[state=active]:bg-zinc-800">Inventário Atual</TabsTrigger>
          <TabsTrigger value="history" className="dark:data-[state=active]:bg-zinc-800">Auditoria / Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-lg shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-50/50 dark:bg-zinc-950/50 dark:border-zinc-800">
                <TableHead className="w-[70px] dark:text-zinc-400">Foto</TableHead>
                <TableHead className="dark:text-zinc-400">Peça & Código</TableHead>
                <TableHead className="w-[120px] dark:text-zinc-400">Preço Venda</TableHead>
                <TableHead className="w-[180px] dark:text-zinc-400">Custo e Margem (Passe o Mouse)</TableHead>
                <TableHead className="w-[180px] text-center dark:text-zinc-400">Estoque (Rápido)</TableHead>
                <TableHead className="text-right w-[100px] dark:text-zinc-400">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-12 text-zinc-500 dark:text-zinc-400">Nenhuma peça encontrada.</TableCell></TableRow>
              )}
              {filteredProducts.map((p) => {
                const profit = p.sellingPrice - p.costPrice;
                const margin = p.sellingPrice > 0 ? (profit / p.sellingPrice) * 100 : 0;
                const status = p.stock === 0 ? "OUT" : p.stock <= p.minStock ? "LOW" : "OK";

                return (
                  <TableRow key={p.id} className="group/row hover:bg-zinc-50 dark:hover:bg-zinc-800/50 dark:border-zinc-800">
                    <TableCell>
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded-md object-cover border dark:border-zinc-700" />
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border dark:border-zinc-700 text-zinc-400"><ImageIcon className="w-4 h-4"/></div>
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100 leading-none">{p.name}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">{p.sku || 'S/N'}</span>
                        <Badge variant="outline" className="text-[9px] h-4 uppercase tracking-wider dark:border-zinc-700 dark:text-zinc-300">{p.category}</Badge>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">{formatCurrency(p.sellingPrice)}</span>
                    </TableCell>

                    <TableCell>
                      <div className="group/privacy cursor-help select-none">
                        <div className="blur-md group-hover/privacy:blur-none transition-all duration-300 opacity-60 group-hover/privacy:opacity-100">
                          <p className="text-xs font-semibold text-red-600 dark:text-red-400">Custo: {formatCurrency(p.costPrice)}</p>
                          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">Lucro: {formatCurrency(profit)} ({margin.toFixed(0)}%)</p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center justify-center gap-3">
                        <Button variant="outline" size="icon" className="h-7 w-7 rounded-full text-zinc-500 dark:text-zinc-400 dark:border-zinc-700 hover:text-red-600 hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-950/50 dark:hover:text-red-400" onClick={() => setQuickAdjust({ product: p, type: 'OUT' })}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <div className="flex flex-col items-center justify-center w-12">
                          <span className={`text-lg font-bold leading-none ${status === 'OUT' ? 'text-red-600 dark:text-red-500' : status === 'LOW' ? 'text-yellow-600 dark:text-yellow-500' : 'text-zinc-900 dark:text-zinc-100'}`}>{p.stock}</span>
                          {status === "OUT" && <span className="text-[9px] font-bold text-red-600 dark:text-red-500 mt-1 uppercase">Falta</span>}
                          {status === "LOW" && <span className="text-[9px] font-bold text-yellow-600 dark:text-yellow-500 mt-1 uppercase">Baixo</span>}
                        </div>
                        <Button variant="outline" size="icon" className="h-7 w-7 rounded-full text-zinc-500 dark:text-zinc-400 dark:border-zinc-700 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-400" onClick={() => setQuickAdjust({ product: p, type: 'IN' })}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400" onClick={() => setEditProduct(p)}>
                        <Edit className="w-4 h-4 mr-2" /> Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="history" className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-lg shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-50/50 dark:bg-zinc-950/50 dark:border-zinc-800">
                <TableHead className="dark:text-zinc-400">Data e Hora</TableHead>
                <TableHead className="dark:text-zinc-400">Operação</TableHead>
                <TableHead className="dark:text-zinc-400">Peça Referência</TableHead>
                <TableHead className="dark:text-zinc-400">Movimentação</TableHead>
                <TableHead className="dark:text-zinc-400">Motivo / Log</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.flatMap(p => p.transactions.map(t => ({ ...t, productName: p.name })))
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((t) => (
                <TableRow key={t.id} className="dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <TableCell className="text-zinc-500 dark:text-zinc-400 text-sm">{new Date(t.createdAt).toLocaleDateString('pt-BR')} às {new Date(t.createdAt).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</TableCell>
                  <TableCell>
                    {t.type === "IN" && <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400 hover:bg-emerald-100"><ArrowUpRight className="w-3 h-3 mr-1"/> Entrada</Badge>}
                    {t.type === "OUT" && <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-400 hover:bg-orange-100"><ArrowDownRight className="w-3 h-3 mr-1"/> Saída / Baixa</Badge>}
                    {t.type === "EDIT" && <Badge variant="secondary" className="bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-zinc-200"><FileEdit className="w-3 h-3 mr-1"/> Edição</Badge>}
                  </TableCell>
                  <TableCell className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{t.productName}</TableCell>
                  <TableCell>
                    {t.type === "EDIT" ? <span className="text-zinc-400 font-mono text-sm">-</span> : <span className="font-bold font-mono text-sm dark:text-zinc-100">{t.type === "IN" ? '+' : '-'}{t.quantity} un</span>}
                  </TableCell>
                  <TableCell className="text-zinc-600 dark:text-zinc-400 text-sm">{t.reason || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>

      <Dialog open={!!quickAdjust} onOpenChange={(open) => !open && setQuickAdjust(null)}>
        <DialogContent className="sm:max-w-md dark:bg-zinc-950 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 dark:text-zinc-100">
              {quickAdjust?.type === "IN" ? <ArrowUpRight className="text-emerald-600 dark:text-emerald-500" /> : <ArrowDownRight className="text-orange-600 dark:text-orange-500" />}
              {quickAdjust?.type === "IN" ? "Dar Entrada no Estoque" : "Dar Baixa no Estoque"}
            </DialogTitle>
          </DialogHeader>
          <form action={handleAdjustStock} className="space-y-4 mt-2">
            <input type="hidden" name="productId" value={quickAdjust?.product.id} />
            <input type="hidden" name="type" value={quickAdjust?.type} />
            
            <div className="bg-zinc-50 dark:bg-zinc-900 p-3 rounded-md border dark:border-zinc-800 text-sm mb-4">
              <span className="text-zinc-500 dark:text-zinc-400">Peça selecionada:</span><br/>
              <span className="font-bold text-zinc-900 dark:text-zinc-100">{quickAdjust?.product.name}</span>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium dark:text-zinc-300">Quantidade para {quickAdjust?.type === "IN" ? "Adicionar" : "Remover"}</label>
              <Input name="quantity" type="number" min="1" required autoFocus className="dark:bg-zinc-900 dark:border-zinc-800" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium dark:text-zinc-300">Motivo (Obrigatório)</label>
              <Input name="reason" placeholder={quickAdjust?.type === "IN" ? "Ex: Compra NF 1234, Devolução..." : "Ex: Venda, Peça com defeito, Uso na oficina..."} required className="dark:bg-zinc-900 dark:border-zinc-800" />
            </div>
            <Button type="submit" className={`w-full ${quickAdjust?.type === "IN" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-orange-600 hover:bg-orange-700"} text-white`}>
              Confirmar Operação
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editProduct} onOpenChange={(open) => {
        if (!open) {
          setEditProduct(null);
          setIsCustomCategoryEdit(false);
        }
      }}>
        <DialogContent className="max-w-2xl dark:bg-zinc-950 dark:border-zinc-800">
          <DialogHeader><DialogTitle className="dark:text-zinc-100">Editar Dados da Peça</DialogTitle></DialogHeader>
          {editProduct && (
            <form action={handleUpdateProduct} className="grid grid-cols-2 gap-4 mt-4">
              <input type="hidden" name="id" value={editProduct.id} />
              
              <div className="col-span-2 space-y-2">
                <label className="text-sm font-medium dark:text-zinc-300">Nome da Peça</label>
                <Input name="name" defaultValue={editProduct.name} required className="dark:bg-zinc-900 dark:border-zinc-800" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium dark:text-zinc-300">Código (SKU)</label>
                <Input name="sku" defaultValue={editProduct.sku || ""} className="dark:bg-zinc-900 dark:border-zinc-800" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium dark:text-zinc-300">Categoria</label>
                  <button 
                    type="button" 
                    onClick={() => setIsCustomCategoryEdit(!isCustomCategoryEdit)} 
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 uppercase tracking-wider transition-colors"
                  >
                    {isCustomCategoryEdit ? "Selecionar Existente" : "+ Nova Categoria"}
                  </button>
                </div>
                {isCustomCategoryEdit ? (
                  <Input name="category" placeholder="Digite a nova categoria..." required autoFocus className="dark:bg-zinc-900 dark:border-zinc-800" />
                ) : (
                  <Select name="category" defaultValue={editProduct.category}>
                    <SelectTrigger className="dark:bg-zinc-900 dark:border-zinc-800"><SelectValue /></SelectTrigger>
                    <SelectContent className="dark:bg-zinc-900 dark:border-zinc-800">
                      {uniqueCategories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-red-600 dark:text-red-400">Preço de Custo (R$)</label>
                <Input name="costPrice" type="number" step="0.01" defaultValue={editProduct.costPrice} required className="dark:bg-zinc-900 dark:border-zinc-800" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Preço de Venda (R$)</label>
                <Input name="sellingPrice" type="number" step="0.01" defaultValue={editProduct.sellingPrice} required className="dark:bg-zinc-900 dark:border-zinc-800" />
              </div>
              <div className="col-span-2 space-y-2">
                <label className="text-sm font-medium dark:text-zinc-300">Alerta de Estoque Mínimo</label>
                <Input name="minStock" type="number" defaultValue={editProduct.minStock} required className="dark:bg-zinc-900 dark:border-zinc-800" />
              </div>
              <div className="col-span-2 space-y-2">
                <label className="text-sm font-medium dark:text-zinc-300">URL da Foto</label>
                <Input name="imageUrl" defaultValue={editProduct.imageUrl || ""} className="dark:bg-zinc-900 dark:border-zinc-800" />
              </div>
              <Button type="submit" className="col-span-2 mt-4 bg-blue-600 hover:bg-blue-700 text-white">Salvar Alterações</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}