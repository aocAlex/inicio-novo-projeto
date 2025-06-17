import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from '@/components/ui/table';

interface WorkspaceOverview {
    workspace_id: string;
    workspace_name: string;
    workspace_description: string | null;
    workspace_logo_url: string | null;
    is_active: boolean | null; // Assuming is_public maps to this
    created_at: string;
    owner_id: string;
    owner_email: string;
    owner_name: string | null;
    members_count: number;
    clients_count: number;
    processes_count: number;
    petitions_count: number;
    executions_count: number;
    active_executions_count: number;
    failed_executions_count: number;
    last_activity: string | null;
}

export const SuperAdminOverviewPage: React.FC = () => {
    const [workspaces, setWorkspaces] = useState<WorkspaceOverview[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchWorkspaces = async () => {
            try {
                setLoading(true);
                setError(null);
                // Ensure types are regenerated for this RPC call to be recognized
                const { data, error } = await supabase.rpc('get_superadmin_workspaces_overview');

                if (error) {
                    console.error('Error fetching workspace overview:', error);
                    setError(error.message);
                    setWorkspaces([]);
                } else {
                    console.log('Workspace overview data:', data);
                    setWorkspaces(data || []);
                }
            } catch (err: any) {
                console.error('Error fetching workspace overview:', err);
                setError(err.message);
                setWorkspaces([]);
            } finally {
                setLoading(false);
            }
        };

        fetchWorkspaces();
    }, []);

    if (loading) {
        return <div>Carregando visão geral das workspaces...</div>;
    }

    if (error) {
        return <div>Erro ao carregar workspaces: {error}</div>;
    }

    return (
        <div className="container mx-auto py-6">
            <h1 className="text-2xl font-bold mb-4">Visão Geral das Workspaces (Super Admin)</h1>
            {workspaces.length === 0 ? (
                <p>Nenhuma workspace encontrada.</p>
            ) : (
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome da Workspace</TableHead>
                                <TableHead>Proprietário</TableHead>
                                <TableHead>Membros</TableHead>
                                <TableHead>Clientes</TableHead>
                                <TableHead>Processos</TableHead>
                                <TableHead>Petições</TableHead>
                                <TableHead>Execuções (Total)</TableHead>
                                <TableHead>Execuções (Ativas)</TableHead>
                                <TableHead>Execuções (Falhas)</TableHead>
                                <TableHead>Última Atividade</TableHead>
                                <TableHead>Ativa</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {workspaces.map((ws) => (
                                <TableRow key={ws.workspace_id}>
                                    <TableCell className="font-medium">{ws.workspace_name}</TableCell>
                                    <TableCell>{ws.owner_name || ws.owner_email}</TableCell>
                                    <TableCell>{ws.members_count}</TableCell>
                                    <TableCell>{ws.clients_count}</TableCell>
                                    <TableCell>{ws.processes_count}</TableCell>
                                    <TableCell>{ws.petitions_count}</TableCell>
                                    <TableCell>{ws.executions_count}</TableCell>
                                    <TableCell>{ws.active_executions_count}</TableCell>
                                    <TableCell>{ws.failed_executions_count}</TableCell>
                                    <TableCell>{ws.last_activity ? new Date(ws.last_activity).toLocaleString() : 'N/A'}</TableCell>
                                    <TableCell>{ws.is_active ? 'Sim' : 'Não'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
};
</content>
</replace_in_file>
