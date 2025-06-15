
import React, { useState } from 'react';
import { Search, User, Link } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  const [isLinking, setIsLinking] = useState(false);
  const { clients } = useClients();
  const { linkClient } = useContracts();

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(search.toLowerCase()) ||
    (client.email && client.email.toLowerCase().includes(search.toLowerCase())) ||
    (client.document_number && client.document_number.includes(search))
  );

  const handleLinkClient = async (clientId: string) => {
    setIsLinking(true);
    try {
      const success = await linkClient(contract.id, clientId, 'manual', 1.0);
      if (success) {
        onLinked();
      }
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Vincular Cliente ao Contrato
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente por nome, email ou documento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {filteredClients.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum cliente encontrado
              </p>
            ) : (
              filteredClients.map((client) => (
                <Card key={client.id} className="hover:bg-muted/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <h4 className="font-medium">{client.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            {client.email && (
                              <span className="text-sm text-muted-foreground">{client.email}</span>
                            )}
                            {client.document_number && (
                              <Badge variant="outline" className="text-xs">
                                {client.document_number}
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {client.client_type === 'individual' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleLinkClient(client.id)}
                        disabled={isLinking}
                        size="sm"
                      >
                        {isLinking ? 'Vinculando...' : 'Vincular'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
