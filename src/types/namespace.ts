export const GlobalNamespaceEnum = {
  ARGO_CD: 'argocd',
  INGRESS_NGINX: 'ingress-nginx',
  TRAEFIK: 'traefik',
  CERT_MANAGER: 'cert-manager',
  KUBE_SYSTEM: 'kube-system',
  SOFTCTF_GLOBAL: 'softctf',
} as const
export type GlobalNamespaceEnum = (typeof GlobalNamespaceEnum)[keyof typeof GlobalNamespaceEnum]
