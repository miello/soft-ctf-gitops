import { App, Chart } from 'cdk8s'
import { ChallengeNamespaceEnum } from '../types/namespace'
import {
  IntOrString,
  KubeDeployment,
  KubeService,
  Quantity,
} from '../../imports/k8s'
import imageInfo from '../images/secure-secret.json'
import { Application } from '../../imports/argocd-application-argoproj.io'
import { REPOSITORY_URL } from '../constants'
import { Secret } from 'cdk8s-plus-33'

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
        namespace: ChallengeNamespaceEnum.SOFTCTF_SECURE_SECRET,
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
    namespace: ChallengeNamespaceEnum.SOFTCTF_ARE_YOU_REAL,
  })

  new Secret(chart, 'secure-secret-secret', {
    metadata: {
      name: 'secure-secret-secret',
    },
    immutable: true,
    stringData: {
      FLAG: 'softctf{MOdU1o_rE<OVer_(oeFfIcIeNT}',
    },
  })

  new KubeDeployment(chart, 'secure-secret-deployment', {
    metadata: {
      name: 'secure-secret-app',
    },
    spec: {
      selector: {
        matchLabels: {
          app: 'secure-secret-app',
        },
      },
      replicas: 2,
      template: {
        metadata: {
          labels: {
            app: 'secure-secret-app',
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
              name: 'secure-secret-app',
              image: `${image}:${tag}`,
              envFrom: [
                {
                  secretRef: {
                    name: 'secure-secret-secret',
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

  new KubeService(chart, 'secure-secret-service', {
    metadata: {
      name: 'secure-secret-service',
      namespace: ChallengeNamespaceEnum.SOFTCTF_SECURE_SECRET,
      annotations: {},
    },
    spec: {
      selector: {
        app: 'secure-secret-app',
      },
      ports: [
        {
          name: 'tcp',
          port: 8082,
          targetPort: IntOrString.fromNumber(1337),
        },
      ],
      type: 'NodePort',
    },
  })
}
