export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      client_interactions: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          interaction_date: string
          interaction_type: string
          metadata: Json | null
          subject: string
          workspace_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          interaction_date?: string
          interaction_type: string
          metadata?: Json | null
          subject: string
          workspace_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          interaction_date?: string
          interaction_type?: string
          metadata?: Json | null
          subject?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_interactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_interactions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: Json | null
          client_type: string | null
          created_at: string | null
          created_by: string | null
          custom_fields: Json | null
          document_number: string | null
          email: string | null
          id: string
          lead_score: number | null
          name: string
          phone: string | null
          status: string | null
          tags: string[] | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          address?: Json | null
          client_type?: string | null
          created_at?: string | null
          created_by?: string | null
          custom_fields?: Json | null
          document_number?: string | null
          email?: string | null
          id?: string
          lead_score?: number | null
          name: string
          phone?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          address?: Json | null
          client_type?: string | null
          created_at?: string | null
          created_by?: string | null
          custom_fields?: Json | null
          document_number?: string | null
          email?: string | null
          id?: string
          lead_score?: number | null
          name?: string
          phone?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_history: {
        Row: {
          contract_id: string
          created_at: string | null
          event_description: string | null
          event_timestamp: string | null
          event_type: string
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          performed_by: string | null
          signer_email: string | null
          signer_id: string | null
          signer_name: string | null
          user_agent: string | null
          workspace_id: string
        }
        Insert: {
          contract_id: string
          created_at?: string | null
          event_description?: string | null
          event_timestamp?: string | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          performed_by?: string | null
          signer_email?: string | null
          signer_id?: string | null
          signer_name?: string | null
          user_agent?: string | null
          workspace_id: string
        }
        Update: {
          contract_id?: string
          created_at?: string | null
          event_description?: string | null
          event_timestamp?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          performed_by?: string | null
          signer_email?: string | null
          signer_id?: string | null
          signer_name?: string | null
          user_agent?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_history_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_history_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_history_signer_id_fkey"
            columns: ["signer_id"]
            isOneToOne: false
            referencedRelation: "contract_signers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_history_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_signers: {
        Row: {
          address_city: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          address_zip: string | null
          auth_mode: string | null
          blank_email: boolean | null
          blank_phone: boolean | null
          civil_status: string | null
          cnpj: string | null
          contract_id: string
          cpf: string | null
          created_at: string | null
          document_photo_url: string | null
          document_verse_photo_url: string | null
          email: string
          external_id: string | null
          geo_latitude: number | null
          geo_longitude: number | null
          hide_email: boolean | null
          hide_phone: boolean | null
          id: string
          ip_address: unknown | null
          last_view_at: string | null
          liveness_photo_url: string | null
          lock_email: boolean | null
          lock_name: boolean | null
          lock_phone: boolean | null
          name: string
          phone_country: string | null
          phone_number: string | null
          profession: string | null
          qualification: string | null
          redirect_link: string | null
          require_document_photo: boolean | null
          require_selfie_photo: boolean | null
          resend_attempts: Json | null
          rg_number: string | null
          selfie_photo_url: string | null
          selfie_photo_url2: string | null
          selfie_validation_type: string | null
          send_automatic_whatsapp_signed_file: boolean | null
          send_via: string | null
          sign_url: string | null
          signature_image_url: string | null
          signed_at: string | null
          status: string
          times_viewed: number | null
          updated_at: string | null
          visto_image_url: string | null
          workspace_id: string
          zapsign_token: string
        }
        Insert: {
          address_city?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          auth_mode?: string | null
          blank_email?: boolean | null
          blank_phone?: boolean | null
          civil_status?: string | null
          cnpj?: string | null
          contract_id: string
          cpf?: string | null
          created_at?: string | null
          document_photo_url?: string | null
          document_verse_photo_url?: string | null
          email: string
          external_id?: string | null
          geo_latitude?: number | null
          geo_longitude?: number | null
          hide_email?: boolean | null
          hide_phone?: boolean | null
          id?: string
          ip_address?: unknown | null
          last_view_at?: string | null
          liveness_photo_url?: string | null
          lock_email?: boolean | null
          lock_name?: boolean | null
          lock_phone?: boolean | null
          name: string
          phone_country?: string | null
          phone_number?: string | null
          profession?: string | null
          qualification?: string | null
          redirect_link?: string | null
          require_document_photo?: boolean | null
          require_selfie_photo?: boolean | null
          resend_attempts?: Json | null
          rg_number?: string | null
          selfie_photo_url?: string | null
          selfie_photo_url2?: string | null
          selfie_validation_type?: string | null
          send_automatic_whatsapp_signed_file?: boolean | null
          send_via?: string | null
          sign_url?: string | null
          signature_image_url?: string | null
          signed_at?: string | null
          status: string
          times_viewed?: number | null
          updated_at?: string | null
          visto_image_url?: string | null
          workspace_id: string
          zapsign_token: string
        }
        Update: {
          address_city?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          auth_mode?: string | null
          blank_email?: boolean | null
          blank_phone?: boolean | null
          civil_status?: string | null
          cnpj?: string | null
          contract_id?: string
          cpf?: string | null
          created_at?: string | null
          document_photo_url?: string | null
          document_verse_photo_url?: string | null
          email?: string
          external_id?: string | null
          geo_latitude?: number | null
          geo_longitude?: number | null
          hide_email?: boolean | null
          hide_phone?: boolean | null
          id?: string
          ip_address?: unknown | null
          last_view_at?: string | null
          liveness_photo_url?: string | null
          lock_email?: boolean | null
          lock_name?: boolean | null
          lock_phone?: boolean | null
          name?: string
          phone_country?: string | null
          phone_number?: string | null
          profession?: string | null
          qualification?: string | null
          redirect_link?: string | null
          require_document_photo?: boolean | null
          require_selfie_photo?: boolean | null
          resend_attempts?: Json | null
          rg_number?: string | null
          selfie_photo_url?: string | null
          selfie_photo_url2?: string | null
          selfie_validation_type?: string | null
          send_automatic_whatsapp_signed_file?: boolean | null
          send_via?: string | null
          sign_url?: string | null
          signature_image_url?: string | null
          signed_at?: string | null
          status?: string
          times_viewed?: number | null
          updated_at?: string | null
          visto_image_url?: string | null
          workspace_id?: string
          zapsign_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_signers_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_signers_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_webhook_logs: {
        Row: {
          contract_id: string | null
          created_at: string | null
          error_message: string | null
          event_type: string
          execution_mode: string | null
          id: string
          processed_at: string | null
          processed_data: Json | null
          processing_attempts: number | null
          processing_status: string | null
          raw_payload: Json
          received_at: string | null
          request_headers: Json | null
          source_ip: unknown | null
          user_agent: string | null
          webhook_url: string | null
          workspace_id: string | null
          zapsign_open_id: number | null
          zapsign_token: string | null
        }
        Insert: {
          contract_id?: string | null
          created_at?: string | null
          error_message?: string | null
          event_type: string
          execution_mode?: string | null
          id?: string
          processed_at?: string | null
          processed_data?: Json | null
          processing_attempts?: number | null
          processing_status?: string | null
          raw_payload: Json
          received_at?: string | null
          request_headers?: Json | null
          source_ip?: unknown | null
          user_agent?: string | null
          webhook_url?: string | null
          workspace_id?: string | null
          zapsign_open_id?: number | null
          zapsign_token?: string | null
        }
        Update: {
          contract_id?: string | null
          created_at?: string | null
          error_message?: string | null
          event_type?: string
          execution_mode?: string | null
          id?: string
          processed_at?: string | null
          processed_data?: Json | null
          processing_attempts?: number | null
          processing_status?: string | null
          raw_payload?: Json
          received_at?: string | null
          request_headers?: Json | null
          source_ip?: unknown | null
          user_agent?: string | null
          webhook_url?: string | null
          workspace_id?: string | null
          zapsign_open_id?: number | null
          zapsign_token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_webhook_logs_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_webhook_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          auto_reminder: number | null
          brand_logo: string | null
          brand_primary_color: string | null
          client_id: string | null
          contract_answers: Json | null
          contract_code: string | null
          contract_name: string
          contract_type: string | null
          created_at: string | null
          created_by_email: string | null
          created_through: string | null
          deleted_at: string | null
          disable_signer_emails: boolean | null
          extra_docs: Json | null
          folder_path: string | null
          id: string
          is_deleted: boolean | null
          lang: string | null
          matched_by: string | null
          matching_confidence: number | null
          metadata: Json | null
          notes: string | null
          original_file_url: string | null
          signed_at: string | null
          signed_file_only_finished: boolean | null
          signed_file_url: string | null
          status: string
          updated_at: string | null
          workspace_id: string
          zapsign_created_at: string | null
          zapsign_open_id: number
          zapsign_template_token: string | null
          zapsign_token: string
          zapsign_updated_at: string | null
        }
        Insert: {
          auto_reminder?: number | null
          brand_logo?: string | null
          brand_primary_color?: string | null
          client_id?: string | null
          contract_answers?: Json | null
          contract_code?: string | null
          contract_name: string
          contract_type?: string | null
          created_at?: string | null
          created_by_email?: string | null
          created_through?: string | null
          deleted_at?: string | null
          disable_signer_emails?: boolean | null
          extra_docs?: Json | null
          folder_path?: string | null
          id?: string
          is_deleted?: boolean | null
          lang?: string | null
          matched_by?: string | null
          matching_confidence?: number | null
          metadata?: Json | null
          notes?: string | null
          original_file_url?: string | null
          signed_at?: string | null
          signed_file_only_finished?: boolean | null
          signed_file_url?: string | null
          status: string
          updated_at?: string | null
          workspace_id: string
          zapsign_created_at?: string | null
          zapsign_open_id: number
          zapsign_template_token?: string | null
          zapsign_token: string
          zapsign_updated_at?: string | null
        }
        Update: {
          auto_reminder?: number | null
          brand_logo?: string | null
          brand_primary_color?: string | null
          client_id?: string | null
          contract_answers?: Json | null
          contract_code?: string | null
          contract_name?: string
          contract_type?: string | null
          created_at?: string | null
          created_by_email?: string | null
          created_through?: string | null
          deleted_at?: string | null
          disable_signer_emails?: boolean | null
          extra_docs?: Json | null
          folder_path?: string | null
          id?: string
          is_deleted?: boolean | null
          lang?: string | null
          matched_by?: string | null
          matching_confidence?: number | null
          metadata?: Json | null
          notes?: string | null
          original_file_url?: string | null
          signed_at?: string | null
          signed_file_only_finished?: boolean | null
          signed_file_url?: string | null
          status?: string
          updated_at?: string | null
          workspace_id?: string
          zapsign_created_at?: string | null
          zapsign_open_id?: number
          zapsign_template_token?: string | null
          zapsign_token?: string
          zapsign_updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_field_definitions: {
        Row: {
          created_at: string
          display_order: number | null
          field_key: string
          field_label: string
          field_options: Json | null
          field_type: string
          id: string
          is_active: boolean | null
          is_required: boolean | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          field_key: string
          field_label: string
          field_options?: Json | null
          field_type: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          field_key?: string
          field_label?: string
          field_options?: Json | null
          field_type?: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_field_definitions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      deadline_history: {
        Row: {
          action: string
          created_at: string | null
          deadline_id: string
          id: string
          new_values: Json | null
          notes: string | null
          old_values: Json | null
          performed_by: string
          workspace_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          deadline_id: string
          id?: string
          new_values?: Json | null
          notes?: string | null
          old_values?: Json | null
          performed_by: string
          workspace_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          deadline_id?: string
          id?: string
          new_values?: Json | null
          notes?: string | null
          old_values?: Json | null
          performed_by?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deadline_history_deadline_id_fkey"
            columns: ["deadline_id"]
            isOneToOne: false
            referencedRelation: "deadlines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deadline_history_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deadline_history_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      deadline_notifications: {
        Row: {
          created_at: string | null
          days_before: number
          deadline_id: string
          id: string
          is_sent: boolean | null
          message: string | null
          notification_type: string
          recipient_id: string
          sent_at: string | null
          subject: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          days_before: number
          deadline_id: string
          id?: string
          is_sent?: boolean | null
          message?: string | null
          notification_type: string
          recipient_id: string
          sent_at?: string | null
          subject?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          days_before?: number
          deadline_id?: string
          id?: string
          is_sent?: boolean | null
          message?: string | null
          notification_type?: string
          recipient_id?: string
          sent_at?: string | null
          subject?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deadline_notifications_deadline_id_fkey"
            columns: ["deadline_id"]
            isOneToOne: false
            referencedRelation: "deadlines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deadline_notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deadline_notifications_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      deadlines: {
        Row: {
          anticipation_days: number | null
          assigned_to: string | null
          attachments: Json | null
          business_days_only: boolean | null
          client_id: string | null
          completed_date: string | null
          completion_notes: string | null
          created_at: string | null
          created_by: string
          created_date: string
          custom_fields: Json | null
          deadline_type: string
          description: string | null
          due_date: string
          id: string
          is_critical: boolean | null
          petition_execution_id: string | null
          petition_id: string | null
          priority: string | null
          process_id: string | null
          status: string | null
          template_id: string | null
          title: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          anticipation_days?: number | null
          assigned_to?: string | null
          attachments?: Json | null
          business_days_only?: boolean | null
          client_id?: string | null
          completed_date?: string | null
          completion_notes?: string | null
          created_at?: string | null
          created_by: string
          created_date?: string
          custom_fields?: Json | null
          deadline_type: string
          description?: string | null
          due_date: string
          id?: string
          is_critical?: boolean | null
          petition_execution_id?: string | null
          petition_id?: string | null
          priority?: string | null
          process_id?: string | null
          status?: string | null
          template_id?: string | null
          title: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          anticipation_days?: number | null
          assigned_to?: string | null
          attachments?: Json | null
          business_days_only?: boolean | null
          client_id?: string | null
          completed_date?: string | null
          completion_notes?: string | null
          created_at?: string | null
          created_by?: string
          created_date?: string
          custom_fields?: Json | null
          deadline_type?: string
          description?: string | null
          due_date?: string
          id?: string
          is_critical?: boolean | null
          petition_execution_id?: string | null
          petition_id?: string | null
          priority?: string | null
          process_id?: string | null
          status?: string | null
          template_id?: string | null
          title?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deadlines_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deadlines_petition_execution_id_fkey"
            columns: ["petition_execution_id"]
            isOneToOne: false
            referencedRelation: "petition_executions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deadlines_petition_id_fkey"
            columns: ["petition_id"]
            isOneToOne: false
            referencedRelation: "petition_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deadlines_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "petition_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deadlines_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_deadlines_assigned_to"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_deadlines_client_id"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_deadlines_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_deadlines_process_id"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      petition_executions: {
        Row: {
          client_id: string | null
          created_at: string | null
          created_by: string | null
          filled_data: Json
          final_document_url: string | null
          generated_content: string | null
          id: string
          process_id: string | null
          retry_count: number | null
          template_id: string
          updated_at: string | null
          webhook_completed_at: string | null
          webhook_response: Json | null
          webhook_sent_at: string | null
          webhook_status: string | null
          webhook_url: string | null
          workspace_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          filled_data: Json
          final_document_url?: string | null
          generated_content?: string | null
          id?: string
          process_id?: string | null
          retry_count?: number | null
          template_id: string
          updated_at?: string | null
          webhook_completed_at?: string | null
          webhook_response?: Json | null
          webhook_sent_at?: string | null
          webhook_status?: string | null
          webhook_url?: string | null
          workspace_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          filled_data?: Json
          final_document_url?: string | null
          generated_content?: string | null
          id?: string
          process_id?: string | null
          retry_count?: number | null
          template_id?: string
          updated_at?: string | null
          webhook_completed_at?: string | null
          webhook_response?: Json | null
          webhook_sent_at?: string | null
          webhook_status?: string | null
          webhook_url?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "petition_executions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "petition_executions_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "petition_executions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "petition_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "petition_executions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      petition_templates: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          execution_count: number | null
          id: string
          is_shared: boolean | null
          name: string
          template_content: string
          updated_at: string | null
          webhook_enabled: boolean | null
          webhook_url: string | null
          workspace_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          execution_count?: number | null
          id?: string
          is_shared?: boolean | null
          name: string
          template_content: string
          updated_at?: string | null
          webhook_enabled?: boolean | null
          webhook_url?: string | null
          workspace_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          execution_count?: number | null
          id?: string
          is_shared?: boolean | null
          name?: string
          template_content?: string
          updated_at?: string | null
          webhook_enabled?: boolean | null
          webhook_url?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "petition_templates_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      process_clients: {
        Row: {
          client_id: string | null
          created_at: string | null
          id: string
          process_id: string | null
          role: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          process_id?: string | null
          role?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          process_id?: string | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "process_clients_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_clients_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      processes: {
        Row: {
          assigned_lawyer: string | null
          case_value: number | null
          court: string | null
          created_at: string | null
          created_by: string | null
          deadline_date: string | null
          description: string | null
          id: string
          judge: string | null
          priority: string | null
          process_number: string
          status: string | null
          title: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          assigned_lawyer?: string | null
          case_value?: number | null
          court?: string | null
          created_at?: string | null
          created_by?: string | null
          deadline_date?: string | null
          description?: string | null
          id?: string
          judge?: string | null
          priority?: string | null
          process_number: string
          status?: string | null
          title: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          assigned_lawyer?: string | null
          case_value?: number | null
          court?: string | null
          created_at?: string | null
          created_by?: string | null
          deadline_date?: string | null
          description?: string | null
          id?: string
          judge?: string | null
          priority?: string | null
          process_number?: string
          status?: string | null
          title?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "processes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          current_workspace_id: string | null
          email: string
          full_name: string | null
          id: string
          last_login: string | null
          preferences: Json | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          current_workspace_id?: string | null
          email: string
          full_name?: string | null
          id: string
          last_login?: string | null
          preferences?: Json | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          current_workspace_id?: string | null
          email?: string
          full_name?: string | null
          id?: string
          last_login?: string | null
          preferences?: Json | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      template_fields: {
        Row: {
          created_at: string | null
          display_order: number | null
          field_key: string
          field_label: string
          field_options: Json | null
          field_type: string
          id: string
          is_required: boolean | null
          template_id: string
          validation_rules: Json | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          field_key: string
          field_label: string
          field_options?: Json | null
          field_type: string
          id?: string
          is_required?: boolean | null
          template_id: string
          validation_rules?: Json | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          field_key?: string
          field_label?: string
          field_options?: Json | null
          field_type?: string
          id?: string
          is_required?: boolean | null
          template_id?: string
          validation_rules?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "template_fields_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "petition_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activities: {
        Row: {
          activity_type: string
          created_at: string | null
          description: string
          id: string
          ip_address: unknown | null
          metadata: Json | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          description: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          description?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activities_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_calendar_settings: {
        Row: {
          city_holidays: Json | null
          created_at: string | null
          custom_holidays: Json | null
          december_recess_end: string | null
          december_recess_start: string | null
          default_anticipation_days: number | null
          enable_email_notifications: boolean | null
          enable_whatsapp_notifications: boolean | null
          id: string
          july_recess_end: string | null
          july_recess_start: string | null
          notification_time: string | null
          state_holidays: Json | null
          updated_at: string | null
          work_days: Json | null
          workspace_id: string
        }
        Insert: {
          city_holidays?: Json | null
          created_at?: string | null
          custom_holidays?: Json | null
          december_recess_end?: string | null
          december_recess_start?: string | null
          default_anticipation_days?: number | null
          enable_email_notifications?: boolean | null
          enable_whatsapp_notifications?: boolean | null
          id?: string
          july_recess_end?: string | null
          july_recess_start?: string | null
          notification_time?: string | null
          state_holidays?: Json | null
          updated_at?: string | null
          work_days?: Json | null
          workspace_id: string
        }
        Update: {
          city_holidays?: Json | null
          created_at?: string | null
          custom_holidays?: Json | null
          december_recess_end?: string | null
          december_recess_start?: string | null
          default_anticipation_days?: number | null
          enable_email_notifications?: boolean | null
          enable_whatsapp_notifications?: boolean | null
          id?: string
          july_recess_end?: string | null
          july_recess_start?: string | null
          notification_time?: string | null
          state_holidays?: Json | null
          updated_at?: string | null
          work_days?: Json | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_calendar_settings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: string
          token: string
          workspace_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role?: string
          token?: string
          workspace_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: string
          token?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_invitations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string | null
          id: string
          invited_at: string | null
          invited_by: string | null
          joined_at: string | null
          last_activity: string | null
          permissions: Json | null
          role: string
          status: string | null
          updated_at: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          last_activity?: string | null
          permissions?: Json | null
          role?: string
          status?: string | null
          updated_at?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          last_activity?: string | null
          permissions?: Json | null
          role?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_webhooks: {
        Row: {
          created_at: string | null
          created_by: string | null
          events: string[] | null
          id: string
          is_active: boolean | null
          name: string
          retry_attempts: number | null
          secret_token: string
          timeout_seconds: number | null
          updated_at: string | null
          webhook_url: string
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          events?: string[] | null
          id?: string
          is_active?: boolean | null
          name: string
          retry_attempts?: number | null
          secret_token?: string
          timeout_seconds?: number | null
          updated_at?: string | null
          webhook_url: string
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          events?: string[] | null
          id?: string
          is_active?: boolean | null
          name?: string
          retry_attempts?: number | null
          secret_token?: string
          timeout_seconds?: number | null
          updated_at?: string | null
          webhook_url?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_webhooks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          logo_url: string | null
          name: string
          owner_id: string
          slug: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          owner_id: string
          slug?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
          slug?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_business_days: {
        Args: { start_date: string; business_days: number }
        Returns: string
      }
      find_client_by_document: {
        Args: { p_workspace_id: string; p_document: string }
        Returns: {
          client_id: string
          confidence: number
          match_type: string
        }[]
      }
      find_client_by_email: {
        Args: { p_workspace_id: string; p_email: string }
        Returns: {
          client_id: string
          confidence: number
          match_type: string
        }[]
      }
      find_client_by_name: {
        Args: { p_workspace_id: string; p_name: string }
        Returns: {
          client_id: string
          confidence: number
          match_type: string
        }[]
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      increment_execution_retry_count: {
        Args: { execution_id: string }
        Returns: undefined
      }
      increment_template_execution_count: {
        Args: { template_id: string }
        Returns: undefined
      }
      is_business_day: {
        Args: { check_date: string }
        Returns: boolean
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
