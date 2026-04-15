import { useState } from 'react'
import Login from './pages/Login'
import ProjectSelector from './pages/ProjectSelector'
import ProjectPage from './pages/ProjectPage'

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem('accessToken')
  )

  const [hasProject, setHasProject] = useState(
    !!localStorage.getItem('projectId')
  )

  if (!isAuthenticated) {
    return (
      <Login
        onLoginSuccess={() => {
          setIsAuthenticated(true)
          setHasProject(false)
          localStorage.removeItem('projectId')
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
