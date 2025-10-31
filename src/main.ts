import { App, Chart, YamlOutputType } from 'cdk8s'
import { AppProject } from '../imports/argocd-appproject-argoproj.io'
import { GlobalNamespaceEnum } from './types/namespace'
import { applyAreYouRealTemplate } from './templates/are-you-real'
import { applyBarQRCapmooTemplate } from './templates/barqr-capmoo'
import { applySecureSecretTemplate } from './templates/secure-secret'
import { applySimpleMathTemplate } from './templates/simple-math'
import { applySuperSecureSecretTemplate } from './templates/super-secure-secret'
import { ConfigMap, Ingress, IngressBackend, Protocol, Service, ServiceType } from 'cdk8s-plus-33'

const app = new App({
  yamlOutputType: YamlOutputType.FOLDER_PER_CHART_FILE_PER_RESOURCE,
  outdir: 'dist',
})

const appChart = new Chart(app, 'softctf-root')

const mainProject = new AppProject(appChart, 'argo-cd-project', {
  metadata: {
    name: 'argocd',
    namespace: 'argocd',
  },
  spec: {
    clusterResourceWhitelist: [{ group: '*', kind: '*' }],
    sourceRepos: ['*'],
    destinations: [
      { namespace: 'argocd', server: 'https://kubernetes.default.svc' },
      { namespace: 'kube-system', server: 'https://kubernetes.default.svc' },
      { namespace: 'cert-manager', server: 'https://kubernetes.default.svc' },
      { namespace: 'traefik', server: 'https://kubernetes.default.svc' },
      { namespace: GlobalNamespaceEnum.INGRESS_NGINX, server: 'https://kubernetes.default.svc' },
      { namespace: GlobalNamespaceEnum.SOFTCTF_GLOBAL, server: 'https://kubernetes.default.svc' },
    ],
  },
})

const areYouRealResult = applyAreYouRealTemplate(app, appChart, mainProject.name)
const barQRCapMooResult = applyBarQRCapmooTemplate(app, appChart, mainProject.name)
const secureSecretResult = applySecureSecretTemplate(app, appChart, mainProject.name)
const simpleMathResult = applySimpleMathTemplate(app, appChart, mainProject.name)
const superSecureSecretResult = applySuperSecureSecretTemplate(app, appChart, mainProject.name)

new ConfigMap(appChart, 'softctf-tcp-ingress-configmap', {
  metadata: {
    name: 'softctf-tcp-ingress-configmap',
    namespace: GlobalNamespaceEnum.INGRESS_NGINX,
  },
  data: {
    8081: 'softctf/are-you-real-service:8081',
    8082: 'softctf/secure-secret-service:8082',
    8083: 'softctf/super-secure-secret-service:8083',
    8084: 'softctf/simple-math-service:8084',
    8085: 'softctf/barqr-capmoo-service:8085',
  }
})

const ingressService = new Service(appChart, 'softctf-ingress-service', {
  metadata: {
    name: 'softctf-ingress-service',
    namespace: GlobalNamespaceEnum.INGRESS_NGINX,
    labels: {
      'app.kubernetes.io/name': 'ingress-nginx',
      'app.kubernetes.io/part-of': 'ingress-nginx'
    }
  },
  type: ServiceType.LOAD_BALANCER,
  ports: [
    {
      port: 8081,
      targetPort: 8081,
      name: 'are-you-real',
      protocol: Protocol.TCP
    },
    {
      port: 8082,
      targetPort: 8082,
      name: 'secure-secret',
      protocol: Protocol.TCP
    },
    {
      port: 8083,
      targetPort: 8083,
      name: 'super-secure-secret',
      protocol: Protocol.TCP
    },
    {
      port: 8084,
      targetPort: 8084,
      name: 'simple-math',
      protocol: Protocol.TCP
    },
    {
      port: 8085,
      targetPort: 8085,
      name: 'barqr-capmoo',
      protocol: Protocol.TCP
    }
  ]
})

ingressService.selectLabel( 'app.kubernetes.io/name', 'ingress-nginx' )
ingressService.selectLabel( 'app.kubernetes.io/part-of', 'ingress-nginx' )

app.synth()

