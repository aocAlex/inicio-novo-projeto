
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const payload = await req.json()
    console.log('🔔 Webhook received:', JSON.stringify(payload, null, 2))

    // Extract key information from webhook
    const {
      open_id,
      token,
      status,
      name,
      created_at,
      updated_at,
      signed_at,
      original_file,
      signed_file,
      signers = [],
      created_by,
      extra_info = {}
    } = payload

    // Log the webhook first
    const { data: webhookLog } = await supabaseClient
      .from('contract_webhook_logs')
      .insert({
        event_type: payload.event_type || 'webhook_received',
        zapsign_open_id: open_id,
        zapsign_token: token,
        raw_payload: payload,
        processing_status: 'received',
        webhook_url: req.url,
        user_agent: req.headers.get('user-agent'),
        source_ip: req.headers.get('x-forwarded-for'),
        request_headers: Object.fromEntries(req.headers.entries())
      })
      .select()
      .single()

    // Try to find workspace by created_by email
    let workspaceId = null
    if (created_by?.email) {
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('current_workspace_id')
        .eq('email', created_by.email)
        .single()
      
      workspaceId = profile?.current_workspace_id
    }

    if (!workspaceId) {
      console.error('❌ Could not determine workspace for contract')
      return new Response(
        JSON.stringify({ error: 'Could not determine workspace' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update webhook log with workspace
    await supabaseClient
      .from('contract_webhook_logs')
      .update({ 
        workspace_id: workspaceId,
        processing_status: 'processing'
      })
      .eq('id', webhookLog.id)

    // Prepare contract data
    const contractData = {
      workspace_id: workspaceId,
      contract_name: name || 'Contrato sem nome',
      zapsign_open_id: open_id,
      zapsign_token: token,
      status: status || 'pending',
      zapsign_created_at: created_at,
      zapsign_updated_at: updated_at,
      signed_at: signed_at,
      original_file_url: original_file?.url,
      signed_file_url: signed_file?.url,
      created_by_email: created_by?.email,
      metadata: extra_info
    }

    // Upsert contract (insert or update if exists)
    const { data: contract, error: contractError } = await supabaseClient
      .from('contracts')
      .upsert(contractData, { 
        onConflict: 'zapsign_open_id',
        ignoreDuplicates: false 
      })
      .select()
      .single()

    if (contractError) {
      console.error('❌ Error upserting contract:', contractError)
      throw contractError
    }

    console.log('✅ Contract upserted:', contract.id)

    // Process signers
    for (const signer of signers) {
      const signerData = {
        contract_id: contract.id,
        workspace_id: workspaceId,
        zapsign_token: signer.token,
        external_id: signer.external_id,
        name: signer.name,
        email: signer.email,
        phone_country: signer.phone_country || '55',
        phone_number: signer.phone,
        cpf: signer.cpf,
        cnpj: signer.cnpj,
        status: signer.status || 'pending',
        sign_url: signer.sign_url,
        times_viewed: signer.times_viewed || 0,
        last_view_at: signer.last_view_at,
        signed_at: signer.signed_at,
        ip_address: signer.ip_address,
        geo_latitude: signer.geo_latitude,
        geo_longitude: signer.geo_longitude
      }

      await supabaseClient
        .from('contract_signers')
        .upsert(signerData, { 
          onConflict: 'zapsign_token',
          ignoreDuplicates: false 
        })
    }

    // Try to auto-link client
    if (signers.length > 0) {
      const primarySigner = signers[0]
      let clientId = null
      let matchedBy = null
      let confidence = 0

      // Try to find client by CPF/CNPJ
      if (primarySigner.cpf || primarySigner.cnpj) {
        const document = primarySigner.cpf || primarySigner.cnpj
        const { data: clientMatch } = await supabaseClient
          .rpc('find_client_by_document', {
            p_workspace_id: workspaceId,
            p_document: document
          })

        if (clientMatch && clientMatch.length > 0) {
          clientId = clientMatch[0].client_id
          matchedBy = clientMatch[0].match_type
          confidence = clientMatch[0].confidence
        }
      }

      // If not found, try by email
      if (!clientId && primarySigner.email) {
        const { data: clientMatch } = await supabaseClient
          .rpc('find_client_by_email', {
            p_workspace_id: workspaceId,
            p_email: primarySigner.email
          })

        if (clientMatch && clientMatch.length > 0) {
          clientId = clientMatch[0].client_id
          matchedBy = clientMatch[0].match_type
          confidence = clientMatch[0].confidence
        }
      }

      // If not found, try by name similarity
      if (!clientId && primarySigner.name) {
        const { data: clientMatch } = await supabaseClient
          .rpc('find_client_by_name', {
            p_workspace_id: workspaceId,
            p_name: primarySigner.name
          })

        if (clientMatch && clientMatch.length > 0) {
          clientId = clientMatch[0].client_id
          matchedBy = clientMatch[0].match_type
          confidence = clientMatch[0].confidence
        }
      }

      // Update contract with client link if found
      if (clientId) {
        await supabaseClient
          .from('contracts')
          .update({
            client_id: clientId,
            matched_by: matchedBy,
            matching_confidence: confidence
          })
          .eq('id', contract.id)

        console.log(`✅ Client linked: ${clientId} (${matchedBy}, ${confidence})`)
      }
    }

    // Create history entry
    await supabaseClient
      .from('contract_history')
      .insert({
        contract_id: contract.id,
        workspace_id: workspaceId,
        event_type: status === 'signed' ? 'signed' : 'updated',
        event_description: `Contract ${status} via webhook`,
        new_values: contractData,
        event_timestamp: new Date().toISOString()
      })

    // Mark webhook as processed
    await supabaseClient
      .from('contract_webhook_logs')
      .update({ 
        processing_status: 'processed',
        processed_at: new Date().toISOString(),
        contract_id: contract.id,
        processed_data: { contract_id: contract.id, client_linked: !!clientId }
      })
      .eq('id', webhookLog.id)

    console.log('✅ Webhook processed successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        contract_id: contract.id,
        message: 'Webhook processed successfully' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Webhook processing error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
