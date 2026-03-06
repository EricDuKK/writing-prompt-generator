// Shim: no auth in standalone site
export const authClient = {
  useSession: () => ({
    data: { user: { id: 'anonymous', name: 'Guest' } },
  }),
};
