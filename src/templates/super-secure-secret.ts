import { App, Chart, Size } from 'cdk8s'
import { GlobalNamespaceEnum } from '../types/namespace'
import imageInfo from '../images/super-secure-secret.json'
import { Application } from '../../imports/argocd-application-argoproj.io'
import { REPOSITORY_URL } from '../constants'
import {
  Cpu,
  Deployment,
  Env,
  ImagePullPolicy,
  RestartPolicy,
  Secret,
  Service,
  ServiceType,
} from 'cdk8s-plus-33'

const image = imageInfo['softctf-super-secure-secret']['image']
const tag = imageInfo['softctf-super-secure-secret']['tag']

export const applySuperSecureSecretTemplate = (
  app: App,
  rootChart: Chart,
  projectName: string,
) => {
  new Application(rootChart, 'argo-cd-application-super-secure-secret', {
    metadata: {
      name: 'softctf-super-secure-secret',
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
        path: 'dist/softctf-super-secure-secret',
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

  const chart = new Chart(app, 'softctf-super-secure-secret', {
    namespace: GlobalNamespaceEnum.SOFTCTF_GLOBAL,
  })

  const envSecret = new Secret(chart, 'super-secure-secret-secret', {
    metadata: {
      name: 'super-secure-secret-secret',
    },
    immutable: true,
    stringData: {
      FLAG: 'softctf{Sh4mir_se(rET_SchEMe_KEy_LeaK4gE}',
    },
  })

  const kubeDeployment = new Deployment(
    chart,
    'super-secure-secret-deployment',
    {
      metadata: {
        name: 'super-secure-secret-app',
      },
      replicas: 3,
      containers: [
        {
          image: `${image}:${tag}`,
          name: 'super-secure-secret-app',
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
          },
        },
      ],
      dockerRegistryAuth: Secret.fromSecretName(chart, 'regcred', 'regcred'),
    },
  )

  return {
    service: new Service(chart, 'super-secure-secret-service', {
      metadata: {
        name: 'super-secure-secret-service',
        namespace: GlobalNamespaceEnum.SOFTCTF_GLOBAL,
      },
      type: ServiceType.CLUSTER_IP,
      selector: kubeDeployment,
      ports: [
        {
          port: 8083,
          targetPort: 1337,
          name: 'tcp',
        },
      ],
    }),
  }
}
