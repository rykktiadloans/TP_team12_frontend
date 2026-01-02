import { Menubar, MenubarMenu, MenubarTrigger } from '../ui/menubar'

export default function Header() {
  return (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>Edit</MenubarTrigger>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>Settings</MenubarTrigger>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>View</MenubarTrigger>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>Import/Export</MenubarTrigger>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>Help</MenubarTrigger>
      </MenubarMenu>
      <div className='grow text-center'>Project 12</div>
    </Menubar>
  )
}
