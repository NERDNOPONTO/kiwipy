import DashboardLayout from "@/components/DashboardLayout";
import { Settings as SettingsIcon } from "lucide-react";

const Settings = () => {
  return (
    <DashboardLayout>
      <div className="p-8 space-y-8 animate-fade-in flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mb-6">
          <SettingsIcon className="w-12 h-12 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-display font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground text-center max-w-md">
          Em breve você poderá gerenciar as configurações da sua conta, métodos de pagamento e preferências de notificação.
        </p>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
