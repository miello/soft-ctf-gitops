import { App, Chart, Size } from 'cdk8s'
import imageInfo from '../images/customer-support.json'
import {
  Secret,
  Deployment,
  ImagePullPolicy,
  Cpu,
  Service,
  ServiceType,
  Ingress,
  IngressBackend,
  TlsSecret,
} from 'cdk8s-plus-33'
import { Application } from '../../imports/argocd-application-argoproj.io'
import { REPOSITORY_URL } from '../constants'
import { GlobalNamespaceEnum } from '../types/namespace'

const image = imageInfo['softctf-customer-support']['image']
const tag = imageInfo['softctf-customer-support']['tag']

export const applyCustomerSupportTemplate = (
  app: App,
  rootChart: Chart,
  projectName: string,
) => {
  new Application(rootChart, 'argo-cd-application-customer-support', {
    metadata: {
      name: 'softctf-customer-support',
      namespace: 'argocd',
    },
    spec: {
      destination: {
        namespace: GlobalNamespaceEnum.SOFTCTF_GLOBAL,
        server: 'https://kubernetes.default.svc',
      },
      project: projectName,
      source: {
        repoUrl: REPOSITORY_URL,
        targetRevision: 'main',
        path: 'dist/softctf-customer-support',
      },
      syncPolicy: {
        syncOptions: ['CreateNamespace=true'],
        automated: {
          prune: true,
          selfHeal: true,
        },
      },
    },
  })

  const chart = new Chart(app, 'softctf-customer-support', {
    namespace: GlobalNamespaceEnum.SOFTCTF_GLOBAL,
  })

  const kubeDeployment = new Deployment(
    chart,
    'customer-support-deployment',
    {
      metadata: {
        name: 'customer-support-app',
      },
      replicas: 3,
      containers: [
        {
          image: `${image}:${tag}`,
          name: 'customer-support-app',
          ports: [{ number: 80 }],
          imagePullPolicy: ImagePullPolicy.IF_NOT_PRESENT,
          resources: {
            cpu: {
              limit: Cpu.millis(100),
              request: Cpu.millis(50),
            },
            memory: {
              limit: Size.mebibytes(128),
              request: Size.mebibytes(64),
            },
          },
          securityContext: {
            ensureNonRoot: true,
            user: 1000,
            readOnlyRootFilesystem: true,
          },
        },
      ],
      dockerRegistryAuth: Secret.fromSecretName(chart, 'regcred', 'regcred'),
    },
  )

  const service = new Service(chart, 'customer-support-service', {
    metadata: {
      name: 'customer-support-service',
      namespace: GlobalNamespaceEnum.SOFTCTF_GLOBAL,
    },
    type: ServiceType.CLUSTER_IP,
    selector: kubeDeployment,
    ports: [
      {
        port: 80,
        targetPort: 80,
        name: 'http',
      },
    ],
  })

  new Ingress(chart, 'customer-support-ingress', {
    metadata: {
      name: 'customer-support-ingress',
      namespace: GlobalNamespaceEnum.SOFTCTF_GLOBAL,
      annotations: {
        'cert-manager.io/cluster-issuer': 'letsencrypt-softctf',
        'nginx.ingress.kubernetes.io/force-ssl-redirect': 'true',
      }
    },
    className: 'nginx',
    tls: [
      {
        hosts: ['softctf-customer-support.miello.dev'],
        secret: TlsSecret.fromSecretName(chart, 'customer-support-tls', 'customer-support-tls'),
      },
    ],
    rules: [
      {
        host: 'softctf-customer-support.miello.dev',
        backend: IngressBackend.fromService(service),
      },
    ],
  })

  return {
    service,
  }
}
