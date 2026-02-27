import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import ListAltIcon from '@mui/icons-material/ListAlt'
import SettingsIcon from '@mui/icons-material/Settings'
import {
  AppBar,
  Box,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import ToastProvider from '@/components/common/ToastProvider'

const drawerWidth = 240

type NavItem = {
  label: string
  to: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { label: 'Cases', to: '/cases', icon: <ListAltIcon /> },
  { label: 'New Scenario', to: '/cases/new', icon: <AddCircleOutlineIcon /> },
  { label: 'Settings', to: '/settings', icon: <SettingsIcon /> },
]

export default function AppShell() {
  const location = useLocation()

  return (
    <ToastProvider>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
          <Toolbar>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              MLO Copilot
            </Typography>
          </Toolbar>
        </AppBar>

        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
          }}
        >
          <Toolbar />
          <Box sx={{ overflow: 'auto' }}>
            <List>
              {navItems.map((item) => (
                <ListItemButton
                  key={item.to}
                  component={NavLink}
                  to={item.to}
                  selected={location.pathname === item.to}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              ))}
            </List>
            <Divider />
          </Box>
        </Drawer>

        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Toolbar />
          <Outlet />
        </Box>
      </Box>
    </ToastProvider>
  )
}
