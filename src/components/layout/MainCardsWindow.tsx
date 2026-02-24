import * as React from 'react'
import { Button } from '@/components/ui/button'
import { MainCardView } from '../cards/MainCardView'
import type { CardNodeStatus } from '../cards/cardTypes'


export type Node = {
  id: string
  title: string
  desc?: string
  status?: CardNodeStatus
  // "kinda grid but not really" positions (px) in a big canvas
  x: number
  y: number
  w?: number
}

export type Edge = {
  id: string
  from: string
  to: string
  label?: string
}

const NODES: Node[] = [
  {
    id: 'ecu',
    title: 'ECU',
    desc: 'Engine control unit',
    status: 'ok',
    x: 120,
    y: 120,
    w: 280,
  },
  {
    id: 'clm',
    title: 'Central Locking Module',
    desc: 'Body control',
    status: 'warn',
    x: 520,
    y: 220,
    w: 320,
  },
  {
    id: 'door',
    title: 'Door',
    desc: 'Actuator + sensor',
    status: 'ok',
    x: 930,
    y: 320,
    w: 240,
  },

  {
    id: 'airbag',
    title: 'Airbag Control Module',
    desc: 'SRS controller',
    status: 'err',
    x: 260,
    y: 420,
    w: 320,
  },
  {
    id: 'dash',
    title: 'Instrument Cluster',
    desc: 'CAN display',
    status: 'ok',
    x: 720,
    y: 520,
    w: 300,
  },

  // a couple extra placeholders to show “not-perfect grid”
  {
    id: 'gateway',
    title: 'CAN Gateway',
    desc: 'Routing',
    status: 'ok',
    x: 420,
    y: 640,
    w: 260,
  },
  {
    id: 'abs',
    title: 'ABS Module',
    desc: 'Braking',
    status: 'warn',
    x: 1040,
    y: 560,
    w: 260,
  },
]

const EDGES: Edge[] = [
  { id: 'e1', from: 'ecu', to: 'clm', label: 'CAN High / Low' },
  { id: 'e2', from: 'clm', to: 'door', label: 'Lock command' },
  { id: 'e3', from: 'ecu', to: 'airbag', label: 'Crash status' },
  { id: 'e4', from: 'clm', to: 'dash', label: 'Vehicle state' },
  { id: 'e5', from: 'ecu', to: 'gateway', label: 'Powertrain CAN' },
  { id: 'e6', from: 'gateway', to: 'abs', label: 'Chassis CAN' },
  { id: 'e7', from: 'gateway', to: 'dash', label: 'Diag / status' },
]

export function MainCardsWindow() {
  return (
    <div className="h-full w-full flex flex-col">
      <div className="px-4 py-3 border-b flex items-center gap-2">
        <div className="font-medium">Main</div>
        <div className="text-xs text-muted-foreground">Connections view</div>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" type="button">
            Refresh
          </Button>
          <Button size="sm" type="button">
            New
          </Button>
        </div>
      </div>

      <MainCardView nodes={NODES} edges={EDGES}/>
    </div>
  )
}
