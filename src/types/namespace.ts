export const GlobalNamespaceEnum = {
  ARGO_CD: 'argocd',
  TRAEFIK: 'traefik',
  CERT_MANAGER: 'cert-manager',
  KUBE_SYSTEM: 'kube-system',
} as const
export type GlobalNamespaceEnum = (typeof GlobalNamespaceEnum)[keyof typeof GlobalNamespaceEnum]

export const ChallengeNamespaceEnum = {
  SOFTCTF_ARE_YOU_READY: 'soft-ctf-are-you-ready',
  SOFTCTF_CUSTOMER_SUPPORT: 'soft-ctf-customer-support',
  SOFTCTF_GLOSSARY_SHOP: 'soft-ctf-glossary-shop',
  SOFTCTF_GUESS_FILE_CONTENT: 'soft-ctf-guess-file-content',
  SOFTCTF_SIMPLE_MATH: 'soft-ctf-simple-math',
  SOFTCTF_BARQR_CAPMOO: 'soft-ctf-barqr-capmoo',
  SOFTCTF_SECURE_SECRET: 'soft-ctf-secure-secret',
  SOFTCTF_SUPER_SECURE_SECRET: 'soft-ctf-super-secure-secret',
} as const
export type ChallengeNamespaceEnum = (typeof ChallengeNamespaceEnum)[keyof typeof ChallengeNamespaceEnum]