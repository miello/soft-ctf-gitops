import { App, Chart, Size } from 'cdk8s'
import { GlobalNamespaceEnum } from '../types/namespace'
import imageInfo from '../images/barqr-capmoo.json'
import { Application } from '../../imports/argocd-application-argoproj.io'
import { REPOSITORY_URL } from '../constants'
import {
  Cpu,
  Deployment,
  Env,
  ImagePullPolicy,
  Secret,
  Service,
  ServiceType,
} from 'cdk8s-plus-33'

const image = imageInfo['softctf-barqr-capmoo']['image']
const tag = imageInfo['softctf-barqr-capmoo']['tag']

export const applyBarQRCapmooTemplate = (
  app: App,
  rootChart: Chart,
  projectName: string,
) => {
  new Application(rootChart, 'argo-cd-application-barqr-capmoo', {
    metadata: {
      name: 'softctf-barqr-capmoo',
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
        path: 'dist/softctf-barqr-capmoo',
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

  const chart = new Chart(app, 'softctf-barqr-capmoo', {
    namespace: GlobalNamespaceEnum.SOFTCTF_GLOBAL,
  })

  const envSecret = new Secret(chart, 'barqr-capmoo-secret', {
    metadata: {
      name: 'barqr-capmoo-secret',
    },
    immutable: true,
    stringData: {
      FLAG: 'softctf{Bar[0De_anD_qRcode_PUZ2liNg}',
    },
  })

  const kubeDeployment = new Deployment(chart, 'barqr-capmoo-deployment', {
    metadata: {
      name: 'barqr-capmoo-app',
    },
    replicas: 3,
    containers: [
      {
        image: `${image}:${tag}`,
        name: 'barqr-capmoo-app',
        ports: [{ number: 1337 }],
        imagePullPolicy: ImagePullPolicy.IF_NOT_PRESENT,
        envFrom: [Env.fromSecret(envSecret)],
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
        }
      },
    ],
    dockerRegistryAuth: Secret.fromSecretName(chart, 'regcred', 'regcred'),
  })

  return {
    service: new Service(chart, 'barqr-capmoo-service', {
      metadata: {
        name: 'barqr-capmoo-service',
        namespace: GlobalNamespaceEnum.SOFTCTF_GLOBAL,
      },
      type: ServiceType.CLUSTER_IP,
      selector: kubeDeployment,
      ports: [
        {
          port: 8085,
          targetPort: 1337,
          name: 'tcp',
        },
      ],
    }),
  }
}
