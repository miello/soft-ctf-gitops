export const GlobalNamespaceEnum = {
  ARGO_CD: 'argocd',
  TRAEFIK: 'traefik',
  CERT_MANAGER: 'cert-manager',
  KUBE_SYSTEM: 'kube-system',
} as const
export type GlobalNamespaceEnum = (typeof GlobalNamespaceEnum)[keyof typeof GlobalNamespaceEnum]

export const ChallengeNamespaceEnum = {
  SOFTCTF_ARE_YOU_READY: 'softctf-are-you-ready',
  SOFTCTF_CUSTOMER_SUPPORT: 'softctf-customer-support',
  SOFTCTF_GLOSSARY_SHOP: 'softctf-glossary-shop',
  SOFTCTF_GUESS_FILE_CONTENT: 'softctf-guess-file-content',
  SOFTCTF_SIMPLE_MATH: 'softctf-simple-math',
  SOFTCTF_BARQR_CAPMOO: 'softctf-barqr-capmoo',
  SOFTCTF_SECURE_SECRET: 'softctf-secure-secret',
  SOFTCTF_SUPER_SECURE_SECRET: 'softctf-super-secure-secret',
} as const
export type ChallengeNamespaceEnum = (typeof ChallengeNamespaceEnum)[keyof typeof ChallengeNamespaceEnum]