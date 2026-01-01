import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash, Edit, Check, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface SaaSPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: 'monthly' | 'yearly' | 'lifetime' | 'daily';
  features: string[];
  is_active: boolean;
}

const AdminPlans = () => {
  const [plans, setPlans] = useState<SaaSPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const [currentPlan, setCurrentPlan] = useState<Partial<SaaSPlan>>({
    name: "",
    description: "",
    price: 0,
    interval: "monthly",
    features: [],
    is_active: true
  });
  const [featureInput, setFeatureInput] = useState("");

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('saas_plans')
        .select('*')
        .order('price', { ascending: true });
      
      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error("Error loading plans:", error);
      toast({ variant: "destructive", title: "Erro ao carregar planos" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const planData = {
        name: currentPlan.name,
        description: currentPlan.description,
        price: currentPlan.price,
        interval: currentPlan.interval,
        features: currentPlan.features,
        is_active: currentPlan.is_active
      };

      if (currentPlan.id) {
        await supabase.from('saas_plans').update(planData).eq('id', currentPlan.id);
        toast({ title: "Plano atualizado!" });
      } else {
        await supabase.from('saas_plans').insert(planData);
        toast({ title: "Plano criado!" });
      }
      
      setIsDialogOpen(false);
      loadPlans();
      setCurrentPlan({ name: "", description: "", price: 0, interval: "monthly", features: [], is_active: true });
    } catch (error) {
      console.error("Error saving plan:", error);
      toast({ variant: "destructive", title: "Erro ao salvar plano" });
    }
  };

  const addFeature = () => {
    if (featureInput.trim()) {
      setCurrentPlan(prev => ({
        ...prev,
        features: [...(prev.features || []), featureInput.trim()]
      }));
      setFeatureInput("");
    }
  };

  const removeFeature = (index: number) => {
    setCurrentPlan(prev => ({
      ...prev,
      features: prev.features?.filter((_, i) => i !== index)
    }));
  };

  return (
    <AdminLayout>
      <div className="space-y-8 animate-fade-in">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Planos SaaS</h2>
            <p className="text-muted-foreground">Gerencie os planos de assinatura da plataforma.</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setCurrentPlan({ name: "", description: "", price: 0, interval: "monthly", features: [], is_active: true })}>
                <Plus className="w-4 h-4 mr-2" /> Novo Plano
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{currentPlan.id ? "Editar Plano" : "Novo Plano"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Nome do Plano</Label>
                  <Input value={currentPlan.name} onChange={e => setCurrentPlan({...currentPlan, name: e.target.value})} />
                </div>
                <div className="grid gap-2">
                  <Label>Preço</Label>
                  <Input type="number" value={currentPlan.price} onChange={e => setCurrentPlan({...currentPlan, price: parseFloat(e.target.value)})} />
                </div>
                <div className="grid gap-2">
                  <Label>Intervalo</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={currentPlan.interval} 
                    onChange={e => setCurrentPlan({...currentPlan, interval: e.target.value as any})}
                  >
                    <option value="monthly">Mensal</option>
                    <option value="yearly">Anual</option>
                    <option value="lifetime">Vitalício</option>
                    <option value="daily">Diário (Preço por dia)</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label>Descrição</Label>
                  <Input value={currentPlan.description} onChange={e => setCurrentPlan({...currentPlan, description: e.target.value})} />
                </div>
                <div className="grid gap-2">
                    <Label>Funcionalidades</Label>
                    <div className="flex gap-2">
                        <Input value={featureInput} onChange={e => setFeatureInput(e.target.value)} placeholder="Ex: Saques Ilimitados" />
                        <Button type="button" onClick={addFeature} size="sm">Adicionar</Button>
                    </div>
                    <ul className="text-sm space-y-1">
                        {currentPlan.features?.map((f, i) => (
                            <li key={i} className="flex items-center justify-between bg-muted p-2 rounded">
                                {f}
                                <button onClick={() => removeFeature(i)} className="text-red-500 hover:text-red-700">
                                    <X className="w-4 h-4" />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSave}>Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Intervalo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.name}</TableCell>
                  <TableCell>{formatCurrency(plan.price)}</TableCell>
                  <TableCell>
                    {plan.interval === 'monthly' ? 'Mensal' : 
                     plan.interval === 'yearly' ? 'Anual' : 
                     plan.interval === 'daily' ? 'Diário' : 'Vitalício'}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${plan.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {plan.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => {
                        setCurrentPlan(plan);
                        setIsDialogOpen(true);
                    }}>
                        <Edit className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminPlans;
