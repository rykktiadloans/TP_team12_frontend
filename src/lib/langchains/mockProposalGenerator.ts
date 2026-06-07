import type { ModelState } from '@/store/model-store'
import type {
  LangchainGenerationResult,
  LangchainProposal,
  LangchainProposalReference,
} from './types'

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}

function titleCase(value: string) {
  return normalizeName(value)
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function slug(value: string) {
  return normalizeName(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function extractComponentName(prompt: string) {
  const componentMatch = prompt.match(
    /\bcomponent\s+([^,.]+?)(?:\s+implemented|\s+using|,|\.|$)/i
  )

  if (componentMatch?.[1]) {
    return titleCase(componentMatch[1])
  }

  const projectUsingMatch = prompt.match(/\busing\s+component\s+([^,.]+)/i)
  if (projectUsingMatch?.[1]) {
    return titleCase(projectUsingMatch[1])
  }

  return 'Primary Component'
}

function extractTechnologyNames(prompt: string) {
  const match = prompt.match(/\btechnolog(?:y|ies)\s+([^.;]+)/i)
  const source = match?.[1] ?? ''
  const cleaned = source
    .replace(/\band so on\b/gi, '')
    .replace(/\bprepare\b.+$/gi, '')
    .trim()

  const names = cleaned
    .split(/\s*(?:,|\/|\+|\band\b|\&)\s*/i)
    .map((name) => titleCase(name))
    .filter((name) => name.length > 1)

  return [...new Set(names)]
}

function findExistingIdByName<T extends { id: number; name: string }>(
  map: Map<number, T> | undefined,
  name: string
) {
  const normalized = name.toLowerCase()
  return [...(map?.values() ?? [])].find(
    (item) => item.name.trim().toLowerCase() === normalized
  )?.id
}

function pendingProposal(
  proposal: Omit<LangchainProposal, 'status'>
): LangchainProposal {
  return {
    ...proposal,
    status: 'pending',
  }
}

export function prepareLangchainProposals(
  prompt: string,
  state?: ModelState
): LangchainGenerationResult {
  const componentName = extractComponentName(prompt)
  const technologyNames = extractTechnologyNames(prompt)
  const componentSlug = slug(componentName) || 'component'
  const proposals: LangchainProposal[] = []

  const existingComponentId = findExistingIdByName(state?.components, componentName)
  const componentTempId = `component-${componentSlug}`
  const technologyRefs: LangchainProposalReference[] = []
  const existingTechnologyIds: number[] = []

  technologyNames.forEach((technologyName) => {
    const existingId = findExistingIdByName(state?.technologies, technologyName)

    if (existingId != null) {
      existingTechnologyIds.push(existingId)
      return
    }

    const tempId = `technology-${slug(technologyName)}`
    technologyRefs.push({
      field: 'technology',
      tempId,
      mode: 'many',
      label: technologyName,
    })
    proposals.push(
      pendingProposal({
        tempId,
        type: 'technology',
        title: technologyName,
        description: `${technologyName} technology used by ${componentName}.`,
        rationale: `${technologyName} is referenced by the requested component and should be modeled before linking dependent objects to it.`,
        payload: {
          name: technologyName,
          description: `${technologyName} technology used by ${componentName}.`,
        },
      })
    )
  })

  if (existingComponentId == null) {
    proposals.push(
      pendingProposal({
        tempId: componentTempId,
        type: 'component',
        title: componentName,
        description: `Component described by the assistant prompt.`,
        rationale: `The component is the system asset the requested scenarios depend on, so it needs to exist before attack steps, damage scenarios, and controls can be linked.`,
        payload: {
          name: componentName,
          description: `Project component using ${
            technologyNames.length ? technologyNames.join(', ') : 'the stated stack'
          }.`,
          communicates_with: [],
          technology: existingTechnologyIds,
        },
        references: technologyRefs,
      })
    )
  }

  const componentReference = existingComponentId
    ? undefined
    : {
        tempId: componentTempId,
      }

  const attackComponentRefs = componentReference
    ? [
        {
          field: 'component',
          tempId: componentReference.tempId,
          mode: 'one' as const,
          label: componentName,
        },
      ]
    : []

  const damageScenarioTempId = `damage-${componentSlug}-service-loss`
  proposals.push(
    pendingProposal({
      tempId: damageScenarioTempId,
      type: 'damageScenario',
      title: `${componentName} service disruption`,
      description: `Loss or degradation of ${componentName} service affects dependent functions.`,
      rationale: `Availability loss is a core impact to capture for ${componentName}, especially before evaluating risk and controls.`,
      payload: {
        name: `${componentName} service disruption`,
        description: `Loss or degradation of ${componentName} service affects dependent functions and may reduce operational availability.`,
        affected_CIA_parts: 1,
        safety_impact: 1,
        finantial_impact: 1,
        operational_impact: 2,
        privacy_impact: 0,
      },
    })
  )

  const dataDamageScenarioTempId = `damage-${componentSlug}-data-integrity`
  proposals.push(
    pendingProposal({
      tempId: dataDamageScenarioTempId,
      type: 'damageScenario',
      title: `${componentName} data integrity loss`,
      description: `Manipulated data from ${componentName} leads to incorrect system behavior.`,
      rationale: `Integrity loss is a plausible harm path for ${componentName} and gives threat scenarios a concrete impact to connect to.`,
      payload: {
        name: `${componentName} data integrity loss`,
        description: `Manipulated or spoofed data from ${componentName} can lead to incorrect decisions, unsafe state transitions, or unreliable operation.`,
        affected_CIA_parts: 2,
        safety_impact: 2,
        finantial_impact: 1,
        operational_impact: 2,
        privacy_impact: 1,
      },
    })
  )

  const reconStepTempId = `attack-${componentSlug}-recon`
  proposals.push(
    pendingProposal({
      tempId: reconStepTempId,
      type: 'attackStep',
      title: `Identify ${componentName} interface`,
      description: `Discover exposed interfaces and supported messages for ${componentName}.`,
      rationale: `Reconnaissance is a realistic prerequisite for later manipulation and helps model the attacker path in smaller reviewable steps.`,
      payload: {
        name: `Identify ${componentName} interface`,
        description: `Discover reachable interfaces, protocol details, trust boundaries, and accepted message formats for ${componentName}.`,
        required_access: 'Network or diagnostic access to the component boundary.',
        fr_et: 1,
        fr_se: 3,
        fr_koC: 3,
        fr_WoO: 1,
        fr_eq: 0,
        controls: [],
        ...(existingComponentId ? { component: existingComponentId } : {}),
      },
      references: attackComponentRefs,
    })
  )

  const exploitStepTempId = `attack-${componentSlug}-inject`
  proposals.push(
    pendingProposal({
      tempId: exploitStepTempId,
      type: 'attackStep',
      title: `Inject crafted ${componentName} input`,
      description: `Send crafted data or commands to alter ${componentName} behavior.`,
      rationale: `Crafted input or message injection is the step that directly connects discovered interfaces to the modeled integrity and availability impacts.`,
      payload: {
        name: `Inject crafted ${componentName} input`,
        description: `Send crafted inputs, replayed messages, or malformed commands that influence ${componentName} behavior or downstream consumers.`,
        required_access: 'Ability to send traffic or data accepted by the component.',
        fr_et: 4,
        fr_se: 3,
        fr_koC: 3,
        fr_WoO: 4,
        fr_eq: 4,
        controls: [],
        ...(existingComponentId ? { component: existingComponentId } : {}),
      },
      references: [
        ...attackComponentRefs,
        {
          field: 'previous_steps',
          tempId: reconStepTempId,
          mode: 'many',
          label: `Identify ${componentName} interface`,
        },
      ],
    })
  )

  const threatScenarioTempId = `threat-${componentSlug}-manipulation`
  proposals.push(
    pendingProposal({
      tempId: threatScenarioTempId,
      type: 'threatScenario',
      title: `${componentName} communication manipulation`,
      description: `An attacker manipulates ${componentName} communication to trigger damage scenarios.`,
      rationale: `This scenario ties the proposed attack steps to concrete damage outcomes so the model has an end-to-end threat path.`,
      payload: {
        name: `${componentName} communication manipulation`,
        description: `An attacker identifies the interface and injects crafted data to manipulate ${componentName}, causing service disruption or data integrity loss.`,
        threat_class: null,
        components: existingComponentId ? [existingComponentId] : [],
        compromises: existingComponentId
          ? [
              {
                component_id: existingComponentId,
                compromised_part_cia: 3,
              },
            ]
          : [],
      },
      references: [
        ...(componentReference
          ? [
              {
                field: 'components',
                tempId: componentReference.tempId,
                mode: 'many' as const,
                label: componentName,
              },
            ]
          : []),
        {
          field: 'attack_steps',
          tempId: reconStepTempId,
          mode: 'many',
          label: `Identify ${componentName} interface`,
        },
        {
          field: 'attack_steps',
          tempId: exploitStepTempId,
          mode: 'many',
          label: `Inject crafted ${componentName} input`,
        },
        {
          field: 'damage_scenarios',
          tempId: damageScenarioTempId,
          mode: 'many',
          label: `${componentName} service disruption`,
        },
        {
          field: 'damage_scenarios',
          tempId: dataDamageScenarioTempId,
          mode: 'many',
          label: `${componentName} data integrity loss`,
        },
      ],
    })
  )

  proposals.push(
    pendingProposal({
      tempId: `control-${componentSlug}-validation`,
      type: 'control',
      title: `${componentName} input validation and authentication`,
      description: `Validate and authenticate inputs before ${componentName} accepts them.`,
      rationale: `This control directly mitigates crafted or unauthenticated input attempts against ${componentName}.`,
      payload: {
        name: `${componentName} input validation and authentication`,
        description: `Require authenticated sources, validate message structure and ranges, reject malformed input, and log rejected attempts.`,
        fr_et: 0,
        fr_se: 3,
        fr_koC: 3,
        fr_WoO: 1,
        fr_eq: 0,
        ...(existingComponentId ? { component: existingComponentId } : {}),
      },
      references: [
        ...attackComponentRefs,
        {
          field: 'attack_steps',
          tempId: exploitStepTempId,
          mode: 'many',
          label: `Inject crafted ${componentName} input`,
        },
      ],
    })
  )

  return {
    prompt,
    proposals,
  }
}
