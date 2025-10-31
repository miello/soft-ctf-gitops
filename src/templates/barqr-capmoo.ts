import { App, Chart } from 'cdk8s'
import { ChallengeNamespaceEnum } from '../types/namespace'
import {
  IntOrString,
  KubeDeployment,
  KubeService,
  Quantity,
} from '../../imports/k8s'
import imageInfo from '../images/barqr-capmoo.json'
import { Application } from '../../imports/argocd-application-argoproj.io'
import { REPOSITORY_URL } from '../constants'
import { Secret } from 'cdk8s-plus-33'

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
        namespace: ChallengeNamespaceEnum.SOFTCTF_BARQR_CAPMOO,
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
    namespace: ChallengeNamespaceEnum.SOFTCTF_BARQR_CAPMOO,
  })

  new Secret(chart, 'barqr-capmoo-secret', {
    metadata: {
      name: 'barqr-capmoo-secret',
    },
    immutable: true,
    stringData: {
      FLAG: 'softctf{Bar[0De_anD_qRcode_PUZ2liNg}',
    },
  })

  new KubeDeployment(chart, 'barqr-capmoo-deployment', {
    metadata: {
      name: 'barqr-capmoo-app',
    },
    spec: {
      selector: {
        matchLabels: {
          app: 'barqr-capmoo-app',
        },
      },
      replicas: 2,
      template: {
        metadata: {
          labels: {
            app: 'barqr-capmoo-app',
          },
        },
        spec: {
          imagePullSecrets: [
            {
              name: 'regcred',
            },
          ],
          containers: [
            {
              name: 'barqr-capmoo-app',
              image: `${image}:${tag}`,
              envFrom: [
                {
                  secretRef: {
                    name: 'barqr-capmoo-secret',
                  },
                },
              ],
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

  new KubeService(chart, 'barqr-capmoo-service', {
    metadata: {
      name: 'barqr-capmoo-service',
      namespace: ChallengeNamespaceEnum.SOFTCTF_ARE_YOU_REAL,
      annotations: {},
    },
    spec: {
      selector: {
        app: 'barqr-capmoo-app',
      },
      ports: [
        {
          name: 'tcp',
          port: 8085,
          targetPort: IntOrString.fromNumber(1337),
        },
      ],
      type: 'NodePort',
    },
  })
}
