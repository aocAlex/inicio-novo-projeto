
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ZapSignWebhookPayload {
  open_id: number;
  token: string;
  status: string;
  name: string;
  created_by: {
    email: string;
  };
  signers: Array<{
    token: string;
    name: string;
    email: string;
    status: string;
    cpf?: string;
    cnpj?: string;
    phone?: string;
    // ... outros campos do signatário
  }>;
  // ... outros campos do webhook
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const payload: ZapSignWebhookPayload = await req.json()
    console.log('Webhook recebido:', payload)

    // Primeiro, registrar o webhook log
    const { data: webhookLog, error: logError } = await supabase
      .from('contract_webhook_logs')
      .insert({
        event_type: payload.status || 'unknown',
        zapsign_open_id: payload.open_id,
        zapsign_token: payload.token,
        raw_payload: payload,
        processing_status: 'received',
        webhook_url: req.url,
        execution_mode: 'production',
        user_agent: req.headers.get('user-agent'),
        source_ip: req.headers.get('x-forwarded-for') || req.headers.get('remote-addr'),
        request_headers: Object.fromEntries(req.headers.entries())
      })
      .select()
      .single()

    if (logError) {
      console.error('Erro ao registrar webhook log:', logError)
      throw logError
    }

    // Atualizar status para processando
    await supabase
      .from('contract_webhook_logs')
      .update({ processing_status: 'processing' })
      .eq('id', webhookLog.id)

    // Buscar workspace baseado no email do criador
    const { data: workspaceData } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', '(SELECT id FROM profiles WHERE email = $1)', [payload.created_by.email])
      .limit(1)
      .single()

    let workspaceId = workspaceData?.workspace_id

    // Se não encontrar workspace, usar o primeiro disponível (fallback)
    if (!workspaceId) {
      const { data: firstWorkspace } = await supabase
        .from('workspaces')
        .select('id')
        .limit(1)
        .single()
      
      workspaceId = firstWorkspace?.id
    }

    if (!workspaceId) {
      throw new Error('Nenhuma workspace encontrada')
    }

    // Verificar se o contrato já existe
    let { data: existingContract } = await supabase
      .from('contracts')
      .select('id')
      .eq('zapsign_open_id', payload.open_id)
      .single()

    let contractId = existingContract?.id

    if (!existingContract) {
      // Criar novo contrato
      const { data: newContract, error: contractError } = await supabase
        .from('contracts')
        .insert({
          workspace_id: workspaceId,
          contract_name: payload.name,
          zapsign_open_id: payload.open_id,
          zapsign_token: payload.token,
          status: payload.status,
          created_by_email: payload.created_by.email,
          metadata: payload,
          zapsign_created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (contractError) {
        throw contractError
      }

      contractId = newContract.id
    } else {
      // Atualizar contrato existente
      await supabase
        .from('contracts')
        .update({
          status: payload.status,
          metadata: payload,
          zapsign_updated_at: new Date().toISOString(),
          signed_at: payload.status === 'signed' ? new Date().toISOString() : null,
        })
        .eq('id', contractId)
    }

    // Processar signatários
    if (payload.signers && Array.isArray(payload.signers)) {
      for (const signer of payload.signers) {
        // Verificar se signatário já existe
        const { data: existingSigner } = await supabase
          .from('contract_signers')
          .select('id')
          .eq('zapsign_token', signer.token)
          .single()

        if (!existingSigner) {
          // Criar novo signatário
          await supabase
            .from('contract_signers')
            .insert({
              contract_id: contractId,
              workspace_id: workspaceId,
              zapsign_token: signer.token,
              name: signer.name,
              email: signer.email,
              status: signer.status,
              cpf: signer.cpf?.replace(/\D/g, ''),
              cnpj: signer.cnpj?.replace(/\D/g, ''),
              phone_number: signer.phone,
              signed_at: signer.status === 'signed' ? new Date().toISOString() : null,
            })
        } else {
          // Atualizar signatário existente
          await supabase
            .from('contract_signers')
            .update({
              status: signer.status,
              signed_at: signer.status === 'signed' ? new Date().toISOString() : null,
            })
            .eq('id', existingSigner.id)
        }
      }
    }

    // Tentar vinculação automática com cliente
    if (payload.signers && payload.signers.length > 0) {
      const mainSigner = payload.signers[0] // Usar primeiro signatário como principal
      let clientId = null
      let matchType = null
      let confidence = 0

      // Tentar buscar por CPF/CNPJ
      if (mainSigner.cpf) {
        const { data: clientByDoc } = await supabase
          .rpc('find_client_by_document', {
            p_workspace_id: workspaceId,
            p_document: mainSigner.cpf
          })

        if (clientByDoc && clientByDoc.length > 0) {
          clientId = clientByDoc[0].client_id
          matchType = clientByDoc[0].match_type
          confidence = clientByDoc[0].confidence
        }
      }

      // Se não encontrou por documento, tentar por email
      if (!clientId && mainSigner.email) {
        const { data: clientByEmail } = await supabase
          .rpc('find_client_by_email', {
            p_workspace_id: workspaceId,
            p_email: mainSigner.email
          })

        if (clientByEmail && clientByEmail.length > 0) {
          clientId = clientByEmail[0].client_id
          matchType = clientByEmail[0].match_type
          confidence = clientByEmail[0].confidence
        }
      }

      // Se não encontrou por email, tentar por nome
      if (!clientId && mainSigner.name) {
        const { data: clientByName } = await supabase
          .rpc('find_client_by_name', {
            p_workspace_id: workspaceId,
            p_name: mainSigner.name
          })

        if (clientByName && clientByName.length > 0) {
          clientId = clientByName[0].client_id
          matchType = clientByName[0].match_type
          confidence = clientByName[0].confidence
        }
      }

      // Se encontrou cliente, vincular ao contrato
      if (clientId) {
        await supabase
          .from('contracts')
          .update({
            client_id: clientId,
            matched_by: matchType,
            matching_confidence: confidence,
          })
          .eq('id', contractId)
      }
    }

    // Criar entrada no histórico
    await supabase
      .from('contract_history')
      .insert({
        contract_id: contractId,
        workspace_id: workspaceId,
        event_type: payload.status,
        event_description: `Contrato ${payload.status} via webhook`,
        new_values: payload,
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('remote-addr'),
        user_agent: req.headers.get('user-agent'),
      })

    // Finalizar processamento do webhook
    await supabase
      .from('contract_webhook_logs')
      .update({
        processing_status: 'processed',
        processed_at: new Date().toISOString(),
        contract_id: contractId,
        workspace_id: workspaceId,
        processed_data: {
          contract_id: contractId,
          signers_processed: payload.signers?.length || 0,
          client_linked: !!clientId
        }
      })
      .eq('id', webhookLog.id)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook processado com sucesso',
        contract_id: contractId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Erro no webhook:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
