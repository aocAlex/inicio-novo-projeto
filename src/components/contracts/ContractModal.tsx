
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { X, Download, User, Calendar, FileText, Eye, Link } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useContracts } from '@/hooks/useContracts';
import { useClients } from '@/hooks/useClients';
import { Contract } from '@/types/contract';
import { LinkClientModal } from './LinkClientModal';

interface ContractModalProps {
  open: boolean;
  onClose: () => void;
  contract: Contract | null;
}

export const ContractModal: React.FC<ContractModalProps> = ({ open, onClose, contract }) => {
  const [fullContract, setFullContract] = useState<Contract | null>(null);
  const [showLinkClient, setShowLinkClient] = useState(false);
  const { getContract } = useContracts();

  useEffect(() => {
    if (contract && open) {
      loadFullContract();
    }
  }, [contract, open]);

  const loadFullContract = async () => {
    if (!contract) return;
    
    const full = await getContract(contract.id);
    setFullContract(full);
  };

  const getStatusBadge = (status: Contract['status']) => {
    const config = {
      pending: { label: 'Pendente', variant: 'secondary' as const },
      signed: { label: 'Assinado', variant: 'default' as const },
      rejected: { label: 'Rejeitado', variant: 'destructive' as const },
      expired: { label: 'Expirado', variant: 'outline' as const },
    };
    return <Badge variant={config[status].variant}>{config[status].label}</Badge>;
  };

  if (!contract || !fullContract) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl">{fullContract.contract_name}</DialogTitle>
                <div className="flex items-center gap-2 mt-2">
                  {getStatusBadge(fullContract.status)}
                  {fullContract.contract_type && (
                    <Badge variant="outline">{fullContract.contract_type}</Badge>
                  )}
                </div>
              </div>
              <Button variant="outline" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Detalhes</TabsTrigger>
              <TabsTrigger value="signers">Signatários</TabsTrigger>
              <TabsTrigger value="files">Arquivos</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Informações Básicas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Nome</label>
                      <p>{fullContract.contract_name}</p>
                    </div>
                    {fullContract.contract_code && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Código</label>
                        <p>{fullContract.contract_code}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <div className="mt-1">{getStatusBadge(fullContract.status)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">ZapSign ID</label>
                      <p>{fullContract.zapsign_open_id}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center justify-between">
                      Cliente Vinculado
                      {!fullContract.client && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setShowLinkClient(true)}
                        >
                          <Link className="h-4 w-4 mr-1" />
                          Vincular
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {fullContract.client ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span className="font-medium">{fullContract.client.name}</span>
                        </div>
                        {fullContract.client.email && (
                          <p className="text-sm text-muted-foreground">{fullContract.client.email}</p>
                        )}
                        {fullContract.matching_confidence && (
                          <Badge variant="outline" className="text-xs">
                            {Math.round(fullContract.matching_confidence * 100)}% confiança
                            ({fullContract.matched_by})
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Nenhum cliente vinculado</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Datas Importantes</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Criado em</label>
                    <p>{format(new Date(fullContract.created_at), 'dd/MM/yyyy HH:mm')}</p>
                  </div>
                  {fullContract.zapsign_created_at && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Criado no ZapSign</label>
                      <p>{format(new Date(fullContract.zapsign_created_at), 'dd/MM/yyyy HH:mm')}</p>
                    </div>
                  )}
                  {fullContract.signed_at && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Assinado em</label>
                      <p>{format(new Date(fullContract.signed_at), 'dd/MM/yyyy HH:mm')}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {fullContract.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Observações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{fullContract.notes}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="signers" className="space-y-4">
              {fullContract.signers && fullContract.signers.length > 0 ? (
                <div className="space-y-3">
                  {fullContract.signers.map((signer) => (
                    <Card key={signer.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{signer.name}</h4>
                              <Badge 
                                variant={signer.status === 'signed' ? 'default' : 'secondary'}
                              >
                                {signer.status === 'signed' ? 'Assinado' : 
                                 signer.status === 'pending' ? 'Pendente' : 'Rejeitado'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{signer.email}</p>
                            {signer.cpf && (
                              <p className="text-sm text-muted-foreground">CPF: {signer.cpf}</p>
                            )}
                            {signer.signed_at && (
                              <p className="text-sm text-muted-foreground">
                                Assinado em: {format(new Date(signer.signed_at), 'dd/MM/yyyy HH:mm')}
                              </p>
                            )}
                          </div>
                          {signer.sign_url && signer.status === 'pending' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => window.open(signer.sign_url, '_blank')}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum signatário encontrado
                </p>
              )}
            </TabsContent>

            <TabsContent value="files" className="space-y-4">
              <div className="grid gap-4">
                {fullContract.original_file_url && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          <div>
                            <p className="font-medium">Arquivo Original</p>
                            <p className="text-sm text-muted-foreground">Documento antes da assinatura</p>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          onClick={() => window.open(fullContract.original_file_url, '_blank')}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {fullContract.signed_file_url && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium">Arquivo Assinado</p>
                            <p className="text-sm text-muted-foreground">Documento com todas as assinaturas</p>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          onClick={() => window.open(fullContract.signed_file_url, '_blank')}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {!fullContract.original_file_url && !fullContract.signed_file_url && (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum arquivo disponível
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              {fullContract.history && fullContract.history.length > 0 ? (
                <div className="space-y-3">
                  {fullContract.history.map((event: any) => (
                    <Card key={event.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{event.event_type}</p>
                            {event.event_description && (
                              <p className="text-sm text-muted-foreground">{event.event_description}</p>
                            )}
                            {event.signer_name && (
                              <p className="text-sm text-muted-foreground">
                                Signatário: {event.signer_name}
                              </p>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(event.event_timestamp), 'dd/MM/yyyy HH:mm')}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum evento no histórico
                </p>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {showLinkClient && (
        <LinkClientModal
          open={showLinkClient}
          onClose={() => setShowLinkClient(false)}
          contract={fullContract}
          onLinked={() => {
            setShowLinkClient(false);
            loadFullContract();
          }}
        />
      )}
    </>
  );
};
