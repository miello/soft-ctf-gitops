import { App, Chart } from 'cdk8s'
import { ChallengeNamespaceEnum } from '../types/namespace'
import {
  IntOrString,
  KubeDeployment,
  KubeService,
  Quantity,
} from '../../imports/k8s'
import imageInfo from '../images/simple-math.json'
import { Application } from '../../imports/argocd-application-argoproj.io'
import { REPOSITORY_URL } from '../constants'
import { Secret } from 'cdk8s-plus-33'

const image = imageInfo['softctf-simple-math']['image']
const tag = imageInfo['softctf-simple-math']['tag']

export const applySimpleMathTemplate = (app: App, rootChart: Chart, projectName: string) => {
  new Application(rootChart, 'argo-cd-application-simple-math', {
    metadata: {
      name: 'softctf-simple-math',
      namespace: 'argocd',
    },
    spec: {
      destination: {
        namespace: ChallengeNamespaceEnum.SOFTCTF_SIMPLE_MATH,
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
    namespace: ChallengeNamespaceEnum.SOFTCTF_SIMPLE_MATH,
  })

  new Secret(chart, 'simple-math-secret', {
    metadata: {
      name: 'simple-math-secret',
    },
    immutable: true,
    stringData: {
      FLAG: 'softctf{MAt#_is_REal!Y_$iMP!e_RIGHT}',
    },
  })

  new KubeDeployment(chart, 'simple-math-deployment', {
    metadata: {
      name: 'simple-math-app',
    },
    spec: {
      selector: {
        matchLabels: {
          app: 'simple-math-app',
        },
      },
      replicas: 2,
      template: {
        metadata: {
          labels: {
            app: 'simple-math-app',
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
              name: 'simple-math-app',
              image: `${image}:${tag}`,
              envFrom: [{
                secretRef: {
                  name: 'simple-math-secret',
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

  new KubeService(chart, 'simple-math-service', {
    metadata: {
      name: 'simple-math-service',
      namespace: ChallengeNamespaceEnum.SOFTCTF_ARE_YOU_REAL,
      annotations: {
        
      }
    },
    spec: {
      selector: {
        app: 'simple-math-app',
      },
      ports: [
        {
          name: 'tcp',
          port: 8084,
          targetPort: IntOrString.fromNumber(1337),
        },
      ],
      type: 'NodePort',
    },
  })
}
 