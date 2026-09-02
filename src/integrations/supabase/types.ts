export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          changed_at: string
          changed_by: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string
          table_name: string
        }
        Insert: {
          action: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          table_name: string
        }
        Update: {
          action?: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          table_name?: string
        }
        Relationships: []
      }
      bank_accounts: {
        Row: {
          account_id: string
          account_name: string
          account_number_last4: string | null
          bank_name: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          opening_balance: number
          opening_balance_date: string
          updated_at: string
        }
        Insert: {
          account_id: string
          account_name: string
          account_number_last4?: string | null
          bank_name: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          opening_balance?: number
          opening_balance_date?: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          account_name?: string
          account_number_last4?: string | null
          bank_name?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          opening_balance?: number
          opening_balance_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_transactions: {
        Row: {
          amount: number
          bank_account_id: string
          created_at: string
          description: string
          id: string
          imported_by: string | null
          raw_row: Json | null
          reference: string | null
          txn_date: string
        }
        Insert: {
          amount: number
          bank_account_id: string
          created_at?: string
          description: string
          id?: string
          imported_by?: string | null
          raw_row?: Json | null
          reference?: string | null
          txn_date: string
        }
        Update: {
          amount?: number
          bank_account_id?: string
          created_at?: string
          description?: string
          id?: string
          imported_by?: string | null
          raw_row?: Json | null
          reference?: string | null
          txn_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      bills: {
        Row: {
          amount: number
          bill_date: string
          bill_number: string | null
          created_at: string
          created_by: string | null
          description: string
          due_date: string | null
          expense_account_id: string
          id: string
          project_id: string | null
          status: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          amount: number
          bill_date?: string
          bill_number?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          due_date?: string | null
          expense_account_id: string
          id?: string
          project_id?: string | null
          status?: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          amount?: number
          bill_date?: string
          bill_number?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          due_date?: string | null
          expense_account_id?: string
          id?: string
          project_id?: string | null
          status?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bills_expense_account_id_fkey"
            columns: ["expense_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      company_settings: {
        Row: {
          currency_code: string
          fiscal_year_start_month: number
          id: boolean
          invoice_next_number: number
          invoice_number_padding: number
          invoice_prefix: string
          updated_at: string
          updated_by: string | null
          vat_rate: number
        }
        Insert: {
          currency_code?: string
          fiscal_year_start_month?: number
          id?: boolean
          invoice_next_number?: number
          invoice_number_padding?: number
          invoice_prefix?: string
          updated_at?: string
          updated_by?: string | null
          vat_rate?: number
        }
        Update: {
          currency_code?: string
          fiscal_year_start_month?: number
          id?: boolean
          invoice_next_number?: number
          invoice_number_padding?: number
          invoice_prefix?: string
          updated_at?: string
          updated_by?: string | null
          vat_rate?: number
        }
        Relationships: []
      }
      inspections: {
        Row: {
          checklist: Json
          created_at: string
          engineer_id: string
          flagged: boolean
          id: string
          image_urls: string[]
          meta: Json
          photo_evidence: Json
          project_id: string
          remarks: string | null
          signatures: Json
          stage: string
        }
        Insert: {
          checklist?: Json
          created_at?: string
          engineer_id: string
          flagged?: boolean
          id?: string
          image_urls?: string[]
          meta?: Json
          photo_evidence?: Json
          project_id: string
          remarks?: string | null
          signatures?: Json
          stage?: string
        }
        Update: {
          checklist?: Json
          created_at?: string
          engineer_id?: string
          flagged?: boolean
          id?: string
          image_urls?: string[]
          meta?: Json
          photo_evidence?: Json
          project_id?: string
          remarks?: string | null
          signatures?: Json
          stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_lines: {
        Row: {
          amount: number
          description: string
          id: string
          invoice_id: string
          qty: number
          sort_order: number
          unit: string | null
          unit_cost: number
        }
        Insert: {
          amount?: number
          description: string
          id?: string
          invoice_id: string
          qty?: number
          sort_order?: number
          unit?: string | null
          unit_cost?: number
        }
        Update: {
          amount?: number
          description?: string
          id?: string
          invoice_id?: string
          qty?: number
          sort_order?: number
          unit?: string | null
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_lines_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          due_date: string | null
          id: string
          invoice_number: string
          issue_date: string
          quotation_id: string
          status: string
          subtotal: number
          total: number
          updated_at: string
          vat_amount: number
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          invoice_number: string
          issue_date?: string
          quotation_id: string
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          vat_amount?: number
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          issue_date?: string
          quotation_id?: string
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          vat_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          entry_date: string
          id: string
          reference: string | null
          source_id: string | null
          source_type: string | null
          status: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description: string
          entry_date?: string
          id?: string
          reference?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          entry_date?: string
          id?: string
          reference?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: string
        }
        Relationships: []
      }
      journal_lines: {
        Row: {
          account_id: string
          created_at: string
          credit: number
          debit: number
          id: string
          journal_entry_id: string
          memo: string | null
        }
        Insert: {
          account_id: string
          created_at?: string
          credit?: number
          debit?: number
          id?: string
          journal_entry_id: string
          memo?: string | null
        }
        Update: {
          account_id?: string
          created_at?: string
          credit?: number
          debit?: number
          id?: string
          journal_entry_id?: string
          memo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_lines_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          channel: string
          created_at: string
          id: string
          project_id: string
          sender_id: string
        }
        Insert: {
          body: string
          channel?: string
          created_at?: string
          id?: string
          project_id: string
          sender_id: string
        }
        Update: {
          body?: string
          channel?: string
          created_at?: string
          id?: string
          project_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          project_id: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          project_id?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          project_id?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_allocations: {
        Row: {
          amount_applied: number
          id: string
          invoice_id: string
          payment_id: string
        }
        Insert: {
          amount_applied: number
          id?: string
          invoice_id: string
          payment_id: string
        }
        Update: {
          amount_applied?: number
          id?: string
          invoice_id?: string
          payment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_allocations_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_allocations_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          client_id: string
          created_at: string
          created_by: string | null
          id: string
          method: string | null
          received_date: string
          reference: string | null
        }
        Insert: {
          amount: number
          client_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          method?: string | null
          received_date?: string
          reference?: string | null
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          method?: string | null
          received_date?: string
          reference?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      project_vendor_assignments: {
        Row: {
          amount_paid: number
          amount_payable: number | null
          assigned_by: string
          cost: number
          created_at: string
          id: string
          project_id: string
          status: string
          vendor_id: string
        }
        Insert: {
          amount_paid?: number
          amount_payable?: number | null
          assigned_by: string
          cost?: number
          created_at?: string
          id?: string
          project_id: string
          status?: string
          vendor_id: string
        }
        Update: {
          amount_paid?: number
          amount_payable?: number | null
          assigned_by?: string
          cost?: number
          created_at?: string
          id?: string
          project_id?: string
          status?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_vendor_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_vendor_assignments_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      project_view_admin_assignments: {
        Row: {
          assigned_by: string
          created_at: string
          id: string
          project_id: string
          viewer_id: string
        }
        Insert: {
          assigned_by: string
          created_at?: string
          id?: string
          project_id: string
          viewer_id: string
        }
        Update: {
          assigned_by?: string
          created_at?: string
          id?: string
          project_id?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_view_admin_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          archived: boolean
          archived_at: string | null
          archived_by: string | null
          client_id: string
          created_at: string
          description: string | null
          engineer_id: string | null
          id: string
          image_urls: string[]
          job_number: string
          location: string | null
          scheduled_date: string | null
          scheduled_end_date: string | null
          service: Database["public"]["Enums"]["service_type"]
          status: Database["public"]["Enums"]["project_status"]
          title: string
          updated_at: string
          work_comment: string | null
        }
        Insert: {
          archived?: boolean
          archived_at?: string | null
          archived_by?: string | null
          client_id: string
          created_at?: string
          description?: string | null
          engineer_id?: string | null
          id?: string
          image_urls?: string[]
          job_number?: string
          location?: string | null
          scheduled_date?: string | null
          scheduled_end_date?: string | null
          service: Database["public"]["Enums"]["service_type"]
          status?: Database["public"]["Enums"]["project_status"]
          title: string
          updated_at?: string
          work_comment?: string | null
        }
        Update: {
          archived?: boolean
          archived_at?: string | null
          archived_by?: string | null
          client_id?: string
          created_at?: string
          description?: string | null
          engineer_id?: string | null
          id?: string
          image_urls?: string[]
          job_number?: string
          location?: string | null
          scheduled_date?: string | null
          scheduled_end_date?: string | null
          service?: Database["public"]["Enums"]["service_type"]
          status?: Database["public"]["Enums"]["project_status"]
          title?: string
          updated_at?: string
          work_comment?: string | null
        }
        Relationships: []
      }
      quotation_items: {
        Row: {
          actual_cost: number | null
          amount: number
          description: string
          id: string
          qty: number
          quotation_id: string
          sort_order: number
          type: string
          unit: string | null
          unit_cost: number
        }
        Insert: {
          actual_cost?: number | null
          amount?: number
          description: string
          id?: string
          qty?: number
          quotation_id: string
          sort_order?: number
          type?: string
          unit?: string | null
          unit_cost?: number
        }
        Update: {
          actual_cost?: number | null
          amount?: number
          description?: string
          id?: string
          qty?: number
          quotation_id?: string
          sort_order?: number
          type?: string
          unit?: string | null
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotation_items_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          approval_evidence_note: string | null
          approval_evidence_url: string | null
          approved_at: string | null
          approved_by: string | null
          client_approved: boolean
          client_approved_at: string | null
          created_at: string
          engineer_id: string
          grand_total: number
          id: string
          labour: number
          meta: Json
          notes: string | null
          payment_status: string
          project_id: string
          quote_no: string | null
          status: Database["public"]["Enums"]["quotation_status"]
          subtotal: number
          updated_at: string
          vat_amount: number
          vat_rate: number
        }
        Insert: {
          approval_evidence_note?: string | null
          approval_evidence_url?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          engineer_id: string
          grand_total?: number
          id?: string
          labour?: number
          meta?: Json
          notes?: string | null
          payment_status?: string
          project_id: string
          quote_no?: string | null
          status?: Database["public"]["Enums"]["quotation_status"]
          subtotal?: number
          updated_at?: string
          vat_amount?: number
          vat_rate?: number
        }
        Update: {
          approval_evidence_note?: string | null
          approval_evidence_url?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          engineer_id?: string
          grand_total?: number
          id?: string
          labour?: number
          meta?: Json
          notes?: string | null
          payment_status?: string
          project_id?: string
          quote_no?: string | null
          status?: Database["public"]["Enums"]["quotation_status"]
          subtotal?: number
          updated_at?: string
          vat_amount?: number
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      reconciliation_matches: {
        Row: {
          bank_transaction_id: string
          id: string
          journal_line_id: string
          matched_amount: number
          matched_at: string
          matched_by: string | null
          notes: string | null
        }
        Insert: {
          bank_transaction_id: string
          id?: string
          journal_line_id: string
          matched_amount: number
          matched_at?: string
          matched_by?: string | null
          notes?: string | null
        }
        Update: {
          bank_transaction_id?: string
          id?: string
          journal_line_id?: string
          matched_amount?: number
          matched_at?: string
          matched_by?: string | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reconciliation_matches_bank_transaction_id_fkey"
            columns: ["bank_transaction_id"]
            isOneToOne: true
            referencedRelation: "bank_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_matches_journal_line_id_fkey"
            columns: ["journal_line_id"]
            isOneToOne: true
            referencedRelation: "journal_lines"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_todos: {
        Row: {
          activity: string
          created_at: string
          created_by: string | null
          id: string
          is_done: boolean
          location: string | null
          staff_user_id: string
          todo_date: string
          updated_at: string
        }
        Insert: {
          activity: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_done?: boolean
          location?: string | null
          staff_user_id: string
          todo_date: string
          updated_at?: string
        }
        Update: {
          activity?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_done?: boolean
          location?: string | null
          staff_user_id?: string
          todo_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendor_payment_allocations: {
        Row: {
          amount_applied: number
          bill_id: string
          id: string
          vendor_payment_id: string
        }
        Insert: {
          amount_applied: number
          bill_id: string
          id?: string
          vendor_payment_id: string
        }
        Update: {
          amount_applied?: number
          bill_id?: string
          id?: string
          vendor_payment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_payment_allocations_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_payment_allocations_vendor_payment_id_fkey"
            columns: ["vendor_payment_id"]
            isOneToOne: false
            referencedRelation: "vendor_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          id: string
          method: string | null
          paid_date: string
          reference: string | null
          vendor_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          id?: string
          method?: string | null
          paid_date?: string
          reference?: string | null
          vendor_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          method?: string | null
          paid_date?: string
          reference?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_payments_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          category: string
          contact_person: string
          cost: number | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          name: string
          payment_history: string | null
          phone: string
          services_offered: string | null
          whatsapp_phone: string | null
        }
        Insert: {
          category: string
          contact_person: string
          cost?: number | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name: string
          payment_history?: string | null
          phone: string
          services_offered?: string | null
          whatsapp_phone?: string | null
        }
        Update: {
          category?: string
          contact_person?: string
          cost?: number | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name?: string
          payment_history?: string | null
          phone?: string
          services_offered?: string | null
          whatsapp_phone?: string | null
        }
        Relationships: []
      }
      whatsapp_logs: {
        Row: {
          body: string
          created_at: string
          id: string
          message_type: string | null
          meta: Json | null
          project_id: string | null
          recipient: string | null
          recipient_phone: string | null
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          message_type?: string | null
          meta?: Json | null
          project_id?: string | null
          recipient?: string | null
          recipient_phone?: string | null
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          message_type?: string | null
          meta?: Json | null
          project_id?: string | null
          recipient?: string | null
          recipient_phone?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      work_tasks: {
        Row: {
          assignee: string | null
          created_at: string
          end_date: string | null
          id: string
          notes: string | null
          project_id: string
          start_date: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
        }
        Insert: {
          assignee?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          project_id: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
        }
        Update: {
          assignee?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          project_id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      worksheets: {
        Row: {
          client_name: string | null
          created_at: string
          engineer_id: string
          id: string
          images_before: Json
          job_date: string | null
          job_description: string | null
          job_location: string | null
          job_no: string | null
          job_type: string | null
          observations: Json
          person_in_charge: string | null
          project_id: string
          signatures: Json
          technician: string | null
          updated_at: string
        }
        Insert: {
          client_name?: string | null
          created_at?: string
          engineer_id: string
          id?: string
          images_before?: Json
          job_date?: string | null
          job_description?: string | null
          job_location?: string | null
          job_no?: string | null
          job_type?: string | null
          observations?: Json
          person_in_charge?: string | null
          project_id: string
          signatures?: Json
          technician?: string | null
          updated_at?: string
        }
        Update: {
          client_name?: string | null
          created_at?: string
          engineer_id?: string
          id?: string
          images_before?: Json
          job_date?: string | null
          job_description?: string | null
          job_location?: string | null
          job_no?: string | null
          job_type?: string | null
          observations?: Json
          person_in_charge?: string | null
          project_id?: string
          signatures?: Json
          technician?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "worksheets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_project_job_number: { Args: never; Returns: string }
      get_my_roles: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      next_invoice_number: { Args: never; Returns: string }
    }
    Enums: {
      app_role:
        | "client"
        | "engineer"
        | "admin"
        | "mini_admin"
        | "accountant"
        | "project_view_admin"
      project_status:
        | "requested"
        | "inspected"
        | "quoted"
        | "approved"
        | "scheduled"
        | "in_progress"
        | "completed"
        | "rejected"
      quotation_status: "draft" | "sent" | "approved" | "rejected"
      service_type:
        | "electrical"
        | "plumbing"
        | "landscaping"
        | "painting"
        | "property_management"
        | "tank_cleaning"
        | "renovation"
        | "solar_installation"
        | "cctv_installation"
        | "electric_fence"
        | "civil_works"
        | "property_repairs"
        | "security_systems"
      task_status: "pending" | "in_progress" | "done" | "blocked"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: [
        "client",
        "engineer",
        "admin",
        "mini_admin",
        "accountant",
        "project_view_admin",
      ],
      project_status: [
        "requested",
        "inspected",
        "quoted",
        "approved",
        "scheduled",
        "in_progress",
        "completed",
        "rejected",
      ],
      quotation_status: ["draft", "sent", "approved", "rejected"],
      service_type: [
        "electrical",
        "plumbing",
        "landscaping",
        "painting",
        "property_management",
        "tank_cleaning",
        "renovation",
        "solar_installation",
        "cctv_installation",
        "electric_fence",
        "civil_works",
        "property_repairs",
        "security_systems",
      ],
      task_status: ["pending", "in_progress", "done", "blocked"],
    },
  },
} as const
