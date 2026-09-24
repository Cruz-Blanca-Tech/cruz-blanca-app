import re

query_file = 'src/features/triaje/hooks/use-triaje-queries.ts'
with open(query_file, 'r', encoding='utf-8') as f:
    s_content = f.read()

replacement = '''
export function useCaseDocuments(
  batchId: string | undefined,
  dniRef: string | undefined
) {
  return useQuery({
    queryKey: triajeKeys.caseDocuments(batchId ?? '', dniRef ?? ''),
    queryFn: () =>
      caseCorrectionService.getCaseDocuments(batchId as string, dniRef as string),
    enabled: Boolean(batchId) && Boolean(dniRef),
    staleTime: FIVE_MINUTES,
    refetchInterval: (query) => {
      const pending = query.state.data?.pending_documents?.length ?? 0;
      return pending > 0 ? 3000 : false;
    }
  });
}
'''

s_content = re.sub(
    r'export function useCaseDocuments\(\s*batchId: string \| undefined,\s*dniRef: string \| undefined\s*\) \{\s*return useQuery\(\{\s*queryKey: triajeKeys\.caseDocuments\(batchId \?\? \'\', dniRef \?\? \'\'\),\s*queryFn: \(\) =>\s*caseCorrectionService\.getCaseDocuments\(batchId as string, dniRef as string\),\s*enabled: Boolean\(batchId\) && Boolean\(dniRef\),\s*staleTime: FIVE_MINUTES,\s*\}\);\s*\}',
    replacement.strip(),
    s_content
)

with open(query_file, 'w', encoding='utf-8') as f:
    f.write(s_content)
