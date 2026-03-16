// app/dashboard/EditGoalButton.tsx
"use client";

import { useState } from "react";
import { Target, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { updateMonthlyGoal } from "@/actions/settings";
import { toast } from "sonner";

export function EditGoalButton({ currentGoal }: { currentGoal: number }) {
  const [open, setOpen] = useState(false);
  const [goal, setGoal] = useState(currentGoal.toString());

  const handleSave = async () => {
    const numGoal = parseFloat(goal);
    if (isNaN(numGoal) || numGoal <= 0) {
      toast.error("Insira um valor maior que zero.");
      return;
    }
    
    try {
      await updateMonthlyGoal(numGoal);
      toast.success("Meta mensal atualizada!");
      setOpen(false);
    } catch (error) {
      toast.error("Erro ao atualizar a meta.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6 ml-2 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-full transition-colors">
          <Edit3 className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] bg-white dark:bg-zinc-950 dark:border-zinc-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            <Target className="h-5 w-5 text-blue-600" />
            Alterar Meta Mensal
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Nova Meta de Faturamento (R$)</label>
            <Input
              type="number"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="h-12 text-lg font-bold dark:bg-zinc-900 dark:border-zinc-800 focus-visible:ring-blue-500"
              placeholder="Ex: 50000"
            />
          </div>
          <Button onClick={handleSave} className="w-full h-12 text-md font-bold bg-blue-600 hover:bg-blue-700 text-white">
            Salvar Nova Meta
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}