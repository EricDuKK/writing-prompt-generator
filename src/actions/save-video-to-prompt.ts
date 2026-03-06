// Shim: no database saving in standalone site
export async function saveVideoToPromptAction(_data: any): Promise<any> {
  return { data: { success: true, id: crypto.randomUUID(), error: null } };
}
export async function updateVideoToPromptAction(_data: any): Promise<any> {
  return { data: { success: true, error: null } };
}
