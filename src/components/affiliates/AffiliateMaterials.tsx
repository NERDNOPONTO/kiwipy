import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  Image as ImageIcon, 
  FileText, 
  Video, 
  Download, 
  Trash2,
  Copy
} from "lucide-react";

export const AffiliateMaterials = () => {
  // Empty State - No backend yet for materials
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Materiais de Divulgação</h2>
          <p className="text-muted-foreground">Disponibilize recursos para seus afiliados venderem mais</p>
        </div>
        <Button>
          <Upload className="w-4 h-4 mr-2" />
          Novo Material
        </Button>
      </div>

      <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg bg-muted/20">
        <div className="p-4 bg-muted rounded-full mb-4">
          <Upload className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Nenhum material disponível</h3>
        <p className="text-muted-foreground text-center max-w-md mb-6">
          Faça upload de banners, copys e vídeos para ajudar seus afiliados a venderem seus produtos.
        </p>
        <Button variant="outline">
          <Upload className="w-4 h-4 mr-2" />
          Fazer Upload Agora
        </Button>
      </div>
    </div>
  );
};
