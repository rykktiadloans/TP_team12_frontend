import { useReactFlow } from '@xyflow/react'
import {
  Menubar,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarMenu,
  MenubarShortcut,
  MenubarTrigger,
} from '../ui/menubar'
import {
  getProjectLayoutKey,
  readStoredPositions,
  writeStoredPositions,
  type StoredPositions,
} from '../cards/layout'
import { useRef, type ChangeEventHandler } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { HelpContent } from '@/components/layout/HelpContent'

export default function Header() {
  const flow = useReactFlow()
  const projectName = sessionStorage.getItem('projectName')
  const fileInput = useRef<HTMLInputElement>(null)

  function onSave() {
    const file = new Blob([JSON.stringify(readStoredPositions(), null, 2)], {
      type: 'application/json',
    })
    const a = document.createElement('a')
    const url = URL.createObjectURL(file)
    a.href = url
    a.download =
      getProjectLayoutKey() + ':' + new Date().toISOString() + '.json'
    document.body.appendChild(a)
    a.click()
    setTimeout(function () {
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    }, 0)
  }

  const onLoad = () => {
    fileInput.current?.click()
  }

  const onFileSelect = (files: FileList | null) => {
    if (files == null) {
      return
    }
    const fileReader = new FileReader()
    fileReader.onload = () => {
      const result = String(fileReader.result)
      try {
        localStorage.setItem(getProjectLayoutKey(), result)
        const positions = JSON.parse(result) as StoredPositions
        console.log('positions', positions)
        flow.setNodes((oldNodes) => {
          return oldNodes.map((node) => {
            const position = Object.entries(positions).find(
              ([id, _]) => id == node.id
            )
            if (!position) {
              return node
            }
            const pos = position[1]
            return { ...node, position: pos }
          })
        })
      } catch {
        // Ignore localStorage failures so the graph still works.
      }
    }
    fileReader.readAsText(files[0])
  }

  return (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarGroup>
            <MenubarItem onClick={onSave}>Save Layout</MenubarItem>
            <MenubarItem onClick={onLoad}>Load Layout</MenubarItem>
          </MenubarGroup>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <Dialog>
          <DialogTrigger asChild>
            <MenubarTrigger>Help</MenubarTrigger>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Help</DialogTitle>
              <DialogDescription>How to use IA-TARA</DialogDescription>
            </DialogHeader>
            <div className="-mx-4 no-scrollbar max-h-[50vh] overflow-y-auto px-4">
              <HelpContent />
            </div>
          </DialogContent>
        </Dialog>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger
          onClick={() => {
            sessionStorage.removeItem('accessToken')
            sessionStorage.removeItem('refreshToken')
            sessionStorage.removeItem('projectId')
            sessionStorage.removeItem('projectName')
            window.location.reload()
          }}
        >
          Login
        </MenubarTrigger>
      </MenubarMenu>
      <div className="text-center grow">{projectName ?? '<No name>'}</div>
      <div className="hidden">
        <input
          ref={fileInput}
          type="file"
          id="fileInput"
          accept="application/json"
          onChange={(event) => onFileSelect(event.target.files)}
        ></input>
      </div>
    </Menubar>
  )
}
