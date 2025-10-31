import { App, Chart, Size } from 'cdk8s'
import { GlobalNamespaceEnum } from '../types/namespace'
import imageInfo from '../images/simple-math.json'
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

const image = imageInfo['softctf-simple-math']['image']
const tag = imageInfo['softctf-simple-math']['tag']

export const applySimpleMathTemplate = (
  app: App,
  rootChart: Chart,
  projectName: string,
) => {
  new Application(rootChart, 'argo-cd-application-simple-math', {
    metadata: {
      name: 'softctf-simple-math',
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
        path: 'dist/softctf-simple-math',
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

  const chart = new Chart(app, 'softctf-simple-math', {
    namespace: GlobalNamespaceEnum.SOFTCTF_GLOBAL,
  })

  const envSecret = new Secret(chart, 'simple-math-secret', {
    metadata: {
      name: 'simple-math-secret',
    },
    immutable: true,
    stringData: {
      FLAG: 'softctf{MAt#_is_REal!Y_$iMP!e_RIGHT}',
    },
  })

  const kubeDeployment = new Deployment(chart, 'simple-math-deployment', {
    metadata: {
      name: 'simple-math-app',
    },
    replicas: 3,
    containers: [
      {
        image: `${image}:${tag}`,
        name: 'simple-math-app',
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
    service: new Service(chart, 'simple-math-service', {
      metadata: {
        name: 'simple-math-service',
        namespace: GlobalNamespaceEnum.SOFTCTF_GLOBAL,
      },
      type: ServiceType.CLUSTER_IP,
      selector: kubeDeployment,
      ports: [
        {
          port: 8084,
          targetPort: 1337,
          name: 'tcp',
        },
      ],
    }),
  }
}
