import type { ReactNode } from 'react'

export function HelpContent() {
  return (
    <>
      <Header> Introduction to TARA</Header>
      <p>
        <em>Threat Analysis and Risk Assessment </em>(TARA) is a systematic
        process that identifies potential cybersecurity threats in vehicle
        systems, evaluates their likelihood, and assesses their impact on safety
        and functionality. The goal of TARA is to pinpoint vulnerabilities
        within a vehicle’s electronic architecture, communication networks, and
        control units, and to develop strategies that reduce the risk of
        exploitation. It is also essential for compliance with ISO 21434
      </p>

      <Header>Purpose of App</Header>
      <p>
        The purpose of this app is to simplify and automate the TARA process. It
        does so primarily by providing the way to model and visualize the the
        informational system, as well as integrating the MITRE ICS system for
        accelerating the analysis process.
      </p>
      <p>
        Compared to other alternatives, the application is also free and open
        source.
      </p>

      <Header>Quick overview</Header>
      <p>
        The application allows the user to model the system and its potential
        attack vectors using different interconnected <em>Model</em> objects, such as
        components, damage scenarios, threat classes, technologies and so on.
      </p>
      <p>
        Said models can be viewed as either a graph, or a table. The specific arrangement of nodes in the graph can be saved as a JSON document.
      </p>
      <p>
        The <em>assistants</em> view provides a way to automate the modeling process.
      </p>
    </>
  )
}

function Header({ children }: { children?: ReactNode | ReactNode[] }) {
  return <h3 className="text-2xl">{children}</h3>
}
