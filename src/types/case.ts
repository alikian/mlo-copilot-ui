export type UserRole = 'broker' | 'mlo' | 'assistant'
export type CaseStatus =
  | 'intake'
  | 'submitted'
  | 'approved'
  | 'denied'
  | 'withdrawn'
  | 'stalled'

export type DealPurpose = 'purchase' | 'refi' | 'cash_out'
export type Occupancy = 'primary' | 'second' | 'investment'
export type PropertyType =
  | 'sfr'
  | 'condo'
  | 'townhome'
  | '2-4_unit'
  | 'manufactured'
  | 'other'

export type UnknownNumber = number | 'unknown'

export type Citizenship =
  | 'us_citizen'
  | 'permanent_resident'
  | 'non_permanent_resident'
  | 'unknown'

export type IncomeType =
  | 'w2'
  | '1099'
  | 'self_employed'
  | 'retired'
  | 'mixed'
  | 'unknown'

export type RiskSeverity = 'low' | 'medium' | 'high'

export type CopilotRetrieverBackend = 'pinecone' | 'opensearch'

export type OutcomeAUS = 'approve' | 'eligible' | 'refer' | 'ineligible' | 'unknown'
export type OutcomeDecision = 'approved' | 'denied' | 'pending' | 'unknown'

export type CaseDetail = {
  case_id: string
  created_at: string
  updated_at: string
  created_by: { user_id: string; role: UserRole }
  status: CaseStatus
  deal: {
    purpose: DealPurpose
    occupancy: Occupancy
    property_type: PropertyType
    state: string
    target_close_days: number
  }
  borrowers: Array<{
    borrower_id: string
    is_primary: boolean
    credit_score_mid: UnknownNumber
    citizenship: Citizenship
    employment: {
      income_type: IncomeType
      job_time_months: UnknownNumber
      self_employed_time_months: UnknownNumber
    }
  }>
  income: {
    monthly_gross_income: UnknownNumber
    income_notes: string
    documents_seen: string[]
  }
  assets: {
    down_payment_amount: UnknownNumber
    reserves_months: UnknownNumber
    gift_funds: boolean | 'unknown'
    gift_amount: UnknownNumber
  }
  liabilities: {
    monthly_debts_total: UnknownNumber
    current_housing_payment: UnknownNumber
    future_housing_payment_est: UnknownNumber
    notes: string
  }
  property: {
    purchase_price: UnknownNumber
    estimated_value: UnknownNumber
    loan_amount: UnknownNumber
    hoa_dues_monthly: UnknownNumber
  }
  calculations: {
    ltv: UnknownNumber
    front_dti: UnknownNumber
    back_dti: UnknownNumber
    math?: {
      ltv?: string
      front_dti?: string
      back_dti?: string
    }
  }
  risk_flags: Array<{ code: string; severity: RiskSeverity; details: string }>
  copilot: {
    suggested_directions: Array<{ option: string; confidence: number; why: string[] }>
    questions_to_ask_next: string[]
    doc_checklist: string[]
    guideline_citations: Array<{
      doc_id: string
      section: string
      quote: string
      retrieval_confidence: number
      retriever_backend?: CopilotRetrieverBackend
      snippet_hash?: string
      retrieved_at?: string
    }>
  }
  human_decision: {
    selected_path: string
    notes: string
  }
  outcome: {
    aus: OutcomeAUS
    decision: OutcomeDecision
    conditions: string[]
    denial_reasons: string[]
    final_lender: string | 'unknown'
    closed_date: string | null
  }
}
