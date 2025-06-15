
import React, { useState } from 'react';
import { Search, User, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useClients } from '@/hooks/useClients';
import { useContracts } from '@/hooks/useContracts';
import { Contract } from '@/types/contract';

interface LinkClientModalProps {
  open: boolean;
  onClose: () => void;
  contract: Contract;
  onLinked: () => void;
}

export const LinkClientModal: React.FC<LinkClientModalProps> = ({ 
  open, 
  onClose, 
  contract, 
  onLinked 
}) => {
  const [search, setSearch] = useState('');
  const { clients } = useClients();
  const { linkClientToContract } = useContracts();

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(search.toLowerCase()) ||
    client.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleLinkClient = async (clientId: string) => {
    const success = await linkClientToContract(contract.id, clientId);
    if (success) {
      onLinked();
    }
  };

  // Sugestões baseadas nos signatários
  const suggestions = contract.signers?.map(signer => {
    const matchingClient = clients.find(client => 
      client.email?.toLowerCase() === signer.email.toLowerCase() ||
      (signer.cpf && client.document_number?.replace(/\D/g, '') === signer.cpf.replace(/\D/g, ''))
    );
    return matchingClient;
  }).filter(Boolean) || [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Vincular Cliente ao Contrato</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente por nome ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {suggestions.length > 0 && (
            <div>
              <h4 className="font-medium mb-2 text-sm text-muted-foreground">
                Sugestões baseadas nos signatários:
              </h4>
              <div className="space-y-2">
                {suggestions.map((client) => (
                  <Card key={client.id} className="border-green-200 bg-green-50">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-green-600" />
                          <div>
                            <p className="font-medium">{client.name}</p>
                            <p className="text-sm text-muted-foreground">{client.email}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleLinkClient(client.id)}
                        >
                          Vincular
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="font-medium mb-2 text-sm text-muted-foreground">
              Todos os clientes:
            </h4>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <Card key={client.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <div>
                            <p className="font-medium">{client.name}</p>
                            <p className="text-sm text-muted-foreground">{client.email}</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleLinkClient(client.id)}
                        >
                          Vincular
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  Nenhum cliente encontrado
                </p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Criar Novo Cliente
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
