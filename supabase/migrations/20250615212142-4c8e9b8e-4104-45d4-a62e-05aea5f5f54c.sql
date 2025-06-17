
-- Enable RLS and create policies for contracts table
-- This will allow users to create and manage contracts within their workspace

-- Create policy for SELECT operations
CREATE POLICY "Users can view contracts in their workspace" ON public.contracts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.workspaces w 
            WHERE w.id = contracts.workspace_id 
            AND (
                w.owner_id = auth.uid() 
                OR EXISTS (
                    SELECT 1 FROM public.workspace_members wm 
                    WHERE wm.workspace_id = w.id 
                    AND wm.user_id = auth.uid()
                )
            )
        )
    );

-- Create policy for INSERT operations
CREATE POLICY "Users can create contracts in their workspace" ON public.contracts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.workspaces w 
            WHERE w.id = contracts.workspace_id 
            AND (
                w.owner_id = auth.uid() 
                OR EXISTS (
                    SELECT 1 FROM public.workspace_members wm 
                    WHERE wm.workspace_id = w.id 
                    AND wm.user_id = auth.uid()
                )
            )
        )
    );

-- Create policy for UPDATE operations
CREATE POLICY "Users can update contracts in their workspace" ON public.contracts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.workspaces w 
            WHERE w.id = contracts.workspace_id 
            AND (
                w.owner_id = auth.uid() 
                OR EXISTS (
                    SELECT 1 FROM public.workspace_members wm 
                    WHERE wm.workspace_id = w.id 
                    AND wm.user_id = auth.uid()
                )
            )
        )
    );

-- Create policy for DELETE operations
CREATE POLICY "Users can delete contracts in their workspace" ON public.contracts
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.workspaces w 
            WHERE w.id = contracts.workspace_id 
            AND (
                w.owner_id = auth.uid() 
                OR EXISTS (
                    SELECT 1 FROM public.workspace_members wm 
                    WHERE wm.workspace_id = w.id 
                    AND wm.user_id = auth.uid()
                )
            )
        )
    );

-- Also create policies for contract_signers table if it doesn't have them
CREATE POLICY "Users can view contract signers in their workspace" ON public.contract_signers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.workspaces w 
            WHERE w.id = contract_signers.workspace_id 
            AND (
                w.owner_id = auth.uid() 
                OR EXISTS (
                    SELECT 1 FROM public.workspace_members wm 
                    WHERE wm.workspace_id = w.id 
                    AND wm.user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can create contract signers in their workspace" ON public.contract_signers
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.workspaces w 
            WHERE w.id = contract_signers.workspace_id 
            AND (
                w.owner_id = auth.uid() 
                OR EXISTS (
                    SELECT 1 FROM public.workspace_members wm 
                    WHERE wm.workspace_id = w.id 
                    AND wm.user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can update contract signers in their workspace" ON public.contract_signers
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.workspaces w 
            WHERE w.id = contract_signers.workspace_id 
            AND (
                w.owner_id = auth.uid() 
                OR EXISTS (
                    SELECT 1 FROM public.workspace_members wm 
                    WHERE wm.workspace_id = w.id 
                    AND wm.user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can delete contract signers in their workspace" ON public.contract_signers
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.workspaces w 
            WHERE w.id = contract_signers.workspace_id 
            AND (
                w.owner_id = auth.uid() 
                OR EXISTS (
                    SELECT 1 FROM public.workspace_members wm 
                    WHERE wm.workspace_id = w.id 
                    AND wm.user_id = auth.uid()
                )
            )
        )
    );

-- Create policies for contract_history table
CREATE POLICY "Users can view contract history in their workspace" ON public.contract_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.workspaces w 
            WHERE w.id = contract_history.workspace_id 
            AND (
                w.owner_id = auth.uid() 
                OR EXISTS (
                    SELECT 1 FROM public.workspace_members wm 
                    WHERE wm.workspace_id = w.id 
                    AND wm.user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can create contract history in their workspace" ON public.contract_history
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.workspaces w 
            WHERE w.id = contract_history.workspace_id 
            AND (
                w.owner_id = auth.uid() 
                OR EXISTS (
                    SELECT 1 FROM public.workspace_members wm 
                    WHERE wm.workspace_id = w.id 
                    AND wm.user_id = auth.uid()
                )
            )
        )
    );

-- Create policies for contract_webhook_logs table
CREATE POLICY "Users can view webhook logs in their workspace" ON public.contract_webhook_logs
    FOR SELECT USING (
        workspace_id IS NULL OR EXISTS (
            SELECT 1 FROM public.workspaces w 
            WHERE w.id = contract_webhook_logs.workspace_id 
            AND (
                w.owner_id = auth.uid() 
                OR EXISTS (
                    SELECT 1 FROM public.workspace_members wm 
                    WHERE wm.workspace_id = w.id 
                    AND wm.user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can create webhook logs in their workspace" ON public.contract_webhook_logs
    FOR INSERT WITH CHECK (
        workspace_id IS NULL OR EXISTS (
            SELECT 1 FROM public.workspaces w 
            WHERE w.id = contract_webhook_logs.workspace_id 
            AND (
                w.owner_id = auth.uid() 
                OR EXISTS (
                    SELECT 1 FROM public.workspace_members wm 
                    WHERE wm.workspace_id = w.id 
                    AND wm.user_id = auth.uid()
                )
            )
        )
    );
