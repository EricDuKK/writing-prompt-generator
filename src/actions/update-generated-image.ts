// Shim: no database updating in standalone site
export async function updateGeneratedImageAction(_data: any): Promise<any> {
  return { data: { success: true, error: null } };
}
