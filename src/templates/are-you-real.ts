import { App, Chart } from 'cdk8s'
import { ChallengeNamespaceEnum } from '../types/namespace'
import {
  IntOrString,
  KubeDeployment,
  KubeService,
  Quantity,
} from '../../imports/k8s'
import imageInfo from '../images/are-you-real.json'
import { Application } from '../../imports/argocd-application-argoproj.io'
import { REPOSITORY_URL } from '../constants'
import { Secret } from 'cdk8s-plus-33'

const image = imageInfo['softctf-are-you-real']['image']
const tag = imageInfo['softctf-are-you-real']['tag']

export const applyAreYouRealTemplate = (app: App, rootChart: Chart, projectName: string) => {
  // Implementation of the "Are You Real?" challenge template

  new Application(rootChart, 'argo-cd-application', {
    metadata: {
      name: 'softctf-are-you-real',
      namespace: 'argocd',
    },
    spec: {
      destination: {
        namespace: ChallengeNamespaceEnum.SOFTCTF_ARE_YOU_REAL,
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
    namespace: ChallengeNamespaceEnum.SOFTCTF_ARE_YOU_REAL,
  })

  new Secret(chart, 'are-you-real-secret', {
    metadata: {
      name: 'are-you-real-secret',
    },
    immutable: true,
    stringData: {
      FLAG: 'softctf{wElcoME_To_5oftCTF_h@Ve_Fun}',
    },
  })

  new KubeDeployment(chart, 'are-you-real-deployment', {
    metadata: {
      name: 'are-you-real-app',
    },
    spec: {
      selector: {
        matchLabels: {
          app: 'are-you-real-app',
        },
      },
      replicas: 2,
      template: {
        metadata: {
          labels: {
            app: 'are-you-real-app',
          },
        },
        spec: {
          imagePullSecrets: [
            {
              name: 'regcred',
            }
          ],
          containers: [
            {
              name: 'are-you-real-app',
              image: `${image}:${tag}`,
              envFrom: [{
                secretRef: {
                  name: 'are-you-real-secret',
                }
              }],
              ports: [
                {
                  containerPort: 1337,
                },
              ],
              imagePullPolicy: 'IfNotPresent',
              resources: {
                limits: {
                  cpu: Quantity.fromString('100m'),
                  memory: Quantity.fromString('128Mi'),
                },
                requests: {
                  cpu: Quantity.fromString('50m'),
                  memory: Quantity.fromString('64Mi'),
                },
              },
            },
          ],
        },
      },
    },
  })

  new KubeService(chart, 'are-you-real-service', {
    metadata: {
      name: 'are-you-real-service',
      namespace: ChallengeNamespaceEnum.SOFTCTF_ARE_YOU_REAL,
    },
    spec: {
      selector: {
        app: 'are-you-real-app',
      },
      ports: [
        {
          name: 'tcp',
          port: 1337,
          targetPort: IntOrString.fromNumber(8081),
        },
      ],
      type: 'LoadBalancer',
    },
  })
}
