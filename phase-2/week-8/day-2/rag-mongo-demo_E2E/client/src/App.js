import React, { useState, useEffect } from 'react';
import {
  CssBaseline,
  ThemeProvider,
  createTheme,
  Box,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Container,
  IconButton,
  Tooltip,
  Breadcrumbs,
  Link,
  useMediaQuery,
  Fade,
  Avatar,
  alpha
} from '@mui/material';
import {
  Transform as TransformIcon,
  Storage as StorageIcon,
  Settings as SettingsIcon,
  Search as SearchIcon,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  NavigateNext as NavigateNextIcon,
  TextFields as KeywordIcon,
  AutoFixHigh as HybridIcon,
  CompareArrows as RerankIcon,
  Psychology as PreprocessIcon,
  Summarize as SummarizeIcon,
  Schema as SchemaIcon,
  Hub as BrandIcon,
  AutoAwesome as AutoAwesomeIcon
} from '@mui/icons-material';
import { SnackbarProvider } from 'notistack';

// Import components
import ConvertToJson from './components/data/ConvertToJson';
import EmbeddingsStore from './components/data/EmbeddingsStore';
import QuerySearch from './components/search/QuerySearch';
import BM25Search from './components/search/BM25Search';
import HybridSearch from './components/search/HybridSearch';
import RerankingSearch from './components/search/RerankingSearch';
import QueryPreprocessing from './components/processing/QueryPreprocessing';
import SummarizationDedup from './components/processing/SummarizationDedup';
import PromptSchemaManager from './components/processing/PromptSchemaManager';
import Settings from './components/settings/Settings';

// Enterprise RAG platform theme
const createEnterpriseTheme = (mode) => createTheme({
  palette: {
    mode,
    primary: {
      main: '#5E10B1',
      light: '#9F7BC3',
      dark: '#3C1053',
      contrastText: '#FFFFFF'
    },
    secondary: {
      main: '#00A874',
      light: '#46FFC6',
      dark: '#045F1D',
      contrastText: '#FFFFFF'
    },
    accent: {
      main: '#DF2B40',
      light: '#F67B78',
      dark: '#971A29'
    },
    success: {
      main: '#008E4E',
      light: '#00D593',
      dark: '#045F1D',
      contrastText: '#FFFFFF'
    },
    error: {
      main: '#DF2B40',
      light: '#F67B78',
      dark: '#971A29',
    },
    warning: {
      main: '#B78400',
      light: '#F8B400',
      dark: '#744F00',
    },
    info: {
      main: '#1476CC',
      light: '#2D90FD',
      dark: '#065196',
    },
    background: {
      default: mode === 'light' ? '#F2F2F8' : '#1C1521',
      paper: mode === 'light' ? '#FFFFFF' : '#2C2C2C'
    },
    text: {
      primary: mode === 'light' ? '#002245' : '#F2F2F2',
      secondary: mode === 'light' ? '#565656' : '#B2B2B2'
    },
    divider: mode === 'light' ? '#E5E5E5' : '#414141',
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    ...Array(24).fill('none') // Completely flat enterprise shadow system
  ],
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
    h4: {
      fontWeight: 700,
      fontSize: '1.65rem',
      lineHeight: 1.25,
      letterSpacing: '-0.025em'
    },
    h5: {
      fontWeight: 700,
      fontSize: '1.2rem',
      lineHeight: 1.3,
      letterSpacing: '-0.02em'
    },
    h6: {
      fontWeight: 600,
      fontSize: '0.975rem',
      lineHeight: 1.4,
      letterSpacing: '-0.01em'
    },
    subtitle1: {
      fontWeight: 600,
      fontSize: '0.9rem',
      lineHeight: 1.5,
      letterSpacing: '-0.01em'
    },
    subtitle2: {
      fontWeight: 700,
      fontSize: '0.75rem',
      lineHeight: 1.5,
      letterSpacing: '0.04em',
      textTransform: 'uppercase'
    },
    body1: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
      letterSpacing: '-0.005em'
    },
    body2: {
      fontSize: '0.8125rem',
      lineHeight: 1.5
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.4,
      letterSpacing: '0.01em'
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      letterSpacing: '-0.01em'
    }
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontFeatureSettings: '"cv02", "cv03", "cv04", "cv11"',
        }
      }
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: '24px', // Clean curved pill action buttons
          padding: '10px 24px',
          fontSize: '0.875rem',
          fontWeight: 600,
          letterSpacing: '-0.01em',
          transition: 'all 180ms ease',
          position: 'relative',
          overflow: 'hidden',
          textTransform: 'none',
          boxShadow: 'none !important',
          '&:hover': {
            boxShadow: 'none !important',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            boxShadow: 'none !important',
            transform: 'translateY(0)',
          },
          '&:focus': {
            boxShadow: 'none !important',
          }
        },
        sizeSmall: {
          borderRadius: '20px',
          padding: '7px 18px',
          fontSize: '0.8125rem',
        },
        sizeLarge: {
          borderRadius: '28px',
          padding: '12px 30px',
          fontSize: '0.9375rem',
          fontWeight: 700,
        },
        containedPrimary: {
          backgroundColor: '#5E10B1',
          color: '#FFFFFF',
          boxShadow: 'none !important',
          '&:hover': {
            backgroundColor: '#4A0E8E',
            boxShadow: 'none !important',
          },
        },
        containedSecondary: {
          backgroundColor: '#002245',
          color: '#FFFFFF',
          boxShadow: 'none !important',
          '&:hover': {
            backgroundColor: '#041F62',
            boxShadow: 'none !important',
          },
        },
        containedSuccess: {
          backgroundColor: '#008E4E',
          color: '#FFFFFF',
          boxShadow: 'none !important',
          '&:hover': {
            backgroundColor: '#045F1D',
            boxShadow: 'none !important',
          },
        },
        containedError: {
          backgroundColor: '#DF2B40',
          color: '#FFFFFF',
          boxShadow: 'none !important',
          '&:hover': {
            backgroundColor: '#971A29',
            boxShadow: 'none !important',
          },
        },
        containedWarning: {
          backgroundColor: '#B78400',
          color: '#FFFFFF',
          boxShadow: 'none !important',
          '&:hover': {
            backgroundColor: '#B28100',
            boxShadow: 'none !important',
          },
        },
        outlined: {
          borderWidth: '1.5px',
          borderRadius: '24px',
          borderColor: mode === 'light' ? '#B2B2B2' : '#565656',
          color: mode === 'light' ? '#002245' : '#F2F2F2',
          backgroundColor: mode === 'light' ? '#FFFFFF' : '#1E1E1E',
          boxShadow: 'none !important',
          '&:hover': {
            borderWidth: '1.5px',
            borderColor: '#5E10B1',
            backgroundColor: mode === 'light' ? '#F2EAF9' : '#352D3D',
            color: mode === 'light' ? '#5E10B1' : '#BE99E6',
            boxShadow: 'none !important',
          }
        },
        text: {
          borderRadius: '24px',
          boxShadow: 'none !important',
          '&:hover': {
            backgroundColor: mode === 'light' ? 'rgba(94, 16, 177, 0.08)' : 'rgba(190, 153, 230, 0.14)',
            boxShadow: 'none !important',
          }
        }
      }
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: 'none !important',
          transition: 'all 180ms ease',
          '&:hover': {
            backgroundColor: mode === 'light' ? 'rgba(94, 16, 177, 0.08)' : 'rgba(190, 153, 230, 0.14)',
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '14px',
          border: mode === 'light' ? '1px solid #E5E5E5' : '1px solid #414141',
          boxShadow: 'none', // Clean flat cards
          transition: 'border-color 200ms ease',
          '&:hover': {
            boxShadow: 'none',
            borderColor: mode === 'light' ? '#B2B2B2' : '#565656',
          }
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '14px',
          backgroundImage: 'none',
          boxShadow: 'none',
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            transition: 'border-color 180ms ease',
            backgroundColor: mode === 'light' ? '#FFFFFF' : '#1E1E1E',
            boxShadow: 'none',
            '& fieldset': {
              borderWidth: '1.5px',
              borderColor: mode === 'light' ? '#B2B2B2' : '#565656',
            },
            '&:hover fieldset': {
              borderColor: '#5E10B1',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#5E10B1',
              borderWidth: '2px',
            },
            '&.Mui-focused': {
              boxShadow: 'none',
            }
          },
          '& .MuiOutlinedInput-input': {
            padding: '12px 16px', // Spacious, comfortable field padding
          },
          '& .MuiOutlinedInput-multiline': {
            padding: '12px 16px',
            borderRadius: '14px',
          }
        }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          boxShadow: 'none',
          '& fieldset': {
            borderWidth: '1.5px',
            borderColor: mode === 'light' ? '#B2B2B2' : '#565656',
          },
          '&:hover fieldset': {
            borderColor: '#5E10B1',
          },
          '&.Mui-focused fieldset': {
            borderColor: '#5E10B1',
            borderWidth: '2px',
          },
          '&.Mui-focused': {
            boxShadow: 'none',
          }
        },
        input: {
          padding: '12px 16px',
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: '9999px', // Pill chips & badges
          fontSize: '0.75rem',
          padding: '4px 8px',
          boxShadow: 'none !important',
          transition: 'all 150ms ease',
        },
        filled: {
          '&.MuiChip-colorPrimary': {
            backgroundColor: mode === 'light' ? '#F2EAF9' : '#352D3D',
            color: mode === 'light' ? '#5E10B1' : '#BE99E6',
            border: `1px solid ${mode === 'light' ? '#BE99E6' : '#5A287D'}`,
          },
          '&.MuiChip-colorSecondary': {
            backgroundColor: mode === 'light' ? '#E7F6EE' : '#042110',
            color: mode === 'light' ? '#045F1D' : '#46FFC6',
            border: `1px solid ${mode === 'light' ? '#46FFC6' : '#008E4E'}`,
          },
          '&.MuiChip-colorSuccess': {
            backgroundColor: mode === 'light' ? '#ECFDF5' : '#064E3B',
            color: mode === 'light' ? '#047857' : '#A7F3D0',
            border: `1px solid ${mode === 'light' ? '#A7F3D0' : '#065F46'}`,
          },
          '&.MuiChip-colorError': {
            backgroundColor: mode === 'light' ? '#FEF2F2' : '#7F1D1D',
            color: mode === 'light' ? '#B91C1C' : '#FECDD3',
            border: `1px solid ${mode === 'light' ? '#FECDD3' : '#991B1B'}`,
          },
          '&.MuiChip-colorWarning': {
            backgroundColor: mode === 'light' ? '#FFFBEB' : '#78350F',
            color: mode === 'light' ? '#B45309' : '#FDE68A',
            border: `1px solid ${mode === 'light' ? '#FDE68A' : '#92400E'}`,
          },
        },
        outlined: {
          borderColor: mode === 'light' ? '#B2B2B2' : '#565656',
          backgroundColor: mode === 'light' ? '#F2F2F8' : '#1E1E1E',
        }
      }
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          fontWeight: 500,
          fontSize: '0.875rem',
          backdropFilter: 'blur(12px)',
          '& .MuiAlert-icon': {
            fontSize: '1.35rem',
          }
        },
        standardSuccess: {
          backgroundColor: mode === 'light' ? '#F0FDF4' : alpha('#10B981', 0.14),
          color: mode === 'light' ? '#15803D' : '#34D399',
          border: `1px solid ${mode === 'light' ? '#BBF7D0' : alpha('#10B981', 0.28)}`,
        },
        standardError: {
          backgroundColor: mode === 'light' ? '#FFF1F2' : alpha('#F43F5E', 0.14),
          color: mode === 'light' ? '#BE123C' : '#FB7185',
          border: `1px solid ${mode === 'light' ? '#FECDD3' : alpha('#F43F5E', 0.28)}`,
        },
        standardInfo: {
          backgroundColor: mode === 'light' ? '#E6ECF9' : alpha('#2D90FD', 0.14),
          color: mode === 'light' ? '#065196' : '#2D90FD',
          border: `1px solid ${mode === 'light' ? '#B9D7FC' : alpha('#2D90FD', 0.28)}`,
        },
        standardWarning: {
          backgroundColor: mode === 'light' ? '#FFFBEB' : alpha('#F59E0B', 0.14),
          color: mode === 'light' ? '#B45309' : '#FBBF24',
          border: `1px solid ${mode === 'light' ? '#FDE68A' : alpha('#F59E0B', 0.28)}`,
        },
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: 'none',
        }
      }
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: '14px',
          margin: '4px 10px',
          padding: '10px 16px',
          transition: 'all 220ms cubic-bezier(0.4, 0, 0.2, 1)',
          '&.Mui-selected': {
            background: mode === 'light' ? 'rgba(94, 16, 177, 0.08)' : 'rgba(94, 16, 177, 0.22)',
            color: mode === 'light' ? '#5E10B1' : '#BE99E6',
            boxShadow: 'none',
            '&:hover': {
              background: mode === 'light' ? 'rgba(94, 16, 177, 0.14)' : 'rgba(94, 16, 177, 0.3)',
            },
            '& .MuiListItemIcon-root': {
              color: mode === 'light' ? '#5E10B1' : '#BE99E6',
            },
            '& .MuiListItemText-primary': {
              fontWeight: 700,
              color: mode === 'light' ? '#5E10B1' : '#BE99E6',
            }
          },
          '&:hover': {
            backgroundColor: mode === 'light' ? 'rgba(94, 16, 177, 0.05)' : 'rgba(94, 16, 177, 0.12)',
            transform: 'translateX(4px)',
          }
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
        }
      }
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 48,
        },
        indicator: {
          height: 4,
          borderRadius: '4px 4px 0 0',
          background: 'linear-gradient(90deg, #5E10B1, #00A874)',
        }
      }
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.875rem',
          borderRadius: '12px',
          margin: '0 4px',
          minHeight: 44,
          transition: 'all 200ms ease',
          '&.Mui-selected': {
            fontWeight: 700,
            color: mode === 'light' ? '#5E10B1' : '#BE99E6',
          }
        }
      }
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: '9999px',
          height: 8,
          backgroundColor: mode === 'light' ? '#E5E5E5' : '#414141',
        },
        bar: {
          borderRadius: '9999px',
          background: 'linear-gradient(90deg, #5E10B1, #00A874)',
        }
      }
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: '10px',
          fontSize: '0.75rem',
          fontWeight: 600,
          padding: '8px 14px',
          backgroundColor: mode === 'light' ? '#002245' : '#F2F2F2',
          color: mode === 'light' ? '#F2F2F2' : '#002245',
          boxShadow: '0 6px 18px rgba(0,0,0,0.15)',
        }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        }
      }
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: '14px',
        }
      }
    },
    MuiStepper: {
      styleOverrides: {
        root: {
          '& .MuiStepIcon-root.Mui-active': {
            color: '#5E10B1',
          },
          '& .MuiStepIcon-root.Mui-completed': {
            color: '#10B981',
          }
        }
      }
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          width: 52,
          height: 30,
          padding: 0,
        },
        switchBase: {
          padding: 3,
          '&.Mui-checked': {
            transform: 'translateX(22px)',
            color: '#FFFFFF',
            '& + .MuiSwitch-track': {
              opacity: 1,
              background: 'linear-gradient(135deg, #5E10B1, #4A0E8E)',
            },
          },
        },
        thumb: {
          width: 24,
          height: 24,
          boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
        },
        track: {
          borderRadius: 9999,
          opacity: 1,
          backgroundColor: mode === 'light' ? '#B2B2B2' : '#565656',
        },
      }
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: mode === 'light' ? '#E5E5E5' : '#414141',
        }
      }
    },
  }
});

const drawerWidth = 280;
const collapsedDrawerWidth = 72;

// Section groupings for the sidebar
const sidebarSections = [
  {
    label: 'DATA PIPELINE',
    items: [
      {
        id: 'convert',
        label: 'Convert to JSON',
        icon: <TransformIcon />,
        component: ConvertToJson,
        description: 'Upload and convert Excel files',
      },
      {
        id: 'embeddings',
        label: 'Embeddings & Store',
        icon: <StorageIcon />,
        component: EmbeddingsStore,
        description: 'Create and manage embeddings in MongoDB',
      },
    ]
  },
  {
    label: 'SEARCH ENGINES',
    items: [
      {
        id: 'preprocess',
        label: 'Query Preprocessing',
        icon: <PreprocessIcon />,
        component: QueryPreprocessing,
        description: 'Transform & expand search queries',
      },
      {
        id: 'query',
        label: 'Vector Search',
        icon: <SearchIcon />,
        component: QuerySearch,
        description: 'Semantic AI vector search',
      },
      {
        id: 'bm25',
        label: 'BM25 Search',
        icon: <KeywordIcon />,
        component: BM25Search,
        description: 'Keyword-based search algorithm',
      },
      {
        id: 'hybrid',
        label: 'Hybrid Search',
        icon: <HybridIcon />,
        component: HybridSearch,
        description: 'Combined BM25 + Vector search',
      },
      {
        id: 'rerank',
        label: 'Score Fusion',
        icon: <RerankIcon />,
        component: RerankingSearch,
        description: 'AI semantic reranking & score fusion',
      },
    ]
  },
  {
    label: 'AI PROCESSING',
    items: [
      {
        id: 'summarize',
        label: 'Summarize & Dedup',
        icon: <SummarizeIcon />,
        component: SummarizationDedup,
        description: 'AI summarization & deduplication',
      },
      {
        id: 'prompt-schema',
        label: 'Prompt & Schema',
        icon: <SchemaIcon />,
        component: PromptSchemaManager,
        description: 'Configure system prompt templates',
      },
    ]
  },
  {
    label: 'SYSTEM CONFIG',
    items: [
      {
        id: 'settings',
        label: 'Settings',
        icon: <SettingsIcon />,
        component: Settings,
        description: 'Environment & API keys configuration',
      },
    ]
  },
];

// Flatten for lookup
const allMenuItems = sidebarSections.flatMap(s => s.items);

function App() {
  const [selectedMenuItem, setSelectedMenuItem] = useState('convert');
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  const isMobile = useMediaQuery('(max-width:768px)');
  const theme = createEnterpriseTheme(darkMode ? 'dark' : 'light');

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    document.body.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    if (isMobile) {
      setDrawerOpen(false);
    } else {
      setDrawerOpen(true);
    }
  }, [isMobile]);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleThemeToggle = () => {
    setDarkMode(!darkMode);
  };

  const getCurrentComponent = () => {
    const menuItem = allMenuItems.find(item => item.id === selectedMenuItem);
    const Component = menuItem?.component;
    return Component ? <Component /> : <div>Select a menu item</div>;
  };

  const getCurrentMenuItem = () => {
    return allMenuItems.find(item => item.id === selectedMenuItem);
  };

  const actualDrawerWidth = drawerOpen ? drawerWidth : collapsedDrawerWidth;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider
        maxSnack={3}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        dense
        preventDuplicate
        autoHideDuration={3000}
      >
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
          {/* ====== Top Floating Glass Header ====== */}
          <AppBar
            position="fixed"
            elevation={0}
            sx={{
              width: { sm: `calc(100% - ${actualDrawerWidth + 32}px)` },
              ml: { sm: `${actualDrawerWidth + 16}px` },
              mr: { sm: '16px' },
              mt: 1.5,
              borderRadius: '12px',
              transition: theme.transitions.create(['width', 'margin'], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
              }),
              backgroundColor: darkMode
                ? 'rgba(28, 21, 33, 0.82)'
                : 'rgba(255, 255, 255, 0.88)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: `1px solid ${darkMode ? 'rgba(65, 65, 65, 0.7)' : 'rgba(229, 229, 229, 0.9)'}`,
              color: darkMode ? '#F2F2F2' : '#002245',
              boxShadow: darkMode
                ? '0 10px 30px -10px rgba(0, 0, 0, 0.5)'
                : '0 10px 30px -10px rgba(0, 0, 0, 0.06)',
              zIndex: (theme) => theme.zIndex.drawer + 1,
            }}
          >
            <Toolbar sx={{ minHeight: '60px !important', px: { xs: 2, sm: 2.5 } }}>
              {/* Circular Frosted Hamburger Button */}
              <IconButton
                edge="start"
                onClick={handleDrawerToggle}
                sx={{
                  mr: 2,
                  width: 42,
                  height: 42,
                  borderRadius: '9999px', // Circular shape!
                  backgroundColor: darkMode ? 'rgba(65, 65, 65, 0.75)' : 'rgba(242, 242, 248, 0.85)',
                  border: `1px solid ${darkMode ? 'rgba(65, 65, 65, 0.6)' : 'rgba(178, 178, 178, 0.8)'}`,
                  backdropFilter: 'blur(8px)',
                  color: darkMode ? '#F2F2F2' : '#002245',
                  transition: 'all 200ms ease',
                  '&:hover': {
                    backgroundColor: darkMode ? 'rgba(86, 86, 86, 0.9)' : 'rgba(229, 229, 229, 1)',
                    transform: 'scale(1.06)',
                  }
                }}
              >
                {drawerOpen ? <ChevronLeftIcon sx={{ fontSize: '1.25rem' }} /> : <MenuIcon sx={{ fontSize: '1.25rem' }} />}
              </IconButton>

              {/* Breadcrumbs Navigation */}
              <Breadcrumbs
                separator={<NavigateNextIcon fontSize="small" sx={{ color: 'text.secondary', opacity: 0.6 }} />}
                sx={{ flexGrow: 1 }}
              >
                <Link
                  component="button"
                  variant="body2"
                  underline="hover"
                  sx={{
                    color: 'text.secondary',
                    fontWeight: 600,
                    cursor: 'pointer',
                    '&:hover': { color: 'primary.main' }
                  }}
                  onClick={() => setSelectedMenuItem('convert')}
                >
                  RAG Pipeline
                </Link>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.primary',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75
                  }}
                >
                  {getCurrentMenuItem()?.icon &&
                    React.cloneElement(getCurrentMenuItem()?.icon, { sx: { fontSize: '1.1rem', color: 'primary.main' } })
                  }
                  {getCurrentMenuItem()?.label}
                </Typography>
              </Breadcrumbs>

              {/* Active description badge */}
              <Typography
                variant="caption"
                sx={{
                  display: { xs: 'none', md: 'block' },
                  color: 'primary.main',
                  mr: 2,
                  px: 2,
                  py: 0.75,
                  borderRadius: '9999px',
                  bgcolor: darkMode ? 'rgba(94, 16, 177, 0.14)' : 'rgba(94, 16, 177, 0.08)',
                  border: '1px solid',
                  borderColor: darkMode ? 'rgba(94, 16, 177, 0.28)' : 'rgba(94, 16, 177, 0.18)',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                }}
              >
                {getCurrentMenuItem()?.description}
              </Typography>

              {/* Circular Frosted Theme Toggle Button */}
              <Tooltip title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
                <IconButton
                  onClick={handleThemeToggle}
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: '9999px', // Full Circle!
                    color: darkMode ? '#F8B400' : '#5E10B1',
                    backgroundColor: darkMode ? 'rgba(248, 180, 0, 0.12)' : 'rgba(94, 16, 177, 0.08)',
                    border: `1px solid ${darkMode ? 'rgba(248, 180, 0, 0.3)' : 'rgba(94, 16, 177, 0.2)'}`,
                    backdropFilter: 'blur(8px)',
                    transition: 'all 200ms ease',
                    '&:hover': {
                      backgroundColor: darkMode ? 'rgba(248, 180, 0, 0.22)' : 'rgba(94, 16, 177, 0.16)',
                      transform: 'scale(1.06)',
                    }
                  }}
                >
                  {darkMode ? <LightModeIcon sx={{ fontSize: '1.2rem' }} /> : <DarkModeIcon sx={{ fontSize: '1.2rem' }} />}
                </IconButton>
              </Tooltip>
            </Toolbar>
          </AppBar>

          {/* ====== Sidebar Drawer ====== */}
          <Drawer
            variant={isMobile ? 'temporary' : 'permanent'}
            open={isMobile ? drawerOpen : true}
            onClose={handleDrawerToggle}
            sx={{
              width: actualDrawerWidth,
              flexShrink: 0,
              '& .MuiDrawer-paper': {
                width: actualDrawerWidth,
                boxSizing: 'border-box',
                transition: theme.transitions.create('width', {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.enteringScreen,
                }),
                overflowX: 'hidden',
                backgroundColor: darkMode ? '#1C1521' : '#FFFFFF',
                borderRight: `1px solid ${darkMode ? '#414141' : '#E5E5E5'}`,
              },
            }}
          >
            {/* Sidebar Brand Header */}
            <Box
              sx={{
                px: drawerOpen ? 2.5 : 1.5,
                py: 2.5,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                minHeight: '64px',
              }}
            >
              <Avatar
                variant="rounded"
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: '8px',
                  bgcolor: 'primary.main',
                  color: '#FFFFFF',
                  flexShrink: 0,
                }}
              >
                <BrandIcon fontSize="small" />
              </Avatar>
              {drawerOpen && (
                <Fade in={drawerOpen} timeout={300}>
                  <Box sx={{ overflow: 'hidden' }}>
                    <Typography
                      variant="h6"
                      sx={{
                        color: 'primary.main',
                        fontWeight: 700,
                        fontSize: '1.05rem',
                        lineHeight: 1.2,
                        letterSpacing: '-0.02em'
                      }}
                    >
                      RAG Pipeline
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', fontWeight: 600 }}>
                      AI Test Case Platform
                    </Typography>
                  </Box>
                </Fade>
              )}
            </Box>

            <Divider sx={{ mx: 2 }} />

            {/* Sidebar Navigation */}
            <Box sx={{ pt: 1, pb: 2, flex: 1, overflowY: 'auto' }}>
              {sidebarSections.map((section) => (
                <Box key={section.label} sx={{ mb: 1 }}>
                  {drawerOpen && (
                    <Typography
                      variant="caption"
                      sx={{
                        px: 3,
                        py: 1,
                        display: 'block',
                        fontWeight: 800,
                        fontSize: '0.65rem',
                        letterSpacing: '0.12em',
                        color: 'text.secondary',
                        opacity: 0.7,
                        mt: 1.5,
                      }}
                    >
                      {section.label}
                    </Typography>
                  )}
                  <List disablePadding className="stagger">
                    {section.items.map((item) => (
                      <ListItem key={item.id} disablePadding>
                        <Tooltip
                          title={drawerOpen ? '' : item.label}
                          placement="right"
                          arrow
                        >
                          <ListItemButton
                            selected={selectedMenuItem === item.id}
                            onClick={() => {
                              setSelectedMenuItem(item.id);
                              if (isMobile) setDrawerOpen(false);
                            }}
                            sx={{
                              minHeight: 44,
                              justifyContent: drawerOpen ? 'initial' : 'center',
                              px: drawerOpen ? 2 : 2.5,
                            }}
                          >
                            <ListItemIcon
                              sx={{
                                minWidth: 0,
                                mr: drawerOpen ? 2 : 'auto',
                                justifyContent: 'center',
                                color: selectedMenuItem === item.id ? 'primary.main' : 'text.secondary',
                                transition: 'color 200ms ease',
                              }}
                            >
                              {item.icon}
                            </ListItemIcon>

                            {drawerOpen && (
                              <ListItemText
                                primary={item.label}
                                primaryTypographyProps={{
                                  fontSize: '0.8125rem',
                                  fontWeight: selectedMenuItem === item.id ? 700 : 500,
                                }}
                              />
                            )}
                          </ListItemButton>
                        </Tooltip>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              ))}
            </Box>

            {/* Sidebar Footer */}
            <Box sx={{ p: 2 }}>
              <Divider sx={{ mb: 2 }} />
              {drawerOpen ? (
                <Fade in={drawerOpen} timeout={300}>
                  <Box
                    sx={{
                      p: 1.75,
                      borderRadius: '12px',
                      background: darkMode
                        ? 'linear-gradient(135deg, rgba(94, 16, 177, 0.12) 0%, rgba(0, 168, 116, 0.08) 100%)'
                        : 'linear-gradient(135deg, rgba(94, 16, 177, 0.04) 0%, rgba(0, 168, 116, 0.04) 100%)',
                      border: '1px solid',
                      borderColor: darkMode ? 'rgba(94, 16, 177, 0.25)' : 'rgba(94, 16, 177, 0.15)',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AutoAwesomeIcon sx={{ fontSize: '0.9rem', color: 'primary.main' }} />
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.72rem' }}>
                        Enterprise AI Stack
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.675rem', display: 'block', mt: 0.5, fontWeight: 500 }}>
                      MongoDB Atlas • Mistral AI • Groq
                    </Typography>
                  </Box>
                </Fade>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <AutoAwesomeIcon sx={{ fontSize: '1.1rem', color: 'primary.main' }} />
                </Box>
              )}
            </Box>
          </Drawer>

          {/* ====== Main Content Area ====== */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              position: 'relative',
              bgcolor: 'background.default',
              minHeight: '100vh',
              overflow: 'hidden',
              transition: theme.transitions.create(['margin', 'width'], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
              }),
            }}
          >
            {/* Ambient animated aurora backdrop */}
            <Box className="aurora-bg" aria-hidden />

            <Toolbar sx={{ minHeight: '84px !important' }} />

            <Container
              maxWidth={false}
              sx={{ py: 2.5, px: { xs: 2, sm: 3, md: 4 }, position: 'relative', zIndex: 1 }}
            >
              <Fade in={true} timeout={400} key={selectedMenuItem}>
                <Box className="animate-slide-up">
                  {getCurrentComponent()}
                </Box>
              </Fade>
            </Container>
          </Box>
        </Box>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
