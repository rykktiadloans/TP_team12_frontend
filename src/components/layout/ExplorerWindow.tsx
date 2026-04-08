import * as React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DefinitionTree } from "../explorer/DefinitionTree"

export function ExplorerWindow() {

  return (
    <div className="h-full w-full flex flex-col">
      <Tabs defaultValue="tree" className="h-full w-full flex flex-col">
        <div className="px-3 pt-3">
          <TabsList className="w-full justify-start overflow-auto">
            <TabsTrigger value="tree">Definition</TabsTrigger>
            <TabsTrigger value="search">Analysis</TabsTrigger>
            <TabsTrigger value="favorites">Resolution</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="tree" className="flex-1 mt-0">
        <DefinitionTree />
        </TabsContent>

        <TabsContent value="search" className="flex-1 mt-0">
          <div className="p-3 text-sm text-muted-foreground">TODO</div>
        </TabsContent>

        <TabsContent value="favorites" className="flex-1 mt-0">
          <div className="p-3 text-sm text-muted-foreground">TODO</div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
