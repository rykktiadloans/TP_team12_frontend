import { FilePlus, Wrench } from 'lucide-react'
import { Menubar, MenubarMenu, MenubarTrigger } from '../ui/menubar'

export default function Toolbar() {
  return (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger><FilePlus /> </MenubarTrigger>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger><FilePlus /> </MenubarTrigger>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger><FilePlus /> </MenubarTrigger>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger><FilePlus /> </MenubarTrigger>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger><FilePlus /> </MenubarTrigger>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger><FilePlus /> </MenubarTrigger>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger><FilePlus /> </MenubarTrigger>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger><FilePlus /> </MenubarTrigger>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger><Wrench/> </MenubarTrigger>
      </MenubarMenu>
    </Menubar>
  )
}