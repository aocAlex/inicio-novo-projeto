
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QuotaIndicator } from './QuotaIndicator';
import { AlertTriangle, Info } from 'lucide-react';

interface WorkspaceQuotaModalProps {
  open: boolean;
  onClose: () => void;
  used: number;
  total: number;
  isUnlimited?: boolean;
}

export const WorkspaceQuotaModal: React.FC<WorkspaceQuotaModalProps> = ({
  open,
  onClose,
  used,
  total,
  isUnlimited = false
}) => {
  const isAtLimit = used >= total && !isUnlimited;
  const isNearLimit = used >= total * 0.8 && !isUnlimited;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isAtLimit ? (
              <AlertTriangle className="h-5 w-5 text-red-500" />
            ) : (
              <Info className="h-5 w-5 text-blue-500" />
            )}
            {isAtLimit ? 'Limite de Workspaces Atingido' : 'Uso de Workspaces'}
          </DialogTitle>
          <DialogDescription>
            {isAtLimit 
              ? 'Você atingiu o limite máximo de workspaces. Para criar uma nova workspace, você precisa excluir uma existente.'
              : isNearLimit
              ? 'Você está próximo do seu limite de workspaces.'
              : 'Informações sobre seu uso atual de workspaces.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <QuotaIndicator 
            used={used} 
            total={total} 
            isUnlimited={isUnlimited}
            showDetails={true}
            size="lg"
          />
        </div>

        {isAtLimit && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-medium text-red-800 mb-2">
              Como liberar espaço:
            </h4>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• Exclua workspaces que não estão sendo utilizadas</li>
              <li>• Verifique workspaces duplicadas ou de teste</li>
              <li>• Entre em contato com o administrador para aumentar seu limite</li>
            </ul>
          </div>
        )}

        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Entendi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
