import { App, Chart, Size } from 'cdk8s'
import { GlobalNamespaceEnum } from '../types/namespace'
import imageInfo from '../images/are-you-real.json'
import { Application } from '../../imports/argocd-application-argoproj.io'
import { REPOSITORY_URL } from '../constants'
import {
  Secret,
  Service,
  Deployment,
  Cpu,
  Env,
  ImagePullPolicy,
  RestartPolicy,
  ServiceType,
} from 'cdk8s-plus-33'

const image = imageInfo['softctf-are-you-real']['image']
const tag = imageInfo['softctf-are-you-real']['tag']

export const applyAreYouRealTemplate = (
  app: App,
  rootChart: Chart,
  projectName: string,
) => {
  new Application(rootChart, 'argo-cd-application-are-you-real', {
    metadata: {
      name: 'softctf-are-you-real',
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
        path: 'dist/softctf-are-you-real',
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

  const chart = new Chart(app, 'softctf-are-you-real', {
    namespace: GlobalNamespaceEnum.SOFTCTF_GLOBAL,
  })

  const envSecret = new Secret(chart, 'are-you-real-secret', {
    metadata: {
      name: 'are-you-real-secret',
    },
    immutable: true,
    stringData: {
      FLAG: 'softctf{wElcoME_To_5oftCTF_h@Ve_Fun}',
    },
  })

  const kubeDeployment = new Deployment(chart, 'are-you-real-deployment', {
    metadata: {
      name: 'are-you-real-app',
    },
    replicas: 3,
    containers: [
      {
        image: `${image}:${tag}`,
        name: 'are-you-real-app',
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
      },
    ],
    dockerRegistryAuth: Secret.fromSecretName(chart, 'regcred', 'regcred'),
    restartPolicy: RestartPolicy.ON_FAILURE,
  })

  return {
    service: new Service(chart, 'are-you-real-service', {
      metadata: {
        name: 'are-you-real-service',
        namespace: GlobalNamespaceEnum.SOFTCTF_GLOBAL,
      },
      type: ServiceType.CLUSTER_IP,
      selector: kubeDeployment,
      ports: [
        {
          port: 8081,
          targetPort: 1337,
          name: 'tcp',
        },
      ],
    }),
  }
}
