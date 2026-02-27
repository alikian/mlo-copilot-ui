import { createBrowserRouter, Navigate } from 'react-router-dom'
import AppShell from './layout/AppShell'
import CasesList from './pages/CasesList'
import NewScenarioWizard from './pages/NewScenarioWizard'
import CaseDetail from './pages/CaseDetail'
import Settings from './pages/Settings'

export const routes = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/cases" replace /> },
      { path: 'cases', element: <CasesList /> },
      { path: 'cases/new', element: <NewScenarioWizard /> },
      { path: 'cases/:caseId', element: <CaseDetail /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
])
