import { App, Chart, Size } from 'cdk8s'
import { GlobalNamespaceEnum } from '../types/namespace'
import imageInfo from '../images/secure-secret.json'
import { Application } from '../../imports/argocd-application-argoproj.io'
import { REPOSITORY_URL } from '../constants'
import {
  Secret,
  Deployment,
  Service,
  ServiceType,
  ImagePullPolicy,
  Cpu,
  Env,
} from 'cdk8s-plus-33'

const image = imageInfo['softctf-secure-secret']['image']
const tag = imageInfo['softctf-secure-secret']['tag']

export const applySecureSecretTemplate = (
  app: App,
  rootChart: Chart,
  projectName: string,
) => {
  new Application(rootChart, 'argo-cd-application-secure-secret', {
    metadata: {
      name: 'softctf-secure-secret',
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
        path: 'dist/softctf-secure-secret',
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

  const chart = new Chart(app, 'softctf-secure-secret', {
    namespace: GlobalNamespaceEnum.SOFTCTF_GLOBAL,
  })

  const envSecret = new Secret(chart, 'secure-secret-secret', {
    metadata: {
      name: 'secure-secret-secret',
    },
    immutable: true,
    stringData: {
      FLAG: 'softctf{MOdU1o_rE<OVer_(oeFfIcIeNT}',
    },
  })

  const kubeDeployment = new Deployment(chart, 'secure-secret-deployment', {
    metadata: {
      name: 'secure-secret-app',
    },
    replicas: 3,
    containers: [
      {
        image: `${image}:${tag}`,
        name: 'secure-secret-app',
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
  })

  return {
    service: new Service(chart, 'secure-secret-service', {
      metadata: {
        name: 'secure-secret-service',
        namespace: GlobalNamespaceEnum.SOFTCTF_GLOBAL,
      },
      type: ServiceType.CLUSTER_IP,
      selector: kubeDeployment,
      ports: [
        {
          port: 8082,
          targetPort: 1337,
          name: 'tcp',
        },
      ],
    }),
  }
}
