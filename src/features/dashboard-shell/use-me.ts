import { useQuery, useQueryClient } from "@tanstack/react-query"
import { authApi } from "@/api/auth"
import type { UserSummary } from "@/api/types"

export const meQueryKey = ["me"] as const

/**
 * 当前登录用户（唯一数据源；401 即未登录，api-client 已统一跳转）。
 * 初始请求失败（未登录）不重试、不 toast。
 */
export function useMe() {
  return useQuery({
    queryKey: meQueryKey,
    queryFn: authApi.me,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })
}

export function useSetMe() {
  const qc = useQueryClient()
  return (user: UserSummary) => qc.setQueryData(meQueryKey, user)
}

export function useClearMe() {
  const qc = useQueryClient()
  return () => {
    qc.setQueryData(meQueryKey, null)
    qc.invalidateQueries()
  }
}
