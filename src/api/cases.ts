import { apiClient } from './client'
import type { CaseDetail } from '@/types/case'

function findArrayDeep(value: any, depth = 0): any[] | null {
  if (depth > 5) return null
  if (Array.isArray(value)) return value
  if (!value || typeof value !== 'object') return null

  for (const key of ['cases', 'items', 'results', 'data']) {
    if ((value as any)[key] !== undefined) {
      const found = findArrayDeep((value as any)[key], depth + 1)
      if (found) return found
    }
  }

  const values = Object.values(value as Record<string, any>)
  if (values.length && values.every((v) => v && typeof v === 'object' && 'case_id' in v)) {
    return values
  }

  for (const v of values) {
    const found = findArrayDeep(v, depth + 1)
    if (found) return found
  }

  return null
}

function unwrapCaseDetail(payload: any): CaseDetail {
  if (payload && typeof payload === 'object') {
    if ('case_id' in payload) return payload as CaseDetail

    for (const key of ['case', 'item', 'result', 'data', 'case_detail', 'payload']) {
      const v = (payload as any)[key]
      if (v && typeof v === 'object' && 'case_id' in v) return v as CaseDetail
    }
  }
  throw new Error('Unexpected case detail response shape')
}

export async function listCases(tenantId: string, status?: string): Promise<CaseDetail[]> {
  const res = await apiClient.get(`/tenants/${tenantId}/cases`, {
    params: status ? { status } : undefined,
  })
  const data = res.data
  const found = findArrayDeep(data)
  if (found) return found as CaseDetail[]
  return []
}

export async function createCase(tenantId: string, payload: Partial<CaseDetail>): Promise<CaseDetail> {
  const res = await apiClient.post(`/tenants/${tenantId}/cases`, payload)
  return unwrapCaseDetail(res.data)
}

export async function getCase(tenantId: string, caseId: string): Promise<CaseDetail> {
  const res = await apiClient.get(`/tenants/${tenantId}/cases/${caseId}`)
  return unwrapCaseDetail(res.data)
}

export async function patchCase(
  tenantId: string,
  caseId: string,
  patchPayload: Partial<CaseDetail>,
): Promise<CaseDetail> {
  const res = await apiClient.patch(`/tenants/${tenantId}/cases/${caseId}`, patchPayload)
  return unwrapCaseDetail(res.data)
}

export async function calculate(tenantId: string, caseId: string): Promise<any> {
  const res = await apiClient.post(`/tenants/${tenantId}/cases/${caseId}/calculate`)
  return res.data
}

export async function guidelinesQuery(
  tenantId: string,
  caseId: string,
  input: { question: string; backend?: 'auto' | 'pinecone' | 'opensearch'; filters?: any },
): Promise<any> {
  const res = await apiClient.post(`/tenants/${tenantId}/cases/${caseId}/guidelines/query`, input)
  return res.data
}

export async function snapshot(tenantId: string, caseId: string): Promise<any> {
  const res = await apiClient.post(`/tenants/${tenantId}/cases/${caseId}/snapshot`)
  return res.data
}

export async function updateOutcome(tenantId: string, caseId: string, payload: CaseDetail['outcome']): Promise<any> {
  const res = await apiClient.post(`/tenants/${tenantId}/cases/${caseId}/outcome`, payload)
  return res.data
}
