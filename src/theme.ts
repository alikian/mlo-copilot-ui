import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'light',
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiAppBar: {
      defaultProps: {
        elevation: 0,
        color: 'inherit',
      },
    },
  },
})
