import { App, Chart, Size } from 'cdk8s'
import imageInfo from '../images/guess-file-content.json'
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

const image = imageInfo['softctf-guess-file-content']['image']
const tag = imageInfo['softctf-guess-file-content']['tag']

export const applyGuessFileContentTemplate = (
  app: App,
  rootChart: Chart,
  projectName: string,
) => {
  new Application(rootChart, 'argo-cd-application-guess-file-content', {
    metadata: {
      name: 'softctf-guess-file-content',
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
        path: 'dist/softctf-guess-file-content',
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

  const chart = new Chart(app, 'softctf-guess-file-content', {
    namespace: GlobalNamespaceEnum.SOFTCTF_GLOBAL,
  })

  const kubeDeployment = new Deployment(
    chart,
    'guess-file-content-deployment',
    {
      metadata: {
        name: 'guess-file-content-app',
      },
      replicas: 3,
      containers: [
        {
          image: `${image}:${tag}`,
          name: 'guess-file-content-app',
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
            readOnlyRootFilesystem: false,
            user: 1000,
          },
        },
      ],
      dockerRegistryAuth: Secret.fromSecretName(chart, 'regcred', 'regcred'),
    },
  )

  const service = new Service(chart, 'guess-file-content-service', {
    metadata: {
      name: 'guess-file-content-service',
      namespace: GlobalNamespaceEnum.SOFTCTF_GLOBAL,
    },
    type: ServiceType.CLUSTER_IP,
    selector: kubeDeployment,
    ports: [
      {
        port: 80,
        targetPort: 8080,
        name: 'tcp',
      },
    ],
  })

  new Ingress(chart, 'guess-file-content-ingress', {
    metadata: {
      name: 'guess-file-content-ingress',
      namespace: GlobalNamespaceEnum.SOFTCTF_GLOBAL,
    },
    className: 'nginx',
    rules: [
      {
        host: 'softctf-guess-file-content.miello.dev',
        backend: IngressBackend.fromService(service),
      },
    ],
  })

  return {
    service,
  }
}
