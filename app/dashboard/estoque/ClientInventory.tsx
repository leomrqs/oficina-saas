// app/dashboard/estoque/ClientInventory.tsx
"use client";

import { useState, useMemo } from "react";
import { Search, Plus, Minus, ArrowUpRight, ArrowDownRight, Image as ImageIcon, Edit, FileEdit, Package, AlertTriangle, Wrench, Activity, DollarSign, ChevronLeft, ChevronRight, Hash, TrendingUp, Boxes, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createProduct, adjustStock, updateProduct } from "@/actions/inventory";
import { toast } from "sonner";

export function ClientInventory({ products, transactions }: { products: any[], transactions: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [itemTypeToCreate, setItemTypeToCreate] = useState<"PRODUCT" | "SERVICE">("PRODUCT");
  const [editItem, setEditItem] = useState<any | null>(null);
  const [quickAdjust, setQuickAdjust] = useState<{ product: any, type: "IN" | "OUT" } | null>(null);
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const [isCustomCategoryCreate, setIsCustomCategoryCreate] = useState(false);
  const [isCustomCategoryEdit, setIsCustomCategoryEdit] = useState(false);

  const defaultCategories = ["Escapamentos", "Abraçadeiras", "Ponteiras", "Catalisadores", "Consumíveis", "Acessórios", "Injeção", "Mão de Obra", "Revisão"];
  const uniqueCategories = Array.from(new Set([...defaultCategories, ...products.map(p => p.category)])).sort();

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // SEPARAÇÃO INTELIGENTE DOS DADOS
  const physicalProducts = useMemo(() => products.filter(p => !p.isService), [products]);
  const serviceProducts = useMemo(() => products.filter(p => p.isService), [products]);

  // CÁLCULOS AVANÇADOS DO DASHBOARD
  const totalCapital = physicalProducts.reduce((acc, p) => acc + (p.costPrice * p.stock), 0);
  const totalPotentialSales = physicalProducts.reduce((acc, p) => acc + (p.sellingPrice * p.stock), 0);
  const potentialProfit = totalPotentialSales - totalCapital;
  
  const totalUnitsInStock = physicalProducts.reduce((acc, p) => acc + p.stock, 0);
  const criticalItems = physicalProducts.filter(p => p.stock <= p.minStock);
  const recentTransactions = transactions.slice(0, 5); // Pega as últimas 5 movimentações

  // FILTROS GLOBAIS DE BUSCA
  const filteredProducts = physicalProducts.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredServices = serviceProducts.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTransactions = transactions.filter(t => 
    t.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.order?.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ACTIONS GLOBAIS
  const handleCreate = async (formData: FormData) => {
    try {
      formData.append("isService", itemTypeToCreate === "SERVICE" ? "true" : "false");
      await createProduct(formData);
      toast.success(`${itemTypeToCreate === "SERVICE" ? "Serviço" : "Peça"} cadastrado com sucesso!`);
      setOpenModal(false);
    } catch { toast.error("Erro ao cadastrar."); }
  };

  const handleAdjust = async (formData: FormData) => {
    try {
      await adjustStock(formData);
      toast.success(`Estoque atualizado com sucesso!`);
      setQuickAdjust(null);
    } catch { toast.error("Erro ao ajustar estoque."); }
  };

  const handleUpdate = async (formData: FormData) => {
    try {
      await updateProduct(formData);
      toast.success("Dados atualizados com sucesso!");
      setEditItem(null);
    } catch { toast.error("Erro ao atualizar."); }
  };

  return (
    <div className="space-y-6">
      
      {/* BARRA DE CONTROLE SUPERIOR */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white dark:bg-zinc-900 p-4 rounded-xl border dark:border-zinc-800 shadow-sm">
        <div className="relative w-full xl:max-w-md">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
          <Input placeholder="Buscar peça, serviço, código ou OS..." className="pl-10 h-12 w-full bg-zinc-50 dark:bg-zinc-950 dark:border-zinc-800 text-base" value={searchTerm} onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}} />
        </div>
        <Button className="w-full xl:w-auto h-12 shadow-sm bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-base font-bold" onClick={() => { setItemTypeToCreate("PRODUCT"); setOpenModal(true); }}>
          <Plus className="mr-2 h-5 w-5" /> Novo Item / Serviço
        </Button>
      </div>

      {/* ABAS DO WMS */}
      <Tabs defaultValue="dashboard" className="w-full" onValueChange={() => setCurrentPage(1)}>
        <div className="w-full overflow-x-auto hide-scrollbar mb-6 bg-zinc-200/50 dark:bg-zinc-800/50 rounded-lg p-1">
          <TabsList className="flex w-max min-w-full justify-start md:justify-center bg-transparent h-12">
            <TabsTrigger value="dashboard" className="dark:data-[state=active]:bg-zinc-700 flex-1 whitespace-nowrap text-sm"><Activity className="w-4 h-4 mr-2"/> Dashboard</TabsTrigger>
            <TabsTrigger value="products" className="data-[state=active]:text-blue-600 dark:data-[state=active]:bg-zinc-700 flex-1 whitespace-nowrap text-sm"><Package className="w-4 h-4 mr-2"/> Peças Físicas</TabsTrigger>
            <TabsTrigger value="services" className="data-[state=active]:text-emerald-600 dark:data-[state=active]:bg-zinc-700 flex-1 whitespace-nowrap text-sm"><Wrench className="w-4 h-4 mr-2"/> Mão de Obra</TabsTrigger>
            <TabsTrigger value="history" className="dark:data-[state=active]:bg-zinc-700 flex-1 whitespace-nowrap text-sm"><History className="w-4 h-4 mr-2"/> Auditoria (Kardex)</TabsTrigger>
          </TabsList>
        </div>

        {/* ABA: DASHBOARD GIGANTE */}
        <TabsContent value="dashboard" className="space-y-8">
          
          {/* BLOCO 1: VISÃO FINANCEIRA */}
          <div>
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2"><DollarSign className="w-4 h-4"/> Visão Financeira do Estoque</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="bg-zinc-900 dark:bg-zinc-950 border dark:border-zinc-800 p-6 rounded-xl shadow-sm transition-all hover:-translate-y-1">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Capital Imobilizado (Custo)</p>
                <p className="text-3xl sm:text-4xl font-black text-white">{formatCurrency(totalCapital)}</p>
                <p className="text-xs text-zinc-500 mt-2 font-medium">Dinheiro preso na prateleira</p>
              </div>
              <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 p-6 rounded-xl shadow-sm transition-all hover:-translate-y-1">
                <p className="text-xs font-bold text-blue-800 dark:text-blue-500 uppercase tracking-wider mb-2">Potencial de Faturamento</p>
                <p className="text-3xl sm:text-4xl font-black text-blue-700 dark:text-blue-400">{formatCurrency(totalPotentialSales)}</p>
                <p className="text-xs text-blue-600/80 dark:text-blue-500/80 mt-2 font-medium">Se vender tudo pelo preço cheio</p>
              </div>
              <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 p-6 rounded-xl shadow-sm transition-all hover:-translate-y-1">
                <p className="text-xs font-bold text-emerald-800 dark:text-emerald-500 uppercase tracking-wider mb-2 flex items-center gap-2"><TrendingUp className="w-4 h-4"/> Lucro Projetado</p>
                <p className="text-3xl sm:text-4xl font-black text-emerald-700 dark:text-emerald-400">{formatCurrency(potentialProfit)}</p>
                <p className="text-xs text-emerald-600/80 dark:text-emerald-500/80 mt-2 font-medium">Margem bruta total das peças</p>
              </div>
            </div>
          </div>

          {/* BLOCO 2: MÉTRICAS FÍSICAS */}
          <div>
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2"><Boxes className="w-4 h-4"/> Catálogo e Quantidades</h3>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 p-5 rounded-xl shadow-sm">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Total de Unidades</p>
                <p className="text-3xl font-black text-zinc-900 dark:text-zinc-100">{totalUnitsInStock}</p>
                <p className="text-[10px] text-zinc-500 mt-1 uppercase">Soma de todas as peças</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 p-5 rounded-xl shadow-sm">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Peças Únicas (SKUs)</p>
                <p className="text-3xl font-black text-zinc-900 dark:text-zinc-100">{physicalProducts.length}</p>
                <p className="text-[10px] text-zinc-500 mt-1 uppercase">Modelos de peças físicas</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 p-5 rounded-xl shadow-sm">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Mão de Obra</p>
                <p className="text-3xl font-black text-zinc-900 dark:text-zinc-100">{serviceProducts.length}</p>
                <p className="text-[10px] text-zinc-500 mt-1 uppercase">Serviços cadastrados</p>
              </div>
              <div className={`p-5 rounded-xl shadow-sm border ${criticalItems.length > 0 ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'}`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1 ${criticalItems.length > 0 ? 'text-red-800 dark:text-red-500' : 'text-zinc-500'}`}><AlertTriangle className="w-3 h-3"/> Ruptura</p>
                <p className={`text-3xl font-black ${criticalItems.length > 0 ? 'text-red-600 dark:text-red-500' : 'text-zinc-900 dark:text-zinc-100'}`}>{criticalItems.length}</p>
                <p className={`text-[10px] mt-1 uppercase ${criticalItems.length > 0 ? 'text-red-600/80 dark:text-red-500/80 font-bold' : 'text-zinc-500'}`}>Itens no vermelho</p>
              </div>
            </div>
          </div>

          {/* BLOCO 3: ALERTAS E ÚLTIMAS MOVIMENTAÇÕES */}
          <div className="grid gap-6 lg:grid-cols-2">
            
            {/* Tabela de Alerta Crítico */}
            <div className="bg-white dark:bg-zinc-900 border border-red-100 dark:border-red-900/30 rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 bg-red-50 dark:bg-red-950/20 border-b border-red-100 dark:border-red-900/30 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-500"/>
                <h3 className="font-bold text-red-900 dark:text-red-400">Precisam de Reposição Urgente</h3>
              </div>
              <div className="overflow-x-auto flex-1">
                <Table>
                  <TableHeader className="bg-zinc-50/50 dark:bg-zinc-950/50 whitespace-nowrap">
                    <TableRow className="dark:border-zinc-800">
                      <TableHead>Peça & Código</TableHead>
                      <TableHead className="text-center w-[80px]">Mín.</TableHead>
                      <TableHead className="text-center w-[80px]">Atual</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {criticalItems.length === 0 && (
                      <TableRow><TableCell colSpan={3} className="text-center py-8 text-zinc-500">Estoque saudável! Nenhuma peça em falta.</TableCell></TableRow>
                    )}
                    {criticalItems.slice(0, 6).map((p) => (
                      <TableRow key={`crit-${p.id}`} className="dark:border-zinc-800 py-2">
                        <TableCell className="py-3">
                          <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100 leading-tight">{p.name}</p>
                          <p className="text-[11px] text-zinc-500 font-mono mt-0.5">{p.sku || 'S/N'}</p>
                        </TableCell>
                        <TableCell className="text-center font-mono text-zinc-500">{p.minStock}</TableCell>
                        <TableCell className="text-center font-black text-lg text-red-600 dark:text-red-500 bg-red-50/50 dark:bg-red-950/10">{p.stock}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Tabela de Últimas Atividades */}
            <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b dark:border-zinc-800 flex items-center gap-2 bg-zinc-50/50 dark:bg-zinc-950/50">
                <History className="w-5 h-5 text-zinc-500"/>
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Últimas Movimentações</h3>
              </div>
              <div className="overflow-x-auto flex-1">
                <Table>
                  <TableBody>
                    {recentTransactions.length === 0 && (
                      <TableRow><TableCell className="text-center py-8 text-zinc-500">Nenhuma movimentação recente.</TableCell></TableRow>
                    )}
                    {recentTransactions.map((t) => (
                      <TableRow key={`rec-${t.id}`} className="dark:border-zinc-800">
                        <TableCell className="py-3">
                          <div className="flex items-center gap-3">
                            {t.type === "IN" ? <ArrowUpRight className="w-5 h-5 text-emerald-500 shrink-0"/> : t.type === "OUT" ? <ArrowDownRight className="w-5 h-5 text-orange-500 shrink-0"/> : <FileEdit className="w-5 h-5 text-zinc-400 shrink-0"/>}
                            <div>
                              <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100 leading-tight">{t.product?.name || 'Item Excluído'}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-xs font-bold ${t.type === "IN" ? "text-emerald-600" : t.type === "OUT" ? "text-orange-600" : "text-zinc-500"}`}>
                                  {t.type === "EDIT" ? "Editado" : `${t.type === "IN" ? '+' : '-'}${t.quantity} un`}
                                </span>
                                {t.order && <Badge variant="outline" className="text-[9px] bg-blue-50 text-blue-700 border-blue-200 py-0 h-4">OS #{t.order.number}</Badge>}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-xs text-zinc-500 dark:text-zinc-400 w-[100px]">
                          {new Date(t.createdAt).toLocaleDateString('pt-BR')}<br/>
                          {new Date(t.createdAt).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

          </div>
        </TabsContent>

        {/* ABA: PEÇAS FÍSICAS (Tabelas Ampliadas) */}
        <TabsContent value="products" className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-lg shadow-sm overflow-hidden">
          <ProductTable 
            products={filteredProducts} 
            isServiceTab={false} 
            setQuickAdjust={setQuickAdjust} 
            setEditItem={setEditItem} 
            formatCurrency={formatCurrency}
            currentPage={currentPage} 
            setCurrentPage={setCurrentPage} 
            itemsPerPage={itemsPerPage}
            emptyMsg="Nenhuma peça física encontrada no catálogo."
          />
        </TabsContent>

        {/* ABA: SERVIÇOS (MÃO DE OBRA) */}
        <TabsContent value="services" className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-lg shadow-sm overflow-hidden">
          <ProductTable 
            products={filteredServices} 
            isServiceTab={true} 
            setQuickAdjust={setQuickAdjust} 
            setEditItem={setEditItem} 
            formatCurrency={formatCurrency}
            currentPage={currentPage} 
            setCurrentPage={setCurrentPage} 
            itemsPerPage={itemsPerPage}
            emptyMsg="Nenhum serviço ou mão de obra cadastrado no catálogo."
          />
        </TabsContent>

        {/* ABA: HISTÓRICO (KARDEX) */}
        <TabsContent value="history" className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-lg shadow-sm overflow-hidden">
          <HistoryTable 
            transactions={filteredTransactions} 
            currentPage={currentPage} 
            setCurrentPage={setCurrentPage} 
            itemsPerPage={itemsPerPage}
            emptyMsg="Nenhuma movimentação registrada no histórico."
          />
        </TabsContent>
      </Tabs>

      {/* MODAL: CRIAR PRODUTO / SERVIÇO */}
      <Dialog open={openModal} onOpenChange={(open) => { setOpenModal(open); if (!open) setIsCustomCategoryCreate(false); }}>
        <DialogContent className="w-[95vw] max-w-2xl dark:bg-zinc-950 dark:border-zinc-800 p-0 overflow-hidden rounded-xl">
          <div className="p-6 border-b dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50">
            <DialogTitle className="dark:text-zinc-100 flex items-center gap-2 text-xl">
              <Plus className="w-5 h-5 text-blue-500"/> Cadastro no Catálogo
            </DialogTitle>
          </div>
          
          <form action={handleCreate} className="p-6 max-h-[75vh] overflow-y-auto">
            {/* Escolha do Tipo de Item */}
            <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg mb-6 w-full sm:w-fit mx-auto sm:mx-0">
              <button type="button" onClick={() => setItemTypeToCreate("PRODUCT")} className={`flex-1 sm:flex-none px-6 py-2 text-sm font-bold rounded-md transition-colors ${itemTypeToCreate === 'PRODUCT' ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'}`}>
                📦 Peça Física
              </button>
              <button type="button" onClick={() => setItemTypeToCreate("SERVICE")} className={`flex-1 sm:flex-none px-6 py-2 text-sm font-bold rounded-md transition-colors ${itemTypeToCreate === 'SERVICE' ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'}`}>
                🛠️ Serviço (Mão de Obra)
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="col-span-1 sm:col-span-2 space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Nome do {itemTypeToCreate === 'PRODUCT' ? 'Produto' : 'Serviço'} *</label>
                <Input name="name" required placeholder={itemTypeToCreate === 'PRODUCT' ? "Ex: Pastilha de Freio Cobreq" : "Ex: Troca de Óleo + Filtros"} className="h-12 dark:bg-zinc-900 dark:border-zinc-800 text-base" />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Código / SKU (Opcional)</label>
                <Input name="sku" placeholder="Ex: COD-001" className="h-12 dark:bg-zinc-900 dark:border-zinc-800 text-base" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Categoria *</label>
                  <button type="button" onClick={() => setIsCustomCategoryCreate(!isCustomCategoryCreate)} className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    {isCustomCategoryCreate ? "Usar Existente" : "+ Nova"}
                  </button>
                </div>
                {isCustomCategoryCreate ? (
                  <Input name="category" placeholder="Digite a nova categoria..." required autoFocus className="h-12 dark:bg-zinc-900 dark:border-zinc-800 text-base" />
                ) : (
                  <Select name="category" defaultValue={itemTypeToCreate === 'PRODUCT' ? "Escapamentos" : "Mão de Obra"}>
                    <SelectTrigger className="h-12 dark:bg-zinc-900 dark:border-zinc-800 text-base"><SelectValue /></SelectTrigger>
                    <SelectContent className="dark:bg-zinc-900 dark:border-zinc-800">
                      {uniqueCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Custo / Despesa (R$)</label>
                <Input name="costPrice" type="number" step="0.01" defaultValue="0" required className="h-12 dark:bg-zinc-900 dark:border-zinc-800 font-bold text-lg text-red-600 dark:text-red-400" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Preço de Venda (R$)</label>
                <Input name="sellingPrice" type="number" step="0.01" defaultValue="0" required className="h-12 dark:bg-zinc-900 dark:border-zinc-800 font-bold text-lg text-emerald-600 dark:text-emerald-400" />
              </div>

              {/* Só exibe campos de estoque se for PRODUTO FÍSICO */}
              {itemTypeToCreate === "PRODUCT" && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Estoque Inicial (Gaveta)</label>
                    <Input name="initialStock" type="number" defaultValue="0" required className="h-12 dark:bg-zinc-900 dark:border-zinc-800 text-base" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Alerta Mínimo (Ruptura)</label>
                    <Input name="minStock" type="number" defaultValue="2" required className="h-12 dark:bg-zinc-900 dark:border-zinc-800 text-base" />
                  </div>
                  <div className="col-span-1 sm:col-span-2 space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Localização / Prateleira (Opcional)</label>
                    <Input name="location" placeholder="Ex: Corredor A, Gaveta 3" className="h-12 dark:bg-zinc-900 dark:border-zinc-800 text-base" />
                  </div>
                </>
              )}

              <div className="col-span-1 sm:col-span-2 space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">URL da Foto (Opcional)</label>
                <Input name="imageUrl" placeholder="https://exemplo.com/foto.jpg" className="h-12 dark:bg-zinc-900 dark:border-zinc-800 text-base" />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-end pt-6 mt-6 border-t dark:border-zinc-800">
              <Button type="button" variant="outline" className="w-full sm:w-auto h-12" onClick={() => setOpenModal(false)}>Cancelar</Button>
              <Button type="submit" className={`w-full sm:w-auto h-12 text-white font-bold text-base shadow-md ${itemTypeToCreate === 'PRODUCT' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                Cadastrar no Catálogo
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: AJUSTE RÁPIDO DE ESTOQUE */}
      <Dialog open={!!quickAdjust} onOpenChange={(open) => !open && setQuickAdjust(null)}>
        <DialogContent className="w-[90vw] max-w-md dark:bg-zinc-950 dark:border-zinc-800 rounded-xl p-0 overflow-hidden">
          <div className={`p-5 border-b dark:border-zinc-800 text-white ${quickAdjust?.type === 'IN' ? 'bg-emerald-600' : 'bg-orange-600'}`}>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              {quickAdjust?.type === "IN" ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
              {quickAdjust?.type === "IN" ? "Entrada no Estoque" : "Saída do Estoque"}
            </DialogTitle>
          </div>
          <form action={handleAdjust} className="p-6 space-y-5">
            <input type="hidden" name="productId" value={quickAdjust?.product.id} />
            <input type="hidden" name="type" value={quickAdjust?.type} />
            
            <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg border dark:border-zinc-800 text-sm text-center">
              <span className="text-xs uppercase font-bold text-zinc-500">Peça selecionada</span><br/>
              <span className="font-black text-zinc-900 dark:text-zinc-100 text-lg">{quickAdjust?.product.name}</span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Quantidade ({quickAdjust?.type === "IN" ? "+" : "-"})</label>
              <Input name="quantity" type="number" min="1" required autoFocus className="h-16 font-black text-3xl text-center dark:bg-zinc-900 dark:border-zinc-800" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Motivo / Log (Obrigatório)</label>
              <Input name="reason" placeholder={quickAdjust?.type === "IN" ? "Ex: Compra NF 1234, Devolução..." : "Ex: Peça com defeito, Uso interno, Quebra..."} required className="h-12 text-base dark:bg-zinc-900 dark:border-zinc-800" />
              <p className="text-[11px] text-zinc-500 mt-1">Se a saída for para uma OS, use a tela do Pátio que a baixa é automática.</p>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="w-full h-12" onClick={() => setQuickAdjust(null)}>Cancelar</Button>
              <Button type="submit" className={`w-full h-12 text-base font-bold text-white ${quickAdjust?.type === "IN" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-orange-600 hover:bg-orange-700"}`}>Confirmar Operação</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: EDITAR ITEM */}
      <Dialog open={!!editItem} onOpenChange={(open) => { if (!open) { setEditItem(null); setIsCustomCategoryEdit(false); }}}>
        <DialogContent className="w-[95vw] max-w-2xl dark:bg-zinc-950 dark:border-zinc-800 p-0 overflow-hidden rounded-xl">
          <div className="p-6 border-b dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50">
            <DialogTitle className="dark:text-zinc-100 flex items-center gap-2 text-xl"><FileEdit className="w-5 h-5 text-blue-500"/> Editar Dados do Catálogo</DialogTitle>
          </div>
          {editItem && (
            <form action={handleUpdate} className="p-6 max-h-[75vh] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <input type="hidden" name="id" value={editItem.id} />
              <input type="hidden" name="isService" value={editItem.isService ? "true" : "false"} />
              
              <div className="col-span-1 sm:col-span-2 space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Nome</label>
                <Input name="name" defaultValue={editItem.name} required className="h-12 dark:bg-zinc-900 dark:border-zinc-800 text-base" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Código (SKU)</label>
                <Input name="sku" defaultValue={editItem.sku || ""} className="h-12 dark:bg-zinc-900 dark:border-zinc-800 text-base" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Categoria</label>
                  <button type="button" onClick={() => setIsCustomCategoryEdit(!isCustomCategoryEdit)} className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    {isCustomCategoryEdit ? "Usar Existente" : "+ Nova"}
                  </button>
                </div>
                {isCustomCategoryEdit ? (
                  <Input name="category" placeholder="Nova categoria..." required autoFocus className="h-12 dark:bg-zinc-900 dark:border-zinc-800 text-base" />
                ) : (
                  <Select name="category" defaultValue={editItem.category}>
                    <SelectTrigger className="h-12 dark:bg-zinc-900 dark:border-zinc-800 text-base"><SelectValue /></SelectTrigger>
                    <SelectContent className="dark:bg-zinc-900 dark:border-zinc-800">
                      {uniqueCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Preço de Custo (R$)</label>
                <Input name="costPrice" type="number" step="0.01" defaultValue={editItem.costPrice} required className="h-12 text-lg font-bold dark:bg-zinc-900 dark:border-zinc-800" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Preço de Venda (R$)</label>
                <Input name="sellingPrice" type="number" step="0.01" defaultValue={editItem.sellingPrice} required className="h-12 text-lg font-bold dark:bg-zinc-900 dark:border-zinc-800" />
              </div>

              {!editItem.isService && (
                <div className="col-span-1 sm:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Alerta de Estoque Mínimo</label>
                  <Input name="minStock" type="number" defaultValue={editItem.minStock} required className="h-12 dark:bg-zinc-900 dark:border-zinc-800 text-base" />
                </div>
              )}

              <div className="col-span-1 sm:col-span-2 space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">URL da Foto</label>
                <Input name="imageUrl" defaultValue={editItem.imageUrl || ""} className="h-12 dark:bg-zinc-900 dark:border-zinc-800 text-base" />
              </div>

              <div className="col-span-1 sm:col-span-2 flex flex-col sm:flex-row gap-3 justify-end pt-6 mt-4 border-t dark:border-zinc-800">
                <Button type="button" variant="outline" className="w-full sm:w-auto h-12" onClick={() => setEditItem(null)}>Cancelar</Button>
                <Button type="submit" className="w-full sm:w-auto h-12 text-base font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md">Salvar Alterações</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* CSS para esconder scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}

// SUB-COMPONENTE: TABELA DE CATÁLOGO (AMPLIADA 40%)
function ProductTable({ products, isServiceTab, setQuickAdjust, setEditItem, formatCurrency, currentPage, setCurrentPage, itemsPerPage, emptyMsg }: any) {
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const currentData = products.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="flex flex-col h-full">
      <div className="overflow-x-auto hide-scrollbar">
        <Table>
          <TableHeader className="bg-zinc-50/50 dark:bg-zinc-950/50 whitespace-nowrap">
            <TableRow className="dark:border-zinc-800">
              {!isServiceTab && <TableHead className="w-[80px] dark:text-zinc-400 text-center py-4">Foto</TableHead>}
              <TableHead className="dark:text-zinc-400 min-w-[250px] py-4 text-sm">Nome & Referência</TableHead>
              <TableHead className="dark:text-zinc-400 text-right w-[140px] py-4 text-sm">Preço Venda</TableHead>
              <TableHead className="dark:text-zinc-400 text-right w-[160px] hidden md:table-cell py-4 text-sm">Custo / Margem</TableHead>
              {!isServiceTab && <TableHead className="dark:text-zinc-400 text-center w-[180px] py-4 text-sm">Gaveta / Estoque</TableHead>}
              <TableHead className="dark:text-zinc-400 text-right w-[90px] py-4">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center py-16 text-zinc-500 text-base">{emptyMsg}</TableCell></TableRow>
            )}
            {currentData.map((p: any) => {
              const profit = p.sellingPrice - p.costPrice;
              const margin = p.sellingPrice > 0 ? (profit / p.sellingPrice) * 100 : 0;
              const status = p.stock === 0 ? "OUT" : p.stock <= p.minStock ? "LOW" : "OK";

              return (
                <TableRow key={p.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 dark:border-zinc-800">
                  {!isServiceTab && (
                    <TableCell className="text-center py-4">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg object-cover border dark:border-zinc-700 mx-auto shadow-sm" />
                      ) : (
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border dark:border-zinc-700 text-zinc-400 mx-auto shadow-sm"><ImageIcon className="w-6 h-6"/></div>
                      )}
                    </TableCell>
                  )}
                  
                  <TableCell className="py-4">
                    <p className="font-bold text-base sm:text-lg text-zinc-900 dark:text-zinc-100 leading-tight">{p.name}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-[10px] h-5 px-2 uppercase tracking-wider dark:border-zinc-700 dark:text-zinc-300">{p.category}</Badge>
                      {p.sku && <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">{p.sku}</span>}
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-right py-4">
                    <span className="font-black text-lg sm:text-xl text-zinc-900 dark:text-zinc-100">{formatCurrency(p.sellingPrice)}</span>
                  </TableCell>

                  <TableCell className="text-right hidden md:table-cell py-4">
                    <div className="group/privacy cursor-help select-none">
                      <div className="blur-sm hover:blur-none transition-all duration-300 opacity-60 hover:opacity-100 inline-block text-right">
                        <p className="text-xs font-bold text-red-600 dark:text-red-400 leading-tight">Custo: {formatCurrency(p.costPrice)}</p>
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 leading-tight mt-1">Lucro: {formatCurrency(profit)} ({margin.toFixed(0)}%)</p>
                      </div>
                    </div>
                  </TableCell>

                  {!isServiceTab && (
                    <TableCell className="text-center py-4">
                      <div className="flex items-center justify-center gap-3">
                        <Button variant="outline" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 rounded-full dark:border-zinc-700 text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => setQuickAdjust({ product: p, type: 'OUT' })}><Minus className="h-4 w-4 sm:h-5 sm:w-5"/></Button>
                        <div className="flex flex-col items-center justify-center min-w-[48px]">
                          <span className={`text-2xl sm:text-3xl font-black leading-none ${status === 'OUT' ? 'text-red-600 dark:text-red-500' : status === 'LOW' ? 'text-yellow-600 dark:text-yellow-500' : 'text-zinc-900 dark:text-zinc-100'}`}>{p.stock}</span>
                          {status === "OUT" && <span className="text-[10px] font-bold text-red-600 uppercase leading-none mt-1">Falta</span>}
                          {status === "LOW" && <span className="text-[10px] font-bold text-yellow-600 uppercase leading-none mt-1">Baixo</span>}
                        </div>
                        <Button variant="outline" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 rounded-full dark:border-zinc-700 text-zinc-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30" onClick={() => setQuickAdjust({ product: p, type: 'IN' })}><Plus className="h-4 w-4 sm:h-5 sm:w-5"/></Button>
                      </div>
                    </TableCell>
                  )}

                  <TableCell className="text-right py-4">
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-zinc-400 hover:text-blue-600" onClick={() => setEditItem(p)} title="Editar"><Edit className="w-5 h-5"/></Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-5 border-t dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 mt-auto">
          <p className="text-sm text-zinc-500 font-medium text-center sm:text-left">Exibindo {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, products.length)} de {products.length}</p>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => setCurrentPage((p: number) => Math.max(1, p - 1))} disabled={currentPage === 1} className="flex-1 sm:flex-none h-10 dark:bg-zinc-900 dark:border-zinc-800"><ChevronLeft className="w-4 h-4 mr-1"/> Anterior</Button>
            <Button variant="outline" onClick={() => setCurrentPage((p: number) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="flex-1 sm:flex-none h-10 dark:bg-zinc-900 dark:border-zinc-800">Próxima <ChevronRight className="w-4 h-4 ml-1"/></Button>
          </div>
        </div>
      )}
    </div>
  );
}

// SUB-COMPONENTE: TABELA DE HISTÓRICO (Kardex AMPLIADO)
function HistoryTable({ transactions, currentPage, setCurrentPage, itemsPerPage, emptyMsg }: any) {
  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const currentData = transactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="flex flex-col h-full">
      <div className="overflow-x-auto hide-scrollbar">
        <Table>
          <TableHeader className="bg-zinc-50/50 dark:bg-zinc-950/50 whitespace-nowrap">
            <TableRow className="dark:border-zinc-800">
              <TableHead className="w-[160px] dark:text-zinc-400 py-4 text-sm">Data e Hora</TableHead>
              <TableHead className="w-[140px] dark:text-zinc-400 py-4 text-sm">Operação</TableHead>
              <TableHead className="min-w-[250px] dark:text-zinc-400 py-4 text-sm">Produto & Rastreio (OS)</TableHead>
              <TableHead className="w-[100px] dark:text-zinc-400 text-right py-4 text-sm">Mov.</TableHead>
              <TableHead className="dark:text-zinc-400 hidden sm:table-cell py-4 text-sm">Motivo / Log</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center py-16 text-zinc-500 text-base">{emptyMsg}</TableCell></TableRow>
            )}
            {currentData.map((t: any) => (
              <TableRow key={t.id} className="dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <TableCell className="text-zinc-500 dark:text-zinc-400 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{new Date(t.createdAt).toLocaleDateString('pt-BR')}</span>
                    <span className="text-xs">{new Date(t.createdAt).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  {t.type === "IN" && <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400 hover:bg-emerald-100 border-0 px-2 py-1"><ArrowUpRight className="w-4 h-4 mr-1"/> Entrada</Badge>}
                  {t.type === "OUT" && <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-400 hover:bg-orange-100 border-0 px-2 py-1"><ArrowDownRight className="w-4 h-4 mr-1"/> Saída</Badge>}
                  {t.type === "EDIT" && <Badge variant="secondary" className="bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-zinc-200 border-0 px-2 py-1"><FileEdit className="w-4 h-4 mr-1"/> Edição</Badge>}
                </TableCell>
                <TableCell className="py-4">
                  <p className="font-bold text-base text-zinc-900 dark:text-zinc-100 leading-tight">{t.product?.name || 'Produto Excluído'}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {t.product?.sku && <span className="text-xs text-zinc-400 font-mono">SKU: {t.product.sku}</span>}
                    {t.order && (
                      <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50 flex items-center gap-1 h-5 px-2">
                        <Hash className="w-3 h-3"/> OS #{t.order.number} ({t.order.customer?.name?.split(' ')[0]})
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right py-4">
                  {t.type === "EDIT" ? <span className="text-zinc-400 font-mono text-base">-</span> : <span className={`font-black font-mono text-xl ${t.type === "IN" ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'}`}>{t.type === "IN" ? '+' : '-'}{t.quantity}</span>}
                </TableCell>
                <TableCell className="text-zinc-600 dark:text-zinc-400 text-sm hidden sm:table-cell py-4 truncate max-w-[250px]" title={t.reason}>{t.reason || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-5 border-t dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 mt-auto">
          <p className="text-sm text-zinc-500 font-medium text-center sm:text-left">Exibindo {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, transactions.length)} de {transactions.length}</p>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => setCurrentPage((p: number) => Math.max(1, p - 1))} disabled={currentPage === 1} className="flex-1 sm:flex-none h-10 dark:bg-zinc-900 dark:border-zinc-800"><ChevronLeft className="w-4 h-4 mr-1"/> Anterior</Button>
            <Button variant="outline" onClick={() => setCurrentPage((p: number) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="flex-1 sm:flex-none h-10 dark:bg-zinc-900 dark:border-zinc-800">Próxima <ChevronRight className="w-4 h-4 ml-1"/></Button>
          </div>
        </div>
      )}
    </div>
  );
}