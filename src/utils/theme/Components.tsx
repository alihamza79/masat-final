// project imports
import "./DefaultColors";
import { Theme } from "@mui/material/styles";

const components: any = (theme: Theme) => {
  return {
    MuiCssBaseline: {
      styleOverrides: {
        "*": {
          boxSizing: "border-box",
        },
        html: {
          height: "100%",
          width: "100%",
        },
        a: {
          textDecoration: "none",
        },
        body: {
          height: "100%",
          margin: 0,
          padding: 0,
        },
        "#root": {
          height: "100%",
        },
        '.ql-container.ql-snow, .ql-toolbar.ql-snow': {
          border: '0 !important', borderRadius: '7px'
        },
        '.ql-editor, .ql-snow *': {
          fontFamiy: 'inherit !important'
        },
        "*[dir='rtl'] .buyNowImg": {
          transform: "scaleX(-1)",
        },
        ".border-none": {
          border: "0px",
          td: {
            border: "0px",
          },
        },
        ".btn-xs": {
          minWidth: "30px !important",
          width: "30px",
          height: "30px",
          borderRadius: "6px !important",
          padding: "0px !important",
        },
        ".hover-text-primary:hover .text-hover": {
          color: theme.palette.primary.main,
        },
        ".code-dialog pre": {
          background: `${theme.palette.primary.light} !important`,
          borderRadius: theme.shape.borderRadius,
        },
        ".hoverCard:hover": {
          scale: "1.01",
          transition: " 0.1s ease-in",
        },
        ".signup-bg": {
          position: "absolute",
          top: 0,
          right: 0,
          height: "100%",
        },
        ".MuiBox-root": {
          borderRadius: theme.shape.borderRadius,
        },
        ".MuiCardHeader-action": {
          alignSelf: "center !important",
        },
        ".emoji-picker-react .emoji-scroll-wrapper": {
          overflowX: "hidden",
        },
        ".scrollbar-container": {
          borderRight: "0 !important",
        },
        ".theme-timeline .MuiTimelineOppositeContent-root": {
          minWidth: "90px",
        },
        ".MuiAlert-root .MuiAlert-icon": {
          color: "inherit!important",
        },
        ".MuiTimelineConnector-root": {
          width: "1px !important",
        },
        " .simplebar-scrollbar:before": {
          background: `${theme.palette.grey[300]} !important`,
        },
        hr: {
          height: "1px",
          border: 0,
          borderTop: `1px solid ${theme.palette.divider}`,
        },
        "@keyframes marquee": {
          "0%": {
            transform: "translate3d(0,0,0)",
          },
          "100% ": {
            transform: "translate3d(-2086px,0,0)",
          },
        },
        "@keyframes marquee2": {
          "0%": {
            transform: "translate3d(-2086px,0,0)",
          },
          "100% ": {
            transform: "translate3d(0,0,0)",
          },
        },
        "@keyframes gradient": {
          "0%": {
            backgroundPosition: "0% 50%",
          },
          "50%": {
            backgroundPosition: " 100% 50%",
          },
          "100% ": {
            backgroundPosition: " 0% 50%",
          },
        },
        ".rounded-bars .apexcharts-bar-series.apexcharts-plot-series .apexcharts-series path":
          {
            clipPath: "inset(0 0 5% 0 round 20px)",
          },
      },
    },
    MuiButtonGroup: {
      styleOverrides: {
        root: {
          boxShadow: "none",
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          ":before": {
            backgroundColor: theme.palette.grey[100],
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiStepConnector: {
      styleOverrides: {
        line: {
          borderColor: theme.palette.divider,
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          boxShadow: "none",
        },
        sizeSmall: {
          width: 30,
          height: 30,
          minHeight: 30,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          "&:hover": {
            backgroundColor: theme.palette.primary.light,
            color: theme.palette.primary.main,
          },
        },
        colorPrimary: {
          "&:hover": {
            backgroundColor: theme.palette.primary.main,
            color: "white",
          },
        },
        colorSecondary: {
          "&:hover": {
            backgroundColor: theme.palette.secondary.main,
            color: "white",
          },
        },
        colorSuccess: {
          "&:hover": {
            backgroundColor: theme.palette.success.main,
            color: "white",
          },
        },
        colorError: {
          "&:hover": {
            backgroundColor: theme.palette.error.main,
            color: "white",
          },
        },
        colorWarning: {
          "&:hover": {
            backgroundColor: theme.palette.warning.main,
            color: "white",
          },
        },
        colorInfo: {
          "&:hover": {
            backgroundColor: theme.palette.info.main,
            color: "white",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          boxShadow: "none",
        },
        text: {
          padding: "5px 15px",
          "&:hover": {
            backgroundColor: theme.palette.primary.light,
            color: theme.palette.primary.main,
          },
        },
        textPrimary: {
          backgroundColor: theme.palette.primary.light,
          "&:hover": {
            backgroundColor: theme.palette.primary.main,
            color: "white",
          },
        },
        textSecondary: {
          backgroundColor: theme.palette.secondary.light,
          "&:hover": {
            backgroundColor: theme.palette.secondary.main,
            color: "white",
          },
        },
        textSuccess: {
          backgroundColor: theme.palette.success.light,
          "&:hover": {
            backgroundColor: theme.palette.success.main,
            color: "white",
          },
        },
        textError: {
          backgroundColor: theme.palette.error.light,
          "&:hover": {
            backgroundColor: theme.palette.error.main,
            color: "white",
          },
        },
        textInfo: {
          backgroundColor: theme.palette.info.light,
          "&:hover": {
            backgroundColor: theme.palette.info.main,
            color: "white",
          },
        },
        textWarning: {
          backgroundColor: theme.palette.warning.light,
          "&:hover": {
            backgroundColor: theme.palette.warning.main,
            color: "white",
          },
        },
        outlinedPrimary: {
          "&:hover": {
            backgroundColor: theme.palette.primary.main,
            color: "white",
          },
        },
        outlinedSecondary: {
          "&:hover": {
            backgroundColor: theme.palette.secondary.main,
            color: "white",
          },
        },
        outlinedError: {
          "&:hover": {
            backgroundColor: theme.palette.error.main,
            color: "white",
          },
        },
        outlinedSuccess: {
          "&:hover": {
            backgroundColor: theme.palette.success.main,
            color: "white",
          },
        },
        outlinedInfo: {
          "&:hover": {
            backgroundColor: theme.palette.info.main,
            color: "white",
          },
        },
        outlinedWarning: {
          "&:hover": {
            backgroundColor: theme.palette.warning.main,
            color: "white",
          },
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          padding: '12px 16px',
        },
        title: {
          fontSize: '1rem',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          width: '100%',
          padding: '12px',
          backgroundImage: "none",
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '16px',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${theme.palette.divider}`,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:last-child td": {
            borderBottom: 0,
          },
        },
      },
    },
    MuiGridItem: {
      styleOverrides: {
        root: {
          paddingTop: '20px',
          paddingLeft: '20px !important',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          backgroundColor: theme.palette.grey[200],
          borderRadius: "6px",
        },
      },
    },
    MuiTimelineConnector: {
      styleOverrides: {
        root: {
          backgroundColor: theme.palette.divider,
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: theme.palette.divider,
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: "0.75rem",
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        filledSuccess: {
          color: "white",
        },
        filledInfo: {
          color: "white",
        },
        filledError: {
          color: "white",
        },
        filledWarning: {
          color: "white",
        },
        standardSuccess: {
          backgroundColor: theme.palette.success.light,
          color: theme.palette.success.main,
        },
        standardError: {
          backgroundColor: theme.palette.error.light,
          color: theme.palette.error.main,
        },
        standardWarning: {
          backgroundColor: theme.palette.warning.light,
          color: theme.palette.warning.main,
        },
        standardInfo: {
          backgroundColor: theme.palette.info.light,
          color: theme.palette.info.main,
        },
        outlinedSuccess: {
          borderColor: theme.palette.success.main,
          color: theme.palette.success.main,
        },
        outlinedWarning: {
          borderColor: theme.palette.warning.main,
          color: theme.palette.warning.main,
        },
        outlinedError: {
          borderColor: theme.palette.error.main,
          color: theme.palette.error.main,
        },
        outlinedInfo: {
          borderColor: theme.palette.info.main,
          color: theme.palette.info.main,
        },
        successIcon: {
          color: theme.palette.info.main,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor:
              theme.palette.mode === "dark"
                ? theme.palette.grey[200]
                : theme.palette.grey[300],
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: theme.palette.grey[300],
          },
        },
        input: {
          padding: '8px 12px',
        },
        inputSizeSmall: {
          padding: '6px 10px',
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            padding: '3px 6px'
          }
        }
      }
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          color: theme.palette.background.paper,
          background: theme.palette.text.primary,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderColor: `${theme.palette.divider}`,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: "1.25rem",
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          boxShadow:
            "rgb(145 158 171 / 30%) 0px 0px 2px 0px, rgb(145 158 171 / 12%) 0px 12px 24px -4px",
        },
      },
    },
  };
};
export default components;