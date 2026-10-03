import { createBrowserRouter } from 'react-router'
import { HealthScreen } from '../features/diagnostics/HealthScreen'
import { HomeScreen } from '../features/home/HomeScreen'
import { CreateProjectScreen } from '../features/projects/create/CreateProjectScreen'
import { Layout } from './Layout'

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <HomeScreen /> },
      { path: 'projects/new', element: <CreateProjectScreen /> },
      { path: 'health', element: <HealthScreen /> },
    ],
  },
])
