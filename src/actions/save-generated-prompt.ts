// Shim: no database saving in standalone site
export async function saveGeneratedPromptAction(_data: any) {
  return { data: { success: true, id: crypto.randomUUID(), error: null } } as any;
}
