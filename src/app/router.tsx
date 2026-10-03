import { createBrowserRouter } from 'react-router'
import { PaymentResult } from '../features/milestones/PaymentResult'
import { ProfileScreen } from '../features/profile/ProfileScreen'
import { ArbiterScreen } from '../features/disputes/ArbiterScreen'
import { HealthScreen } from '../features/diagnostics/HealthScreen'
import { HomeScreen } from '../features/home/HomeScreen'
import { CreateProjectScreen } from '../features/projects/create/CreateProjectScreen'
import { ProjectScreen } from '../features/projects/dashboard/ProjectScreen'
import { Layout } from './Layout'

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <HomeScreen /> },
      { path: 'projects/new', element: <CreateProjectScreen /> },
      { path: 'projects/:pda', element: <ProjectScreen /> },
      { path: 'projects/:pda/milestones/:index/payment', element: <PaymentResult /> },
      { path: 'projects/:pda/milestones/:index/dispute', element: <ArbiterScreen /> },
      { path: 'profile', element: <ProfileScreen /> },
      { path: 'health', element: <HealthScreen /> },
    ],
  },
])
