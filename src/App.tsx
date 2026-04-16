import { useState } from 'react'
import Login from './pages/Login'
import ProjectSelector from './pages/ProjectSelector'
import ProjectPage from './pages/ProjectPage'

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!sessionStorage.getItem('accessToken')
  )

  const [hasProject, setHasProject] = useState(
    !!sessionStorage.getItem('projectId')
  )

  if (!isAuthenticated) {
    return (
      <Login
        onLoginSuccess={() => {
          setIsAuthenticated(true)
          setHasProject(false)
          sessionStorage.removeItem('projectId')
        }}
      />
    )
  }

  if (!hasProject) {
    return (
      <ProjectSelector
        onProjectSelected={() => {
          setHasProject(true)
        }}
      />
    )
  }

  return <ProjectPage />
}
