import { createBrowserRouter } from 'react-router'
import { HealthScreen } from '../features/diagnostics/HealthScreen'
import { HomeScreen } from '../features/home/HomeScreen'
import { Layout } from './Layout'

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <HomeScreen /> },
      { path: 'health', element: <HealthScreen /> },
    ],
  },
])
