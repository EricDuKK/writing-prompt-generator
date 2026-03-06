// Shim: no database saving
export async function saveDescribeImageAction(_data: any): Promise<any> {
  return { data: { success: true, id: crypto.randomUUID(), error: null } };
}
